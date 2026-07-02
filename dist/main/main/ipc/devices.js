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
exports.registerDeviceIPC = registerDeviceIPC;
const electron_1 = require("electron");
const logger_1 = require("../logger");
const constants_1 = require("../../shared/constants");
function registerDeviceIPC() {
    // Audio & video device enumeration is now done in the renderer process
    // via navigator.mediaDevices.enumerateDevices() for accurate endpoint info.
    // These handlers remain as fallbacks returning empty arrays.
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.GET_AUDIO_DEVICES, async () => {
        logger_1.logger.debug('Device', 'Audio device request (renderer handles enumeration)');
        return [];
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.GET_VIDEO_DEVICES, async () => {
        logger_1.logger.debug('Device', 'Video device request (renderer handles enumeration)');
        return [];
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.GET_USB_DEVICES, async () => {
        try {
            logger_1.logger.info('Device', 'Enumerating USB devices');
            return await enumerateUSBDevices();
        }
        catch (err) {
            logger_1.logger.error('Device', 'Failed to enumerate USB devices', err);
            return [];
        }
    });
    logger_1.logger.info('IPC', 'Device IPC handlers registered');
}
async function enumerateUSBDevices() {
    try {
        const usb = await Promise.resolve().then(() => __importStar(require('usb')));
        const deviceList = usb.getDeviceList();
        const results = [];
        for (const device of deviceList) {
            try {
                device.open();
                const desc = device.deviceDescriptor;
                let manufacturer = '';
                let product = '';
                let serialNumber = '';
                if (desc.iManufacturer) {
                    manufacturer = await new Promise((resolve) => {
                        device.getStringDescriptor(desc.iManufacturer, (err, val) => {
                            resolve(err ? '' : (val || ''));
                        });
                    });
                }
                if (desc.iProduct) {
                    product = await new Promise((resolve) => {
                        device.getStringDescriptor(desc.iProduct, (err, val) => {
                            resolve(err ? '' : (val || ''));
                        });
                    });
                }
                if (desc.iSerialNumber) {
                    serialNumber = await new Promise((resolve) => {
                        device.getStringDescriptor(desc.iSerialNumber, (err, val) => {
                            resolve(err ? '' : (val || ''));
                        });
                    });
                }
                const vid = '0x' + desc.idVendor.toString(16).padStart(4, '0');
                const pid = '0x' + desc.idProduct.toString(16).padStart(4, '0');
                const classInfo = getDeviceClassInfo(desc.bDeviceClass);
                results.push({
                    vid,
                    pid,
                    serialNumber,
                    manufacturer,
                    product,
                    firmwareVersion: (desc.bcdDevice >> 8) + '.' + (desc.bcdDevice & 0xFF),
                    usbVersion: desc.bcdUSB >= 0x0300 ? '3.0' : '2.0',
                    deviceClass: desc.bDeviceClass,
                    deviceSubclass: desc.bDeviceSubClass,
                    deviceType: classInfo.type,
                    powerMode: 'bus-powered',
                });
                device.close();
            }
            catch (err) {
                const desc = device.deviceDescriptor;
                const vid = '0x' + desc.idVendor.toString(16).padStart(4, '0');
                const pid = '0x' + desc.idProduct.toString(16).padStart(4, '0');
                results.push({
                    vid,
                    pid,
                    serialNumber: '',
                    manufacturer: '',
                    product: '',
                    firmwareVersion: '',
                    usbVersion: desc.bcdUSB >= 0x0300 ? '3.0' : '2.0',
                    deviceClass: desc.bDeviceClass,
                    deviceSubclass: desc.bDeviceSubClass,
                    deviceType: getDeviceClassInfo(desc.bDeviceClass).type,
                    powerMode: 'unknown',
                });
            }
        }
        return results;
    }
    catch (err) {
        logger_1.logger.error('Device', 'USB enumeration failed', err);
        return [];
    }
}
function getDeviceClassInfo(classCode) {
    const classMap = {
        0x00: { type: 'Use Interface Descriptor', icon: 'usb' },
        0x01: { type: 'Audio', icon: 'audio' },
        0x02: { type: 'Communications', icon: 'phone' },
        0x03: { type: 'HID', icon: 'keyboard' },
        0x08: { type: 'Mass Storage', icon: 'usb' },
        0x0E: { type: 'Video', icon: 'video-camera' },
        0x0F: { type: 'Personal Healthcare', icon: 'heart' },
        0x10: { type: 'Audio/Video Devices', icon: 'play-circle' },
        0xE0: { type: 'Wireless Controller', icon: 'wifi' },
        0xEF: { type: 'Miscellaneous', icon: 'appstore' },
        0xFE: { type: 'Application Specific', icon: 'appstore' },
        0xFF: { type: 'Vendor Specific', icon: 'tool' },
    };
    return classMap[classCode] || { type: 'Unknown', icon: 'question' };
}
