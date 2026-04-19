const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');
const { Client: SSHClient } = require('ssh2');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

// Allow self-signed certs for Proxmox API calls
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev });
const handle = app.getRequestHandler();

// SSH config
const SSH_PORT = 20788;
const SSH_USER = process.env.SSH_USER || 'ubuntu24';
const SSH_KEY_PATH = process.env.SSH_KEY_PATH || '/root/.ssh/id_ed25519';

// VM IP mapping
const vmIpMap = {
  101: '10.10.10.18', 102: '10.10.10.230', 103: '10.10.10.17',
  106: '10.10.10.15', 107: '10.10.10.16', 108: '198.72.127.240',
  111: '10.10.10.19', 112: '10.10.10.23', 114: '10.10.10.31',
  115: '10.10.10.41', 116: '10.10.10.42', 117: '10.10.10.43',
  118: '10.10.10.44', 119: '10.10.10.51', 120: '10.10.10.32',
  121: '10.10.10.33', 122: '10.10.10.22', 124: '10.10.10.71',
  125: '10.10.10.35', 128: '10.10.10.128', 130: '10.10.10.51',
  131: '10.10.10.53', 200: '10.10.10.200', 201: '10.10.10.201',
};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const [key, ...rest] = c.trim().split('=');
    cookies[key] = rest.join('=');
  });
  return cookies;
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname, query } = parse(req.url, true);

    if (pathname !== '/api/terminal') {
      socket.destroy();
      return;
    }

    // Check auth cookie
    const cookies = parseCookies(req.headers.cookie);
    if (!cookies.cloud360_session) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws, req) => {
    const { query } = parse(req.url, true);
    const vmid = parseInt(query.vmid, 10);
    const ip = vmIpMap[vmid];

    if (!ip) {
      ws.send(JSON.stringify({ type: 'error', data: `Unknown VM ID: ${vmid}` }));
      ws.close(1008, 'Unknown VM');
      return;
    }

    // Check SSH key exists
    let privateKey;
    try {
      privateKey = readFileSync(SSH_KEY_PATH);
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', data: `SSH key not found at ${SSH_KEY_PATH}. Please configure SSH keys on this server.` }));
      ws.close(1011, 'SSH key missing');
      return;
    }

    const ssh = new SSHClient();
    let stream = null;

    ssh.on('ready', () => {
      ws.send(JSON.stringify({ type: 'status', data: 'connected' }));

      ssh.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, s) => {
        if (err) {
          ws.send(JSON.stringify({ type: 'error', data: err.message }));
          ws.close(1011, err.message);
          return;
        }

        stream = s;

        stream.on('data', (data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString('utf-8'));
          }
        });

        stream.on('close', () => {
          ws.close();
        });

        stream.stderr.on('data', (data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.toString('utf-8'));
          }
        });
      });
    });

    ssh.on('error', (err) => {
      ws.send(JSON.stringify({ type: 'error', data: err.message }));
      ws.close();
    });

    ssh.on('close', () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'status', data: 'disconnected' }));
        ws.close();
      }
    });

    ws.on('message', (msg) => {
      if (!stream) return;

      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === 'resize' && parsed.cols && parsed.rows) {
          stream.setWindow(parsed.rows, parsed.cols, 0, 0);
          return;
        }
        if (parsed.type === 'input' && parsed.data) {
          stream.write(parsed.data);
          return;
        }
      } catch {
        // Not JSON, treat as raw input
      }
      stream.write(msg.toString());
    });

    ws.on('close', () => {
      if (stream) stream.close();
      ssh.end();
    });

    ws.on('error', () => {
      if (stream) stream.close();
      ssh.end();
    });

    // Connect to VM via SSH
    ssh.connect({
      host: ip,
      port: SSH_PORT,
      username: SSH_USER,
      privateKey: privateKey,
      readyTimeout: 10000,
      keepaliveInterval: 30000,
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`> Cloud360 Panel ready on port ${port}`);
  });
});
