import { ipcMain } from 'electron';
import { logger } from '../logger';
import { pathManager } from '../config/pathManager';
import { IPC_CHANNELS } from '../../shared/constants';
import type { PathConfig, AppSettings } from '../../shared/types';

// Simple in-memory settings store (persisted via electron-store in production)
let currentSettings: AppSettings = {
  language: 'zh-CN',
  theme: 'dark',
  paths: { logs: '', recordings: '', config: '', temp: '' },
};

export function registerSettingsIPC() {
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, async (): Promise<AppSettings> => {
    currentSettings.paths = pathManager.getAll();
    return { ...currentSettings };
  });

  ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, async (_event, settings: Partial<AppSettings>) => {
    currentSettings = { ...currentSettings, ...settings };
    logger.info('Settings', 'Settings updated', settings);
  });

  ipcMain.handle(IPC_CHANNELS.GET_PATHS, async (): Promise<PathConfig> => {
    return pathManager.getAll();
  });

  ipcMain.handle(IPC_CHANNELS.SET_PATH, async (_event, key: keyof PathConfig, value: string) => {
    pathManager.set(key, value);
    logger.info('Settings', `Path updated: ${key}`, { value });
  });

  ipcMain.handle(IPC_CHANNELS.RESET_PATHS, async () => {
    pathManager.reset();
    logger.info('Settings', 'Paths reset to defaults');
  });

  logger.info('IPC', 'Settings IPC handlers registered');
}
