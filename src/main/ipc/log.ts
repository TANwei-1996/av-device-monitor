import { ipcMain } from 'electron';
import { logger } from '../logger';
import { IPC_CHANNELS } from '../../shared/constants';

export function registerLogIPC() {
  ipcMain.handle(IPC_CHANNELS.GET_LOG_ENTRIES, async () => {
    return logger.getEntries();
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_LOGS, async (_event, format: 'txt' | 'json') => {
    return logger.exportLogs(format);
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_LOGS, async () => {
    logger.clear();
    return true;
  });

  logger.info('IPC', 'Log IPC handlers registered');
}
