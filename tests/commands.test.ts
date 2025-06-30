import { describe, it, expect, beforeEach } from 'vitest';
import { FileSystemManager } from '../src/core/filesystem/FileSystemManager';
import { FileSystemCommands } from '../src/core/commands/FileSystemCommands';
import { SystemCommands } from '../src/core/commands/SystemCommands';
import { UtilityCommands } from '../src/core/commands/UtilityCommands';

let fsManager: FileSystemManager;
let fsCmds: FileSystemCommands;
let sysCmds: SystemCommands;
let utilCmds: UtilityCommands;
const ts = '2024-01-01T00:00:00Z';

beforeEach(() => {
  fsManager = new FileSystemManager();
  fsCmds = new FileSystemCommands(fsManager);
  sysCmds = new SystemCommands();
  utilCmds = new UtilityCommands();
});

describe('filesystem commands', () => {
  it('pwd prints current directory', () => {
    const res = fsCmds.handlePwd('1', 'pwd', ts);
    expect(res.output).toBe('~/project');
  });

  it('ls lists directory contents', () => {
    const res = fsCmds.handleLs([], '1', 'ls', ts);
    expect(res.output).toContain('Cargo.toml');
  });

  it('cd .. goes up two levels', () => {
    fsCmds.handleCd(['..'], '1', 'cd ..', ts);
    expect(fsManager.getCurrentPath()).toBe('/home');
  });

  it('cd - returns to previous directory', () => {
    fsCmds.handleCd(['src'], '1', 'cd src', ts);
    fsCmds.handleCd(['-'], '1', 'cd -', ts);
    expect(fsManager.getCurrentPath()).toBe('/home/user/project');
    fsCmds.handleCd(['-'], '1', 'cd -', ts);
    expect(fsManager.getCurrentPath()).toBe('/home/user/project/src');
  });

  it('mkdir creates directory', () => {
    const res = fsCmds.handleMkdir(['newdir'], '1', 'mkdir newdir', ts);
    expect(res.exitCode).toBe(0);
    const contents = fsManager.getDirectoryContents('/home/user/project');
    expect(contents.some(i => i.name === 'newdir')).toBe(true);
  });

  it('touch creates file', () => {
    const res = fsCmds.handleTouch(['file.txt'], '1', 'touch file.txt', ts);
    expect(res.exitCode).toBe(0);
    const contents = fsManager.getDirectoryContents('/home/user/project');
    expect(contents.some(i => i.name === 'file.txt')).toBe(true);
  });

  it('cat nonexistent file returns error', () => {
    const res = fsCmds.handleCat(['missing.txt'], '1', 'cat missing.txt', ts);
    expect(res.exitCode).toBe(1);
  });

  it('find lists files recursively', () => {
    const res = fsCmds.handleFind(['.'], '1', 'find .', ts);
    expect(res.output).toContain('/home/user/project/src');
  });

  it('grep finds matching lines', () => {
    fsCmds.handleCd(['src'], '1', 'cd src', ts);
    const res = fsCmds.handleGrep(['Hello', 'main.rs'], '1', 'grep Hello main.rs', ts);
    expect(res.output).toContain('Hello');
  });

  it('vim displays file with line numbers', () => {
    fsCmds.handleCd(['../documents'], '1', 'cd ../documents', ts);
    const res = fsCmds.handleVim(['notes.txt'], '1', 'vim notes.txt', ts);
    expect(res.output).toContain('Vim (read-only): notes.txt');
  });
});

describe('system commands', () => {
  it('echo prints args', () => {
    const res = sysCmds.handleEcho(['hi'], '1', 'echo hi', ts);
    expect(res.output).toBe('hi');
  });

  it('whoami returns user', () => {
    const res = sysCmds.handleWhoami('1', 'whoami', ts);
    expect(res.output).toBe('user');
  });

  it('date returns string', () => {
    const res = sysCmds.handleDate('1', 'date', ts);
    expect(res.output).toContain('GMT');
  });

  it('env shows environment variables', () => {
    const res = sysCmds.handleEnv('1', 'env', ts);
    expect(res.output).toContain('HOME=/home/user');
  });

  it('uptime displays system uptime', () => {
    const res = sysCmds.handleUptime('1', 'uptime', ts);
    expect(res.output).toContain('load average');
  });

  it('hostname returns host name', () => {
    const res = sysCmds.handleHostname('1', 'hostname', ts);
    expect(res.output).toBe('terminal-forge');
  });

  it('which finds builtin command', () => {
    const res = sysCmds.handleWhich(['ls'], '1', 'which ls', ts);
    expect(res.output).toContain('/usr/bin/ls');
  });
});

describe('utility commands', () => {
  it('history returns recent commands', () => {
    utilCmds.addToHistory('ls');
    const res = utilCmds.handleHistory('1', 'history', ts);
    expect(res.output).toContain('ls');
  });

  it('history numbering starts at 1 when less than max entries', () => {
    utilCmds.addToHistory('cd ..');
    const res = utilCmds.handleHistory('1', 'history', ts);
    const firstLine = res.output.split('\n')[0];
    expect(firstLine.trim().startsWith('1:')).toBe(true);
  });

  it('history -c clears command history', () => {
    utilCmds.addToHistory('ls');
    utilCmds.addToHistory('pwd');
    const clearRes = utilCmds.handleHistory('1', 'history -c', ts);
    expect(clearRes.exitCode).toBe(0);
    expect(clearRes.output).toBe('');
    const res = utilCmds.handleHistory('1', 'history', ts);
    expect(res.output).toBe('');
  });

  it('history -n limits output to the last n entries', () => {
    for (let i = 0; i < 5; i++) {
      utilCmds.addToHistory(`cmd${i}`);
    }
    const res = utilCmds.handleHistory('1', 'history -n 3', ts);
    const lines = res.output.split('\n');
    expect(lines).toHaveLength(3);
    const firstLineNumber = parseInt(lines[0].split(':')[0], 10);
    expect(firstLineNumber).toBe(3);
  });

  it('alias lists existing aliases', () => {
    const res = utilCmds.handleAlias([], '1', 'alias', ts);
    expect(res.output).toContain("alias ll='ls -la'");
  });

  it('clear returns clear marker', () => {
    const res = utilCmds.handleClear('1', 'clear', ts);
    expect(res.output).toBe('__CLEAR__');
  });

  it('help shows help text', () => {
    const res = utilCmds.handleHelp('1', 'help', ts);
    expect(res.output).toContain('Available commands');
    expect(res.output).toContain('hostname');
  });
});
