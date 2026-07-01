// ===== Device Types =====
export interface AudioDeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
  isInput: boolean; // true = microphone, false = speaker
}

export interface VideoDeviceInfo {
  id: string;
  name: string;
  resolutions: ResolutionInfo[];
}

export interface ResolutionInfo {
  width: number;
  height: number;
  frameRates: number[];
}

// ===== USB Device Types =====
export interface USBDeviceInfo {
  vid: string;       // e.g. "0x046d"
  pid: string;       // e.g. "0x0825"
  serialNumber: string;
  manufacturer: string;
  product: string;
  firmwareVersion: string;
  usbVersion: string;  // "2.0" or "3.0"
  deviceClass: number;
  deviceSubclass: number;
  deviceType: string;  // "Audio", "Video", "HID", etc.
  powerMode: string;   // "bus-powered" | "self-powered"
}

export interface MappedDevice {
  usb: USBDeviceInfo | null;
  audio: AudioDeviceInfo | null;
  video: VideoDeviceInfo | null;
}

// ===== Audio Types =====
export interface AudioData {
  samples: Float32Array;
  rms: number;
  peak: number;
  timestamp: number;
}

export interface AudioAnalysis {
  dbfs: number;
  waveform: number[];
  spectrum: number[];
  timestamp: number;
}

// ===== Recording Types =====
export interface RecordingConfig {
  sampleRate: number;
  bitDepth: 8 | 16 | 24 | 32;
  channels: 1 | 2;
  outputDir: string;
}

export interface RecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  fileSize: number;
  filepath: string;
}

export interface RecordingResult {
  filepath: string;
  duration: number;
  fileSize: number;
}

// ===== Log Types =====
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

// ===== EQ Types =====
export interface EQBand {
  frequency: number;
  gain: number;   // -12 to +12 dB
  Q: number;      // Quality factor
}

export interface EQPreset {
  name: string;
  bands: EQBand[];
}

// ===== Settings Types =====
export interface PathConfig {
  logs: string;
  recordings: string;
  config: string;
  temp: string;
}

export interface AppSettings {
  language: 'zh-CN' | 'en-US';
  theme: 'light' | 'dark';
  paths: PathConfig;
}

// ===== IPC Channel Types =====
export interface IpcChannels {
  // Device
  'device:get-audio-devices': () => AudioDeviceInfo[];
  'device:get-video-devices': () => VideoDeviceInfo[];
  'device:get-usb-devices': () => USBDeviceInfo[];
  'device:map-devices': () => MappedDevice[];
  
  // Audio
  'audio:start-capture': (deviceId: string) => void;
  'audio:stop-capture': () => void;
  'audio:set-denoise-level': (level: number) => void;
  'audio:set-eq': (bands: EQBand[]) => void;
  'audio:set-gain': (gain: number) => void;
  
  // Recording
  'recorder:start': (config: RecordingConfig) => string;
  'recorder:stop': () => RecordingResult;
  'recorder:pause': () => void;
  'recorder:resume': () => void;
  'recorder:get-status': () => RecordingStatus;
  
  // Video
  'video:get-stream-info': (deviceId: string) => VideoDeviceInfo;
  
  // Log
  'log:get-entries': () => LogEntry[];
  'log:export': (format: 'txt' | 'json') => string;
  'log:clear': () => void;
  
  // Settings
  'settings:get': () => AppSettings;
  'settings:set': (settings: Partial<AppSettings>) => void;
  'settings:get-paths': () => PathConfig;
  'settings:set-path': (key: keyof PathConfig, value: string) => void;
  'settings:reset-paths': () => void;
  
  // Dialog
  'dialog:open-directory': () => string | null;
}

// ===== IPC Event Types (main → renderer) =====
export interface IpcEvents {
  'audio-data': AudioAnalysis;
  'device-changed': { action: 'attach' | 'detach'; device: USBDeviceInfo };
  'log-entry': LogEntry;
  'recording-status': RecordingStatus;
}
