import log from 'electron-log';
import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import type { LogLevel, LogEntry } from '../../shared/types';

class Logger {
  private entries: LogEntry[] = [];
  private maxEntries = 1000;
  private logDir = '';
  private initialized = false;
  private entryIdCounter = 0;

  initialize(logDir: string) {
    this.logDir = logDir;
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Configure electron-log
    log.transports.file.resolvePathFn = () => {
      const date = new Date().toISOString().slice(0, 10);
      return path.join(logDir, `app-${date}.log`);
    };
    log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    
    this.initialized = true;
    this.info('Logger', 'Logger initialized', { logDir });
  }

  private addEntry(level: LogLevel, module: string, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      id: `log-${++this.entryIdCounter}`,
      timestamp: Date.now(),
      level,
      module,
      message,
      data,
    };
    
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    
    // Send to renderer
    this.sendToRenderer(entry);
    
    return entry;
  }

  private sendToRenderer(entry: LogEntry) {
    try {
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('log-entry', entry);
        }
      });
    } catch {
      // Ignore if window not ready
    }
  }

  error(module: string, message: string, data?: unknown) {
    const entry = this.addEntry('error', module, message, data);
    log.error(`[${module}] ${message}`, data ?? '');
  }

  warn(module: string, message: string, data?: unknown) {
    const entry = this.addEntry('warn', module, message, data);
    log.warn(`[${module}] ${message}`, data ?? '');
  }

  info(module: string, message: string, data?: unknown) {
    const entry = this.addEntry('info', module, message, data);
    log.info(`[${module}] ${message}`, data ?? '');
  }

  debug(module: string, message: string, data?: unknown) {
    const entry = this.addEntry('debug', module, message, data);
    log.debug(`[${module}] ${message}`, data ?? '');
  }

  trace(module: string, message: string, data?: unknown) {
    const entry = this.addEntry('trace', module, message, data);
    log.verbose(`[${module}] ${message}`, data ?? '');
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
  }

  exportLogs(format: 'txt' | 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.entries, null, 2);
    }
    
    return this.entries.map(entry => {
      const time = new Date(entry.timestamp).toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
      return `[${time}] [${level}] [${entry.module}] ${entry.message}${data}`;
    }).join('\n');
  }
}

export const logger = new Logger();
