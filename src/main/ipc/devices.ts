import { ipcMain } from 'electron';
import { logger } from '../logger';
import type { AudioDeviceInfo, VideoDeviceInfo, USBDeviceInfo } from '../../shared/types';
import { IPC_CHANNELS } from '../../shared/constants';

export function registerDeviceIPC() {
  // Audio & video device enumeration is now done in the renderer process
  // via navigator.mediaDevices.enumerateDevices() for accurate endpoint info.
  // These handlers remain as fallbacks returning empty arrays.
  ipcMain.handle(IPC_CHANNELS.GET_AUDIO_DEVICES, async (): Promise<AudioDeviceInfo[]> => {
    logger.debug('Device', 'Audio device request (renderer handles enumeration)');
    return [];
  });

  ipcMain.handle(IPC_CHANNELS.GET_VIDEO_DEVICES, async (): Promise<VideoDeviceInfo[]> => {
    logger.debug('Device', 'Video device request (renderer handles enumeration)');
    return [];
  });

  ipcMain.handle(IPC_CHANNELS.GET_USB_DEVICES, async (): Promise<USBDeviceInfo[]> => {
    try {
      logger.info('Device', 'Enumerating USB devices');
      return await enumerateUSBDevices();
    } catch (err) {
      logger.error('Device', 'Failed to enumerate USB devices', err);
      return [];
    }
  });

  logger.info('IPC', 'Device IPC handlers registered');
}

async function enumerateUSBDevices(): Promise<USBDeviceInfo[]> {
  try {
    const usb = await import('usb');
    const deviceList = usb.getDeviceList();
    const results: USBDeviceInfo[] = [];

    for (const device of deviceList) {
      try {
        device.open();
        const desc = device.deviceDescriptor;

        let manufacturer = '';
        let product = '';
        let serialNumber = '';

        if (desc.iManufacturer) {
          manufacturer = await new Promise<string>((resolve) => {
            device.getStringDescriptor(desc.iManufacturer, (err: any, val: any) => {
              resolve(err ? '' : (val || ''));
            });
          });
        }

        if (desc.iProduct) {
          product = await new Promise<string>((resolve) => {
            device.getStringDescriptor(desc.iProduct, (err: any, val: any) => {
              resolve(err ? '' : (val || ''));
            });
          });
        }

        if (desc.iSerialNumber) {
          serialNumber = await new Promise<string>((resolve) => {
            device.getStringDescriptor(desc.iSerialNumber, (err: any, val: any) => {
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
      } catch (err) {
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
  } catch (err) {
    logger.error('Device', 'USB enumeration failed', err);
    return [];
  }
}

function getDeviceClassInfo(classCode: number): { type: string; icon: string } {
  const classMap: Record<number, { type: string; icon: string }> = {
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
