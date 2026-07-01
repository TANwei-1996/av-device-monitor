"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAudioIPC = registerAudioIPC;
const electron_1 = require("electron");
const logger_1 = require("../logger");
const constants_1 = require("../../shared/constants");
let isCapturing = false;
let captureInterval = null;
function registerAudioIPC() {
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.START_AUDIO_CAPTURE, async (_event, deviceId) => {
        if (isCapturing) {
            logger_1.logger.warn('Audio', 'Already capturing');
            return;
        }
        isCapturing = true;
        logger_1.logger.info('Audio', 'Starting audio capture', { deviceId });
        // In production, this would use WASAPI native addon
        // For MVP, we simulate audio data and use Web Audio API in renderer
        startAudioCaptureSimulation();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.STOP_AUDIO_CAPTURE, async () => {
        isCapturing = false;
        if (captureInterval) {
            clearInterval(captureInterval);
            captureInterval = null;
        }
        logger_1.logger.info('Audio', 'Audio capture stopped');
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
function startAudioCaptureSimulation() {
    const { BrowserWindow } = require('electron');
    // Simulate audio data at ~30fps
    captureInterval = setInterval(() => {
        if (!isCapturing)
            return;
        // Generate simulated audio data
        const sampleCount = 1024;
        const samples = new Float32Array(sampleCount);
        const time = Date.now() / 1000;
        for (let i = 0; i < sampleCount; i++) {
            // Simulate a mix of frequencies
            samples[i] =
                0.3 * Math.sin(2 * Math.PI * 440 * (time + i / 48000)) +
                    0.2 * Math.sin(2 * Math.PI * 880 * (time + i / 48000)) +
                    0.1 * Math.sin(2 * Math.PI * 1760 * (time + i / 48000));
        }
        // Calculate RMS
        let sumSquares = 0;
        let peak = 0;
        for (let i = 0; i < sampleCount; i++) {
            sumSquares += samples[i] * samples[i];
            peak = Math.max(peak, Math.abs(samples[i]));
        }
        const rms = Math.sqrt(sumSquares / sampleCount);
        const dbfs = 20 * Math.log10(rms + 1e-10);
        // Generate waveform data (downsampled)
        const waveformLength = 200;
        const waveform = [];
        const step = Math.floor(sampleCount / waveformLength);
        for (let i = 0; i < waveformLength; i++) {
            waveform.push(samples[i * step]);
        }
        // Simple spectrum (frequency bins)
        const spectrumLength = 64;
        const spectrum = [];
        for (let i = 0; i < spectrumLength; i++) {
            const binStart = Math.floor(i * sampleCount / spectrumLength);
            const binEnd = Math.floor((i + 1) * sampleCount / spectrumLength);
            let binRms = 0;
            for (let j = binStart; j < binEnd; j++) {
                binRms += samples[j] * samples[j];
            }
            binRms = Math.sqrt(binRms / (binEnd - binStart));
            spectrum.push(binRms);
        }
        try {
            BrowserWindow.getAllWindows().forEach((win) => {
                if (!win.isDestroyed()) {
                    win.webContents.send('audio-data', {
                        dbfs,
                        waveform,
                        spectrum,
                        timestamp: Date.now(),
                    });
                }
            });
        }
        catch {
            // Window might be destroyed
        }
    }, 33); // ~30fps
}
