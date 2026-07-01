"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// IPC channel constants (duplicated here to avoid importing shared in preload)
const IPC = {
    GET_AUDIO_DEVICES: 'device:get-audio-devices',
    GET_VIDEO_DEVICES: 'device:get-video-devices',
    GET_USB_DEVICES: 'device:get-usb-devices',
    MAP_DEVICES: 'device:map-devices',
    START_AUDIO_CAPTURE: 'audio:start-capture',
    STOP_AUDIO_CAPTURE: 'audio:stop-capture',
    SET_DENOISE_LEVEL: 'audio:set-denoise-level',
    SET_EQ: 'audio:set-eq',
    SET_GAIN: 'audio:set-gain',
    START_RECORDING: 'recorder:start',
    STOP_RECORDING: 'recorder:stop',
    PAUSE_RECORDING: 'recorder:pause',
    RESUME_RECORDING: 'recorder:resume',
    GET_RECORDING_STATUS: 'recorder:get-status',
    GET_VIDEO_STREAM_INFO: 'video:get-stream-info',
    GET_LOG_ENTRIES: 'log:get-entries',
    EXPORT_LOGS: 'log:export',
    CLEAR_LOGS: 'log:clear',
    GET_SETTINGS: 'settings:get',
    SET_SETTINGS: 'settings:set',
    GET_PATHS: 'settings:get-paths',
    SET_PATH: 'settings:set-path',
    RESET_PATHS: 'settings:reset-paths',
    OPEN_DIRECTORY: 'dialog:open-directory',
};
// Event names from main to renderer
const EVENTS = {
    AUDIO_DATA: 'audio-data',
    DEVICE_CHANGED: 'device-changed',
    LOG_ENTRY: 'log-entry',
    RECORDING_STATUS: 'recording-status',
};
// Type-safe API exposed to renderer
const electronAPI = {
    // Device operations
    getAudioDevices: () => electron_1.ipcRenderer.invoke(IPC.GET_AUDIO_DEVICES),
    getVideoDevices: () => electron_1.ipcRenderer.invoke(IPC.GET_VIDEO_DEVICES),
    getUSBDevices: () => electron_1.ipcRenderer.invoke(IPC.GET_USB_DEVICES),
    mapDevices: () => electron_1.ipcRenderer.invoke(IPC.MAP_DEVICES),
    // Audio operations
    startAudioCapture: (deviceId) => electron_1.ipcRenderer.invoke(IPC.START_AUDIO_CAPTURE, deviceId),
    stopAudioCapture: () => electron_1.ipcRenderer.invoke(IPC.STOP_AUDIO_CAPTURE),
    setDenoiseLevel: (level) => electron_1.ipcRenderer.invoke(IPC.SET_DENOISE_LEVEL, level),
    setEQ: (bands) => electron_1.ipcRenderer.invoke(IPC.SET_EQ, bands),
    setGain: (gain) => electron_1.ipcRenderer.invoke(IPC.SET_GAIN, gain),
    // Recording operations
    startRecording: (config) => electron_1.ipcRenderer.invoke(IPC.START_RECORDING, config),
    stopRecording: () => electron_1.ipcRenderer.invoke(IPC.STOP_RECORDING),
    pauseRecording: () => electron_1.ipcRenderer.invoke(IPC.PAUSE_RECORDING),
    resumeRecording: () => electron_1.ipcRenderer.invoke(IPC.RESUME_RECORDING),
    getRecordingStatus: () => electron_1.ipcRenderer.invoke(IPC.GET_RECORDING_STATUS),
    // Log operations
    getLogEntries: () => electron_1.ipcRenderer.invoke(IPC.GET_LOG_ENTRIES),
    exportLogs: (format) => electron_1.ipcRenderer.invoke(IPC.EXPORT_LOGS, format),
    clearLogs: () => electron_1.ipcRenderer.invoke(IPC.CLEAR_LOGS),
    // Settings operations
    getSettings: () => electron_1.ipcRenderer.invoke(IPC.GET_SETTINGS),
    setSettings: (settings) => electron_1.ipcRenderer.invoke(IPC.SET_SETTINGS, settings),
    getPaths: () => electron_1.ipcRenderer.invoke(IPC.GET_PATHS),
    setPath: (key, value) => electron_1.ipcRenderer.invoke(IPC.SET_PATH, key, value),
    resetPaths: () => electron_1.ipcRenderer.invoke(IPC.RESET_PATHS),
    // Dialog
    openDirectory: () => electron_1.ipcRenderer.invoke(IPC.OPEN_DIRECTORY),
    // Event listeners (main → renderer)
    onAudioData: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on(EVENTS.AUDIO_DATA, handler);
        return () => electron_1.ipcRenderer.removeListener(EVENTS.AUDIO_DATA, handler);
    },
    onDeviceChanged: (callback) => {
        const handler = (_event, data) => callback(data);
        electron_1.ipcRenderer.on(EVENTS.DEVICE_CHANGED, handler);
        return () => electron_1.ipcRenderer.removeListener(EVENTS.DEVICE_CHANGED, handler);
    },
    onLogEntry: (callback) => {
        const handler = (_event, entry) => callback(entry);
        electron_1.ipcRenderer.on(EVENTS.LOG_ENTRY, handler);
        return () => electron_1.ipcRenderer.removeListener(EVENTS.LOG_ENTRY, handler);
    },
    onRecordingStatus: (callback) => {
        const handler = (_event, status) => callback(status);
        electron_1.ipcRenderer.on(EVENTS.RECORDING_STATUS, handler);
        return () => electron_1.ipcRenderer.removeListener(EVENTS.RECORDING_STATUS, handler);
    },
};
electron_1.contextBridge.exposeInMainWorld('electron', electronAPI);
