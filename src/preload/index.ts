import { contextBridge, ipcRenderer } from 'electron';

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
  WRITE_RECORDING_SAMPLES: 'recorder:write-samples',
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
  getAudioDevices: () => ipcRenderer.invoke(IPC.GET_AUDIO_DEVICES),
  getVideoDevices: () => ipcRenderer.invoke(IPC.GET_VIDEO_DEVICES),
  getUSBDevices: () => ipcRenderer.invoke(IPC.GET_USB_DEVICES),
  mapDevices: () => ipcRenderer.invoke(IPC.MAP_DEVICES),
  
  // Audio operations
  startAudioCapture: (deviceId: string) => ipcRenderer.invoke(IPC.START_AUDIO_CAPTURE, deviceId),
  stopAudioCapture: () => ipcRenderer.invoke(IPC.STOP_AUDIO_CAPTURE),
  setDenoiseLevel: (level: number) => ipcRenderer.invoke(IPC.SET_DENOISE_LEVEL, level),
  setEQ: (bands: any[]) => ipcRenderer.invoke(IPC.SET_EQ, bands),
  setGain: (gain: number) => ipcRenderer.invoke(IPC.SET_GAIN, gain),
  
  // Recording operations
  startRecording: (config: any) => ipcRenderer.invoke(IPC.START_RECORDING, config),
  stopRecording: () => ipcRenderer.invoke(IPC.STOP_RECORDING),
  pauseRecording: () => ipcRenderer.invoke(IPC.PAUSE_RECORDING),
  resumeRecording: () => ipcRenderer.invoke(IPC.RESUME_RECORDING),
  getRecordingStatus: () => ipcRenderer.invoke(IPC.GET_RECORDING_STATUS),
  writeRecordingSamples: (samples: number[]) => ipcRenderer.send(IPC.WRITE_RECORDING_SAMPLES, samples),
  
  // Log operations
  getLogEntries: () => ipcRenderer.invoke(IPC.GET_LOG_ENTRIES),
  exportLogs: (format: 'txt' | 'json') => ipcRenderer.invoke(IPC.EXPORT_LOGS, format),
  clearLogs: () => ipcRenderer.invoke(IPC.CLEAR_LOGS),
  
  // Settings operations
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  setSettings: (settings: any) => ipcRenderer.invoke(IPC.SET_SETTINGS, settings),
  getPaths: () => ipcRenderer.invoke(IPC.GET_PATHS),
  setPath: (key: string, value: string) => ipcRenderer.invoke(IPC.SET_PATH, key, value),
  resetPaths: () => ipcRenderer.invoke(IPC.RESET_PATHS),
  
  // Dialog
  openDirectory: () => ipcRenderer.invoke(IPC.OPEN_DIRECTORY),
  
  // Event listeners (main → renderer)
  onAudioData: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on(EVENTS.AUDIO_DATA, handler);
    return () => ipcRenderer.removeListener(EVENTS.AUDIO_DATA, handler);
  },
  
  onDeviceChanged: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on(EVENTS.DEVICE_CHANGED, handler);
    return () => ipcRenderer.removeListener(EVENTS.DEVICE_CHANGED, handler);
  },
  
  onLogEntry: (callback: (entry: any) => void) => {
    const handler = (_event: any, entry: any) => callback(entry);
    ipcRenderer.on(EVENTS.LOG_ENTRY, handler);
    return () => ipcRenderer.removeListener(EVENTS.LOG_ENTRY, handler);
  },
  
  onRecordingStatus: (callback: (status: any) => void) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on(EVENTS.RECORDING_STATUS, handler);
    return () => ipcRenderer.removeListener(EVENTS.RECORDING_STATUS, handler);
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);

// Export type for use in renderer
export type ElectronAPI = typeof electronAPI;
