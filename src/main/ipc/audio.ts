import { ipcMain } from 'electron';
import { logger } from '../logger';
import { IPC_CHANNELS } from '../../shared/constants';

// Audio capture is now handled entirely in the renderer process using
// the Web Audio API (getUserMedia + AnalyserNode), so the main process
// only keeps these stub handlers for backward compatibility.

export function registerAudioIPC() {
  ipcMain.handle(IPC_CHANNELS.START_AUDIO_CAPTURE, async (_event, deviceId: string) => {
    logger.info('Audio', 'Audio capture start requested (renderer handles)', { deviceId });
  });

  ipcMain.handle(IPC_CHANNELS.STOP_AUDIO_CAPTURE, async () => {
    logger.info('Audio', 'Audio capture stop requested (renderer handles)');
  });

  ipcMain.handle(IPC_CHANNELS.SET_DENOISE_LEVEL, async (_event, level: number) => {
    logger.info('Audio', 'Denoise level set', { level });
  });

  ipcMain.handle(IPC_CHANNELS.SET_EQ, async (_event, bands: any[]) => {
    logger.debug('Audio', 'EQ bands updated', { bandCount: bands.length });
  });

  ipcMain.handle(IPC_CHANNELS.SET_GAIN, async (_event, gain: number) => {
    logger.info('Audio', 'Gain set', { gain });
  });

  logger.info('IPC', 'Audio IPC handlers registered');
}
