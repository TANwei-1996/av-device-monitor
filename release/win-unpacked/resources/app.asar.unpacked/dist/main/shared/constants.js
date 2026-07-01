"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_VERSION = exports.APP_NAME = exports.IPC_EVENTS = exports.IPC_CHANNELS = exports.USB_DEVICE_CLASSES = exports.USB_VENDORS = exports.LOG_RETENTION_DAYS = exports.LOG_MAX_FILE_SIZE = exports.LOG_MAX_ENTRIES = exports.LOG_LEVELS = exports.EQ_PRESETS = exports.EQ_DEFAULT_Q = exports.EQ_MAX_GAIN = exports.EQ_MIN_GAIN = exports.EQ_FREQUENCIES = exports.DEFAULT_CHANNELS = exports.DEFAULT_BIT_DEPTH = exports.DEFAULT_SAMPLE_RATE = exports.AUDIO_BIT_DEPTHS = exports.AUDIO_SAMPLE_RATES = void 0;
// Audio constants
exports.AUDIO_SAMPLE_RATES = [8000, 16000, 22050, 44100, 48000, 96000];
exports.AUDIO_BIT_DEPTHS = [8, 16, 24, 32];
exports.DEFAULT_SAMPLE_RATE = 48000;
exports.DEFAULT_BIT_DEPTH = 16;
exports.DEFAULT_CHANNELS = 1;
// EQ constants
exports.EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
exports.EQ_MIN_GAIN = -12;
exports.EQ_MAX_GAIN = 12;
exports.EQ_DEFAULT_Q = 1.0;
// EQ Presets
exports.EQ_PRESETS = {
    flat: { name: 'Flat', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    vocalBoost: { name: 'Vocal Boost', gains: [-2, -1, 0, 1, 3, 3, 2, 1, 0, -1] },
    bassBoost: { name: 'Bass Boost', gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
    trebleBoost: { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 1, 2, 3, 4, 5] },
    presence: { name: 'Presence', gains: [0, 0, 0, 0, 1, 3, 4, 3, 1, 0] },
};
// Log constants
exports.LOG_LEVELS = ['error', 'warn', 'info', 'debug', 'trace'];
exports.LOG_MAX_ENTRIES = 1000;
exports.LOG_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
exports.LOG_RETENTION_DAYS = 7;
// USB Vendor Database
exports.USB_VENDORS = {
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
exports.USB_DEVICE_CLASSES = {
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
exports.IPC_CHANNELS = {
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
};
// IPC Events (main → renderer)
exports.IPC_EVENTS = {
    AUDIO_DATA: 'audio-data',
    DEVICE_CHANGED: 'device-changed',
    LOG_ENTRY: 'log-entry',
    RECORDING_STATUS: 'recording-status',
};
// App constants
exports.APP_NAME = 'AV Device Monitor';
exports.APP_VERSION = '1.0.0';
