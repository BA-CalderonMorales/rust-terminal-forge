
interface FileSystemNode {
  type: 'file' | 'directory';
  name: string;
  size?: number;
  permissions: string;
  lastModified: string;
}

interface FileSystem {
  [path: string]: FileSystemNode[];
}

export class FileSystemManager {
  private currentPath: string = '/home/user/project';
  private previousPath: string = '/home/user/project';
  private readonly homeDirectory: string = '/home/user';
  private readonly allowedPaths: Set<string> = new Set([
    '/home',
    '/home/user',
    '/home/user/project',
    '/home/user/project/src',
    '/home/user/project/target',
    '/home/user/documents',
    '/tmp'
  ]);

  private fileSystem: FileSystem = {
    '/home': [
      { type: 'directory', name: 'user', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:30' }
    ],
    '/home/user': [
      { type: 'directory', name: 'project', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:30' },
      { type: 'directory', name: 'documents', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 09:15' },
      { type: 'file', name: '.bashrc', size: 1024, permissions: '-rw-r--r--', lastModified: '2024-01-10 14:20' }
    ],
    '/home/user/project': [
      { type: 'file', name: 'Cargo.toml', size: 456, permissions: '-rw-r--r--', lastModified: '2024-01-15 10:30' },
      { type: 'directory', name: 'src', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:25' },
      { type: 'directory', name: 'target', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:28' },
      { type: 'file', name: 'README.md', size: 2048, permissions: '-rw-r--r--', lastModified: '2024-01-15 09:45' }
    ],
    '/home/user/project/src': [
      { type: 'file', name: 'main.rs', size: 1536, permissions: '-rw-r--r--', lastModified: '2024-01-15 10:25' },
      { type: 'file', name: 'lib.rs', size: 512, permissions: '-rw-r--r--', lastModified: '2024-01-15 09:30' }
    ],
    '/home/user/project/target': [
      { type: 'directory', name: 'debug', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:28' },
      { type: 'directory', name: 'release', permissions: 'drwxr-xr-x', lastModified: '2024-01-15 10:00' }
    ],
    '/home/user/documents': [
      { type: 'file', name: 'notes.txt', size: 1024, permissions: '-rw-r--r--', lastModified: '2024-01-14 16:20' }
    ]
  };

  validatePath(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    
    return this.allowedPaths.has(normalizedPath) || 
           Array.from(this.allowedPaths).some(allowed => {
             const resolvedPath = this.resolvePath(normalizedPath);
             const resolvedAllowed = this.resolvePath(allowed);
             return resolvedPath.startsWith(resolvedAllowed + '/') || resolvedPath === resolvedAllowed;
           });
  }

  resolvePath(path: string): string {
    const parts = path.split('/').filter(part => part !== '');
    const resolved: string[] = [];
    
    for (const part of parts) {
      if (part === '.' || part === '') {
        continue;
      } else if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    
    return '/' + resolved.join('/');
  }

  normalizePath(path: string): string {
    if (path.startsWith('/')) {
      return this.resolvePath(path);
    }
    
    if (path === '~') {
      return this.homeDirectory;
    }
    
    if (path.startsWith('~/')) {
      return this.resolvePath(path.replace('~', this.homeDirectory));
    }
    
    const fullPath = this.currentPath + '/' + path;
    return this.resolvePath(fullPath);
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  getDisplayPath(): string {
    if (this.currentPath === this.homeDirectory) {
      return '~';
    }
    if (this.currentPath.startsWith(this.homeDirectory + '/')) {
      return '~' + this.currentPath.substring(this.homeDirectory.length);
    }
    return this.currentPath;
  }

  setCurrentPath(path: string): void {
    this.previousPath = this.currentPath;
    this.currentPath = path;
  }

  getPreviousPath(): string {
    return this.previousPath;
  }

  getHomeDirectory(): string {
    return this.homeDirectory;
  }

  getFileSystem(): FileSystem {
    return { ...this.fileSystem };
  }

  getDirectoryContents(path: string): FileSystemNode[] {
    return this.fileSystem[path] || [];
  }

  addFileSystemNode(path: string, node: FileSystemNode): void {
    if (!this.fileSystem[path]) {
      this.fileSystem[path] = [];
    }
    this.fileSystem[path].push(node);
  }

  createDirectory(path: string): void {
    this.fileSystem[path] = [];
  }

  updateFileTimestamp(path: string, fileName: string): void {
    const contents = this.fileSystem[path];
    if (contents) {
      const file = contents.find(item => item.name === fileName);
      if (file) {
        file.lastModified = new Date().toISOString().slice(0, 16).replace('T', ' ');
      }
    }
  }
}
