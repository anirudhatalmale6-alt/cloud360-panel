'use client';

import { useEffect, useRef, useState } from 'react';
import { VM } from '@/types';
import { vmIpMap } from '@/lib/vm-ips';

interface SSHTerminalProps {
  vm: VM;
  onClose: () => void;
}

export default function SSHTerminal({ vm, onClose }: SSHTerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const terminalRef = useRef<InstanceType<typeof import('xterm').Terminal> | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const ip = vmIpMap[vm.vmid] || 'Unknown';

  useEffect(() => {
    let terminal: InstanceType<typeof import('xterm').Terminal> | null = null;
    let fitAddon: InstanceType<typeof import('xterm-addon-fit').FitAddon> | null = null;
    let ws: WebSocket;

    async function init() {
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');

      terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
        theme: {
          background: '#0d1117',
          foreground: '#c9d1d9',
          cursor: '#58a6ff',
          selectionBackground: '#264f78',
          black: '#0d1117',
          red: '#f85149',
          green: '#3fb950',
          yellow: '#d29922',
          blue: '#58a6ff',
          magenta: '#bc8cff',
          cyan: '#39d353',
          white: '#f0f6fc',
        },
        scrollback: 5000,
      });
      terminalRef.current = terminal;

      fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      if (termRef.current) {
        terminal.open(termRef.current);
        fitAddon.fit();
      }

      terminal.write(`\r\n  Connecting to ${vm.name} (${ip})...\r\n\r\n`);

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}/api/terminal?vmid=${vm.vmid}`);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send initial size
        ws.send(JSON.stringify({ type: 'resize', cols: terminal!.cols, rows: terminal!.rows }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status' && data.data === 'connected') {
            setStatus('connected');
            return;
          }
          if (data.type === 'error') {
            setStatus('error');
            setErrorMsg(data.data);
            terminal!.write(`\r\n\x1b[31mError: ${data.data}\x1b[0m\r\n`);
            return;
          }
        } catch {
          // Not JSON, raw terminal data
        }
        terminal!.write(event.data);
      };

      ws.onclose = () => {
        setStatus('disconnected');
        terminal!.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n');
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorMsg('WebSocket connection failed');
      };

      terminal!.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      });

      terminal!.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      });

      const handleResize = () => fitAddon?.fit();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    init();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (terminalRef.current) terminalRef.current.dispose();
    };
  }, [vm.vmid, vm.name, ip]);

  const statusColors = {
    connecting: 'text-[#d29922]',
    connected: 'text-[#3fb950]',
    error: 'text-[#f85149]',
    disconnected: 'text-[#8b949e]',
  };

  const statusLabels = {
    connecting: 'Connecting...',
    connected: 'Connected',
    error: 'Error',
    disconnected: 'Disconnected',
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0d1117]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#58a6ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <span className="text-sm font-medium text-[#f0f6fc]">{vm.name}</span>
            <span className="text-xs text-[#8b949e] ml-2">({ip})</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${statusColors[status]}`}>
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-[#3fb950] pulse-green' : status === 'connecting' ? 'bg-[#d29922]' : status === 'error' ? 'bg-[#f85149]' : 'bg-[#8b949e]'}`} />
            {statusLabels[status]}
            {errorMsg && <span className="text-[#f85149] ml-1">— {errorMsg}</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors text-sm"
        >
          ✕ Close
        </button>
      </div>

      {/* Terminal */}
      <div ref={termRef} className="flex-1 p-2" />
    </div>
  );
}
