"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAudioIPC = registerAudioIPC;
const electron_1 = require("electron");
const logger_1 = require("../logger");
const constants_1 = require("../../shared/constants");
// Audio capture is now handled entirely in the renderer process using
// the Web Audio API (getUserMedia + AnalyserNode), so the main process
// only keeps these stub handlers for backward compatibility.
function registerAudioIPC() {
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.START_AUDIO_CAPTURE, async (_event, deviceId) => {
        logger_1.logger.info('Audio', 'Audio capture start requested (renderer handles)', { deviceId });
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.STOP_AUDIO_CAPTURE, async () => {
        logger_1.logger.info('Audio', 'Audio capture stop requested (renderer handles)');
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SET_DENOISE_LEVEL, async (_event, level) => {
        logger_1.logger.info('Audio', 'Denoise level set', { level });
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SET_EQ, async (_event, bands) => {
        logger_1.logger.debug('Audio', 'EQ bands updated', { bandCount: bands.length });
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SET_GAIN, async (_event, gain) => {
        logger_1.logger.info('Audio', 'Gain set', { gain });
    });
    logger_1.logger.info('IPC', 'Audio IPC handlers registered');
}
