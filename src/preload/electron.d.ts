// Type declaration for window.electron API
interface ElectronAPI {
  getAudioDevices(): Promise<any[]>;
  getVideoDevices(): Promise<any[]>;
  getUSBDevices(): Promise<any[]>;
  mapDevices(): Promise<any[]>;
  
  startAudioCapture(deviceId: string): Promise<void>;
  stopAudioCapture(): Promise<void>;
  setDenoiseLevel(level: number): Promise<void>;
  setEQ(bands: any[]): Promise<void>;
  setGain(gain: number): Promise<void>;
  
  startRecording(config: any): Promise<string>;
  stopRecording(): Promise<{ filepath: string; duration: number; fileSize: number }>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  getRecordingStatus(): Promise<any>;
  
  getLogEntries(): Promise<any[]>;
  exportLogs(format: 'txt' | 'json'): Promise<string>;
  clearLogs(): Promise<boolean>;
  
  getSettings(): Promise<any>;
  setSettings(settings: any): Promise<void>;
  getPaths(): Promise<any>;
  setPath(key: string, value: string): Promise<void>;
  resetPaths(): Promise<void>;
  
  openDirectory(): Promise<string | null>;
  
  onAudioData(callback: (data: any) => void): () => void;
  onDeviceChanged(callback: (data: any) => void): () => void;
  onLogEntry(callback: (entry: any) => void): () => void;
  onRecordingStatus(callback: (status: any) => void): () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
