import { create } from 'zustand';

interface AudioDeviceInfo {
  id: string;
  name: string;
  isDefault: boolean;
  isInput: boolean;
}

interface VideoDeviceInfo {
  id: string;
  name: string;
  resolutions: { width: number; height: number; frameRates: number[] }[];
}

interface USBDeviceInfo {
  vid: string;
  pid: string;
  serialNumber: string;
  manufacturer: string;
  product: string;
  firmwareVersion: string;
  usbVersion: string;
  deviceClass: number;
  deviceSubclass: number;
  deviceType: string;
  powerMode: string;
}

interface DeviceState {
  audioDevices: AudioDeviceInfo[];
  videoDevices: VideoDeviceInfo[];
  usbDevices: USBDeviceInfo[];
  selectedAudioDevice: AudioDeviceInfo | null;
  selectedVideoDevice: VideoDeviceInfo | null;
  isLoading: boolean;
  
  fetchAudioDevices: () => Promise<void>;
  fetchVideoDevices: () => Promise<void>;
  fetchUSBDevices: () => Promise<void>;
  fetchAllDevices: () => Promise<void>;
  selectAudioDevice: (device: AudioDeviceInfo | null) => void;
  selectVideoDevice: (device: VideoDeviceInfo | null) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  audioDevices: [],
  videoDevices: [],
  usbDevices: [],
  selectedAudioDevice: null,
  selectedVideoDevice: null,
  isLoading: false,

  fetchAudioDevices: async () => {
    try {
      const devices = await window.electron.getAudioDevices();
      set({ audioDevices: devices });
      // Auto-select default device
      const defaultDevice = devices.find((d: AudioDeviceInfo) => d.isDefault);
      if (defaultDevice) {
        set({ selectedAudioDevice: defaultDevice });
      }
    } catch (err) {
      console.error('Failed to fetch audio devices:', err);
    }
  },

  fetchVideoDevices: async () => {
    try {
      const devices = await window.electron.getVideoDevices();
      set({ videoDevices: devices });
      if (devices.length > 0) {
        set({ selectedVideoDevice: devices[0] });
      }
    } catch (err) {
      console.error('Failed to fetch video devices:', err);
    }
  },

  fetchUSBDevices: async () => {
    try {
      const devices = await window.electron.getUSBDevices();
      set({ usbDevices: devices });
    } catch (err) {
      console.error('Failed to fetch USB devices:', err);
    }
  },

  fetchAllDevices: async () => {
    set({ isLoading: true });
    try {
      await Promise.all([
        useDeviceStore.getState().fetchAudioDevices(),
        useDeviceStore.getState().fetchVideoDevices(),
        useDeviceStore.getState().fetchUSBDevices(),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },

  selectAudioDevice: (device) => set({ selectedAudioDevice: device }),
  selectVideoDevice: (device) => set({ selectedVideoDevice: device }),
}));
