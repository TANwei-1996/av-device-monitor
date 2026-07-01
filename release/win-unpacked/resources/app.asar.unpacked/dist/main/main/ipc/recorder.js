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
exports.recorder = void 0;
exports.registerRecorderIPC = registerRecorderIPC;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../logger");
const constants_1 = require("../../shared/constants");
class AudioRecorder {
    isRecording = false;
    isPaused = false;
    writeStream = null;
    startTime = 0;
    totalBytes = 0;
    config = null;
    filepath = '';
    writeWavHeader(config, dataSize = 0) {
        const header = Buffer.alloc(44);
        const byteRate = config.sampleRate * config.channels * (config.bitDepth / 8);
        const blockAlign = config.channels * (config.bitDepth / 8);
        // RIFF header
        header.write('RIFF', 0);
        header.writeUInt32LE(36 + dataSize, 4);
        header.write('WAVE', 8);
        // fmt chunk
        header.write('fmt ', 12);
        header.writeUInt32LE(16, 16);
        header.writeUInt16LE(1, 20); // PCM
        header.writeUInt16LE(config.channels, 22);
        header.writeUInt32LE(config.sampleRate, 24);
        header.writeUInt32LE(byteRate, 28);
        header.writeUInt16LE(blockAlign, 32);
        header.writeUInt16LE(config.bitDepth, 34);
        // data chunk
        header.write('data', 36);
        header.writeUInt32LE(dataSize, 40);
        return header;
    }
    async start(config) {
        if (this.isRecording) {
            throw new Error('Already recording');
        }
        this.config = config;
        // Ensure output directory exists
        if (!fs.existsSync(config.outputDir)) {
            fs.mkdirSync(config.outputDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `recording_${timestamp}.wav`;
        this.filepath = path.join(config.outputDir, filename);
        this.writeStream = fs.createWriteStream(this.filepath);
        this.writeStream.write(this.writeWavHeader(config));
        this.totalBytes = 0;
        this.startTime = Date.now();
        this.isRecording = true;
        this.isPaused = false;
        logger_1.logger.info('Recorder', 'Started recording', { filepath: this.filepath, config });
        return this.filepath;
    }
    writeSamples(samples) {
        if (!this.isRecording || this.isPaused || !this.writeStream || !this.config)
            return;
        let buffer;
        if (this.config.bitDepth === 16) {
            const output = Buffer.alloc(samples.length * 2);
            for (let i = 0; i < samples.length; i++) {
                const s = Math.max(-1, Math.min(1, samples[i]));
                output.writeInt16LE(Math.round(s * 32767), i * 2);
            }
            buffer = output;
        }
        else if (this.config.bitDepth === 24) {
            buffer = Buffer.alloc(samples.length * 3);
            for (let i = 0; i < samples.length; i++) {
                const s = Math.max(-1, Math.min(1, samples[i]));
                const val = Math.round(s * 8388607);
                buffer[i * 3] = val & 0xFF;
                buffer[i * 3 + 1] = (val >> 8) & 0xFF;
                buffer[i * 3 + 2] = (val >> 16) & 0xFF;
            }
        }
        else if (this.config.bitDepth === 32) {
            buffer = Buffer.from(samples.buffer);
        }
        else {
            // 8-bit
            buffer = Buffer.alloc(samples.length);
            for (let i = 0; i < samples.length; i++) {
                buffer[i] = Math.round((samples[i] + 1) * 127.5);
            }
        }
        this.writeStream.write(buffer);
        this.totalBytes += buffer.length;
    }
    async stop() {
        if (!this.isRecording || !this.writeStream || !this.config) {
            throw new Error('Not recording');
        }
        this.isRecording = false;
        this.isPaused = false;
        // Finalize WAV file - update header with actual size
        // We need to close and reopen to write the header
        this.writeStream.end();
        // Wait for stream to finish, then update header
        await new Promise((resolve) => {
            const updateHeader = () => {
                const fd = fs.openSync(this.filepath, 'r+');
                const header = this.writeWavHeader(this.config, this.totalBytes);
                fs.writeSync(fd, header, 0, 44, 0);
                fs.closeSync(fd);
                resolve();
            };
            // Small delay to ensure stream is closed
            setTimeout(updateHeader, 100);
        });
        const duration = (Date.now() - this.startTime) / 1000;
        const fileSize = 44 + this.totalBytes;
        logger_1.logger.info('Recorder', 'Recording stopped', {
            filepath: this.filepath,
            duration: duration.toFixed(1) + 's',
            fileSize: (fileSize / 1024 / 1024).toFixed(2) + 'MB'
        });
        return { filepath: this.filepath, duration, fileSize };
    }
    pause() {
        this.isPaused = true;
        logger_1.logger.info('Recorder', 'Recording paused');
    }
    resume() {
        this.isPaused = false;
        logger_1.logger.info('Recorder', 'Recording resumed');
    }
    getStatus() {
        return {
            isRecording: this.isRecording,
            isPaused: this.isPaused,
            duration: this.isRecording ? (Date.now() - this.startTime) / 1000 : 0,
            fileSize: 44 + this.totalBytes,
            filepath: this.filepath,
        };
    }
}
const recorder = new AudioRecorder();
exports.recorder = recorder;
function registerRecorderIPC() {
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.START_RECORDING, async (_event, config) => {
        return recorder.start(config);
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.STOP_RECORDING, async () => {
        return recorder.stop();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.PAUSE_RECORDING, async () => {
        recorder.pause();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.RESUME_RECORDING, async () => {
        recorder.resume();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.GET_RECORDING_STATUS, async () => {
        return recorder.getStatus();
    });
    logger_1.logger.info('IPC', 'Recorder IPC handlers registered');
}
