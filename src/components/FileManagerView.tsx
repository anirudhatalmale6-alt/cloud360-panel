'use client';

import { useState, useEffect, useCallback } from 'react';
import { VM } from '@/types';

interface FileEntry {
  name: string;
  isDir: boolean;
  isLink: boolean;
  size: number;
  permissions: string;
  modified: string;
  path: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(file: FileEntry): string {
  if (file.isDir) return '📁';
  if (file.isLink) return '🔗';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'php', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h'].includes(ext || '')) return '📄';
  if (['json', 'yaml', 'yml', 'xml', 'toml', 'ini', 'conf', 'cfg', 'env'].includes(ext || '')) return '⚙️';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(ext || '')) return '🖼️';
  if (['log', 'txt', 'md', 'csv'].includes(ext || '')) return '📝';
  if (['sh', 'bash', 'zsh'].includes(ext || '')) return '⚡';
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext || '')) return '📦';
  return '📄';
}

interface FileManagerViewProps {
  vms: VM[];
}

export default function FileManagerView({ vms }: FileManagerViewProps) {
  const [selectedVM, setSelectedVM] = useState<string>('');
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);

  const runningVMs = vms.filter(v => v.status === 'running');

  const fetchFiles = useCallback(async () => {
    if (!selectedVM) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/files?vmid=${selectedVM}&path=${encodeURIComponent(currentPath)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load files');
        setFiles([]);
      }
    } catch {
      setError('Failed to connect to file API');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [selectedVM, currentPath]);

  useEffect(() => {
    if (selectedVM) {
      fetchFiles();
    }
  }, [selectedVM, currentPath, fetchFiles]);

  const navigateTo = (path: string) => {
    setFileContent(null);
    setViewingFile(null);
    setCurrentPath(path);
  };

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    navigateTo('/' + parts.join('/') || '/');
  };

  const handleFileClick = async (file: FileEntry) => {
    if (file.isDir) {
      navigateTo(file.path);
    } else if (file.size < 1024 * 512) {
      // View small files (< 512KB)
      setViewingFile(file.name);
      try {
        const res = await fetch(`/api/files/read?vmid=${selectedVM}&path=${encodeURIComponent(file.path)}`);
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content || '');
        } else {
          setFileContent('Error: Unable to read file');
        }
      } catch {
        setFileContent('Error: Failed to read file');
      }
    }
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="space-y-6">
      {/* VM Selector */}
      <div className="flex items-center gap-4">
        <select
          value={selectedVM}
          onChange={e => { setSelectedVM(e.target.value); setCurrentPath('/'); setFiles([]); setFileContent(null); setViewingFile(null); }}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2.5 text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] min-w-[300px]"
        >
          <option value="">Select a VM...</option>
          {runningVMs.map(vm => (
            <option key={vm.vmid} value={vm.vmid.toString()}>
              VM {vm.vmid} — {vm.name}
            </option>
          ))}
        </select>

        {selectedVM && (
          <button
            onClick={fetchFiles}
            className="px-3 py-2.5 rounded-lg bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] transition-colors text-sm"
          >
            ↻ Refresh
          </button>
        )}
      </div>

      {!selectedVM && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-[#30363d] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-[#8b949e]">Select a running VM to browse its files</p>
        </div>
      )}

      {selectedVM && (
        <>
          {/* Breadcrumb + Path */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
            <button
              onClick={() => navigateTo('/')}
              className="text-[#58a6ff] hover:underline font-mono"
            >
              /
            </button>
            {breadcrumbs.map((part, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-[#484f58]">/</span>
                <button
                  onClick={() => navigateTo('/' + breadcrumbs.slice(0, i + 1).join('/'))}
                  className="text-[#58a6ff] hover:underline font-mono"
                >
                  {part}
                </button>
              </span>
            ))}
            {loading && (
              <div className="ml-auto w-4 h-4 border-2 border-[#58a6ff] border-t-transparent rounded-full spin-slow" />
            )}
          </div>

          {error && (
            <div className="bg-[#161b22] border border-[#f85149]/30 rounded-xl p-4">
              <p className="text-sm text-[#f85149]">{error}</p>
            </div>
          )}

          {/* File List */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            {/* Go up */}
            {currentPath !== '/' && (
              <button
                onClick={goUp}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#21262d] transition-colors text-left border-b border-[#21262d]"
              >
                <span className="text-base">⬆️</span>
                <span className="text-sm text-[#58a6ff] font-mono">..</span>
              </button>
            )}

            {/* Directories first, then files */}
            {[...files]
              .sort((a, b) => {
                if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map((file, i) => (
                <button
                  key={i}
                  onClick={() => handleFileClick(file)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#21262d] transition-colors text-left border-b border-[#21262d] last:border-0"
                >
                  <span className="text-base flex-shrink-0">{getFileIcon(file)}</span>
                  <span className={`text-sm font-mono flex-1 truncate ${file.isDir ? 'text-[#58a6ff]' : 'text-[#c9d1d9]'}`}>
                    {file.name}
                  </span>
                  <span className="text-xs text-[#484f58] font-mono w-20 text-right flex-shrink-0">
                    {file.isDir ? '' : formatBytes(file.size)}
                  </span>
                  <span className="text-xs text-[#484f58] font-mono w-32 text-right flex-shrink-0 hidden md:block">
                    {file.permissions}
                  </span>
                  <span className="text-xs text-[#484f58] w-36 text-right flex-shrink-0 hidden lg:block">
                    {file.modified}
                  </span>
                </button>
              ))}

            {!loading && files.length === 0 && !error && (
              <div className="p-8 text-center text-[#8b949e] text-sm">
                Empty directory
              </div>
            )}
          </div>

          {/* File Viewer */}
          {viewingFile && fileContent !== null && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262d]">
                <span className="text-sm text-[#f0f6fc] font-medium">{viewingFile}</span>
                <button
                  onClick={() => { setViewingFile(null); setFileContent(null); }}
                  className="text-[#8b949e] hover:text-[#f0f6fc] text-sm"
                >
                  ✕ Close
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-[#c9d1d9] overflow-x-auto max-h-96 overflow-y-auto whitespace-pre">
                {fileContent}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
