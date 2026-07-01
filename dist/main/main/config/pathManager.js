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
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathManager = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class PathManager {
    config = null;
    configPath = '';
    initialize() {
        this.configPath = path.join(electron_1.app.getPath('userData'), 'path-config.json');
        this.config = this.loadConfig();
        this.ensureDirectories();
    }
    loadConfig() {
        const defaults = this.getDefaults();
        if (fs.existsSync(this.configPath)) {
            try {
                const saved = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
                return { ...defaults, ...saved };
            }
            catch {
                return defaults;
            }
        }
        return defaults;
    }
    getDefaults() {
        const userData = electron_1.app.getPath('userData');
        const userHome = electron_1.app.getPath('home');
        return {
            logs: path.join(userData, 'logs'),
            recordings: path.join(userHome, 'Recordings'),
            config: path.join(userData, 'config.json'),
            temp: path.join(electron_1.app.getPath('temp'), 'AVMonitor'),
        };
    }
    ensureDirectories() {
        if (!this.config)
            return;
        const dirs = [
            this.config.logs,
            this.config.recordings,
            this.config.temp,
        ];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    get(key) {
        if (!this.config)
            throw new Error('PathManager not initialized');
        return this.config[key];
    }
    set(key, value) {
        if (!this.config)
            throw new Error('PathManager not initialized');
        this.config[key] = value;
        this.save();
        this.ensureDirectories();
    }
    reset() {
        this.config = this.getDefaults();
        this.save();
        this.ensureDirectories();
    }
    getAll() {
        if (!this.config)
            throw new Error('PathManager not initialized');
        return { ...this.config };
    }
    save() {
        if (!this.config)
            return;
        const dir = path.dirname(this.configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    }
}
exports.pathManager = new PathManager();
