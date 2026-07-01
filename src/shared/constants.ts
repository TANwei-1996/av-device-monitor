// Audio constants
export const AUDIO_SAMPLE_RATES = [8000, 16000, 22050, 44100, 48000, 96000] as const;
export const AUDIO_BIT_DEPTHS = [8, 16, 24, 32] as const;
export const DEFAULT_SAMPLE_RATE = 48000;
export const DEFAULT_BIT_DEPTH = 16;
export const DEFAULT_CHANNELS = 1;

// EQ constants
export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const EQ_MIN_GAIN = -12;
export const EQ_MAX_GAIN = 12;
export const EQ_DEFAULT_Q = 1.0;

// EQ Presets
export const EQ_PRESETS = {
  flat: { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  vocalBoost: { name: 'Vocal Boost', gains: [-2, -1, 0, 1, 3, 3, 2, 1, 0, -1] },
  bassBoost: { name: 'Bass Boost', gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  trebleBoost: { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 1, 2, 3, 4, 5] },
  presence: { name: 'Presence', gains: [0, 0, 0, 0, 1, 3, 4, 3, 1, 0] },
} as const;

// Log constants
export const LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'trace'] as const;
export const LOG_MAX_ENTRIES = 1000;
export const LOG_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const LOG_RETENTION_DAYS = 7;

// USB Vendor Database
export const USB_VENDORS: Record<string, { name: string; country: string }> = {
  '046d': { name: 'Logitech', country: 'Switzerland' },
  '045e': { name: 'Microsoft', country: 'USA' },
  '046a': { name: 'Cherry GmbH', country: 'Germany' },
  '0bda': { name: 'Realtek', country: 'Taiwan' },
  '05a3': { name: 'ARC International', country: 'USA' },
  '1bcf': { name: 'Sunplus Innovation Technology', country: 'Taiwan' },
  '0c45': { name: 'Microdia', country: 'Taiwan' },
  '5986': { name: 'Acer', country: 'Taiwan' },
  '174f': { name: 'Syntek', country: 'Taiwan' },
  '1d6b': { name: 'Linux Foundation', country: 'USA' },
  '0951': { name: 'Kingston Technology', country: 'USA' },
  '04d9': { name: 'Holtek Semiconductor', country: 'Taiwan' },
  '0a12': { name: 'Cambridge Silicon Radio', country: 'UK' },
  '0d8c': { name: 'C-Media Electronics', country: 'Taiwan' },
  '1395': { name: 'Sennheiser Communications', country: 'Germany' },
  '0fd9': { name: 'Elgato Systems', country: 'Germany' },
  '3842': { name: 'EVGA', country: 'USA' },
  '041e': { name: 'Creative Technology', country: 'Singapore' },
  '0b05': { name: 'ASUSTek Computer', country: 'Taiwan' },
  '1532': { name: 'Razer', country: 'Singapore' },
};

// USB Device Class Map
export const USB_DEVICE_CLASSES: Record<number, { type: string; icon: string }> = {
  0x00: { type: 'Use Interface Descriptor', icon: 'usb' },
  0x01: { type: 'Audio', icon: 'audio' },
  0x02: { type: 'Communications', icon: 'phone' },
  0x03: { type: 'HID', icon: 'keyboard' },
  0x05: { type: 'Physical', icon: 'experiment' },
  0x06: { type: 'Image', icon: 'picture' },
  0x07: { type: 'Printer', icon: 'printer' },
  0x08: { type: 'Mass Storage', icon: 'usb' },
  0x09: { type: 'Hub', icon: 'api' },
  0x0A: { type: 'CDC-Data', icon: 'database' },
  0x0B: { type: 'Smart Card', icon: 'credit-card' },
  0x0D: { type: 'Content Security', icon: 'lock' },
  0x0E: { type: 'Video', icon: 'video-camera' },
  0x0F: { type: 'Personal Healthcare', icon: 'heart' },
  0x10: { type: 'Audio/Video Devices', icon: 'play-circle' },
  0xDC: { type: 'Diagnostic Device', icon: 'tool' },
  0xE0: { type: 'Wireless Controller', icon: 'wifi' },
  0xEF: { type: 'Miscellaneous', icon: 'appstore' },
  0xFE: { type: 'Application Specific', icon: 'appstore' },
  0xFF: { type: 'Vendor Specific', icon: 'tool' },
};

// IPC Channels
export const IPC_CHANNELS = {
  // Device
  GET_AUDIO_DEVICES: 'device:get-audio-devices',
  GET_VIDEO_DEVICES: 'device:get-video-devices',
  GET_USB_DEVICES: 'device:get-usb-devices',
  MAP_DEVICES: 'device:map-devices',
  
  // Audio
  START_AUDIO_CAPTURE: 'audio:start-capture',
  STOP_AUDIO_CAPTURE: 'audio:stop-capture',
  SET_DENOISE_LEVEL: 'audio:set-denoise-level',
  SET_EQ: 'audio:set-eq',
  SET_GAIN: 'audio:set-gain',
  
  // Recording
  START_RECORDING: 'recorder:start',
  STOP_RECORDING: 'recorder:stop',
  PAUSE_RECORDING: 'recorder:pause',
  RESUME_RECORDING: 'recorder:resume',
  GET_RECORDING_STATUS: 'recorder:get-status',
  
  // Video
  GET_VIDEO_STREAM_INFO: 'video:get-stream-info',
  
  // Log
  GET_LOG_ENTRIES: 'log:get-entries',
  EXPORT_LOGS: 'log:export',
  CLEAR_LOGS: 'log:clear',
  
  // Settings
  GET_SETTINGS: 'settings:get',
  SET_SETTINGS: 'settings:set',
  GET_PATHS: 'settings:get-paths',
  SET_PATH: 'settings:set-path',
  RESET_PATHS: 'settings:reset-paths',
  
  // Dialog
  OPEN_DIRECTORY: 'dialog:open-directory',
} as const;

// IPC Events (main → renderer)
export const IPC_EVENTS = {
  AUDIO_DATA: 'audio-data',
  DEVICE_CHANGED: 'device-changed',
  LOG_ENTRY: 'log-entry',
  RECORDING_STATUS: 'recording-status',
} as const;

// App constants
export const APP_NAME = 'AV Device Monitor';
export const APP_VERSION = '1.0.0';
