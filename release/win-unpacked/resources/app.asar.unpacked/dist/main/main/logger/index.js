"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
class Logger {
    entries = [];
    maxEntries = 1000;
    logDir = '';
    initialized = false;
    entryIdCounter = 0;
    initialize(logDir) {
        this.logDir = logDir;
        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        // Configure electron-log
        electron_log_1.default.transports.file.resolvePathFn = () => {
            const date = new Date().toISOString().slice(0, 10);
            return path.join(logDir, `app-${date}.log`);
        };
        electron_log_1.default.transports.file.maxSize = 10 * 1024 * 1024; // 10MB
        electron_log_1.default.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
        this.initialized = true;
        this.info('Logger', 'Logger initialized', { logDir });
    }
    addEntry(level, module, message, data) {
        const entry = {
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
    sendToRenderer(entry) {
        try {
            electron_1.BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send('log-entry', entry);
                }
            });
        }
        catch {
            // Ignore if window not ready
        }
    }
    error(module, message, data) {
        const entry = this.addEntry('error', module, message, data);
        electron_log_1.default.error(`[${module}] ${message}`, data ?? '');
    }
    warn(module, message, data) {
        const entry = this.addEntry('warn', module, message, data);
        electron_log_1.default.warn(`[${module}] ${message}`, data ?? '');
    }
    info(module, message, data) {
        const entry = this.addEntry('info', module, message, data);
        electron_log_1.default.info(`[${module}] ${message}`, data ?? '');
    }
    debug(module, message, data) {
        const entry = this.addEntry('debug', module, message, data);
        electron_log_1.default.debug(`[${module}] ${message}`, data ?? '');
    }
    trace(module, message, data) {
        const entry = this.addEntry('trace', module, message, data);
        electron_log_1.default.verbose(`[${module}] ${message}`, data ?? '');
    }
    getEntries() {
        return [...this.entries];
    }
    clear() {
        this.entries = [];
    }
    exportLogs(format) {
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
exports.logger = new Logger();
