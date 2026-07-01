import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { logger } from './logger';
import { registerDeviceIPC } from './ipc/devices';
import { registerAudioIPC } from './ipc/audio';
import { registerRecorderIPC } from './ipc/recorder';
import { registerLogIPC } from './ipc/log';
import { registerSettingsIPC } from './ipc/settings';
import { pathManager } from './config/pathManager';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  logger.info('Main', 'Main window created');
}

app.whenReady().then(() => {
  // Initialize path manager
  pathManager.initialize();
  
  // Initialize logger
  logger.initialize(pathManager.get('logs'));
  
  // Create window
  createWindow();
  
  // Register IPC handlers
  registerDeviceIPC();
  registerAudioIPC();
  registerRecorderIPC();
  registerLogIPC();
  registerSettingsIPC();
  
  // Register dialog IPC
  ipcMain.handle('dialog:open-directory', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    return result.filePaths[0] || null;
  });
  
  logger.info('Main', 'Application started');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
