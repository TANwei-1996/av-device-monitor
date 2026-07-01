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
exports.getMainWindow = getMainWindow;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const logger_1 = require("./logger");
const devices_1 = require("./ipc/devices");
const audio_1 = require("./ipc/audio");
const recorder_1 = require("./ipc/recorder");
const log_1 = require("./ipc/log");
const settings_1 = require("./ipc/settings");
const pathManager_1 = require("./config/pathManager");
const isDev = !electron_1.app.isPackaged;
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'AV Device Monitor',
        webPreferences: {
            preload: path.join(__dirname, '../../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    logger_1.logger.info('Main', 'Main window created');
}
electron_1.app.whenReady().then(() => {
    // Initialize path manager
    pathManager_1.pathManager.initialize();
    // Initialize logger
    logger_1.logger.initialize(pathManager_1.pathManager.get('logs'));
    // Create window
    createWindow();
    // Register IPC handlers
    (0, devices_1.registerDeviceIPC)();
    (0, audio_1.registerAudioIPC)();
    (0, recorder_1.registerRecorderIPC)();
    (0, log_1.registerLogIPC)();
    (0, settings_1.registerSettingsIPC)();
    // Register dialog IPC
    electron_1.ipcMain.handle('dialog:open-directory', async () => {
        if (!mainWindow)
            return null;
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
        });
        return result.filePaths[0] || null;
    });
    logger_1.logger.info('Main', 'Application started');
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
function getMainWindow() {
    return mainWindow;
}
