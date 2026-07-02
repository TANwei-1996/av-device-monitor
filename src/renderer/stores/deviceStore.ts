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

// Common resolutions to assign to video devices
const COMMON_RESOLUTIONS = [
  { width: 1920, height: 1080, frameRates: [30, 60] },
  { width: 1280, height: 720, frameRates: [30, 60] },
  { width: 640, height: 480, frameRates: [30, 60] },
];

export const useDeviceStore = create<DeviceState>((set, get) => ({
  audioDevices: [],
  videoDevices: [],
  usbDevices: [],
  selectedAudioDevice: null,
  selectedVideoDevice: null,
  isLoading: false,

  // Use browser's native enumerateDevices() for real audio endpoints
  fetchAudioDevices: async () => {
    try {
      // Request permission first (needed on some browsers)
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach((t) => t.stop());
      } catch {
        // Permission denied or no device — continue with enumeration
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs: AudioDeviceInfo[] = [];
      let defaultId = '';

      // The first audioinput with empty label is treated as default
      for (const d of devices) {
        if (d.kind === 'audioinput') {
          if (!defaultId) defaultId = d.deviceId;
          audioInputs.push({
            id: d.deviceId,
            name: d.label || `Microphone ${audioInputs.length + 1}`,
            isDefault: d.deviceId === 'default' || (!defaultId),
            isInput: true,
          });
        }
      }

      // Mark the first one as default if no 'default' deviceId found
      if (audioInputs.length > 0 && !audioInputs.some((d) => d.isDefault)) {
        audioInputs[0].isDefault = true;
      }

      set({ audioDevices: audioInputs });

      // Auto-select default device, or keep current selection
      const current = get().selectedAudioDevice;
      if (current) {
        const still = audioInputs.find((d) => d.id === current.id);
        if (still) {
          set({ selectedAudioDevice: still });
        } else {
          const def = audioInputs.find((d) => d.isDefault) || audioInputs[0] || null;
          set({ selectedAudioDevice: def });
        }
      } else {
        const def = audioInputs.find((d) => d.isDefault) || audioInputs[0] || null;
        set({ selectedAudioDevice: def });
      }
    } catch (err) {
      console.error('Failed to fetch audio devices:', err);
    }
  },

  // Use browser's native enumerateDevices() for real video devices
  fetchVideoDevices: async () => {
    try {
      // Request permission first
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach((t) => t.stop());
      } catch {
        // Permission denied or no device — continue with enumeration
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs: VideoDeviceInfo[] = [];

      for (const d of devices) {
        if (d.kind === 'videoinput') {
          videoInputs.push({
            id: d.deviceId,
            name: d.label || `Camera ${videoInputs.length + 1}`,
            resolutions: [...COMMON_RESOLUTIONS],
          });
        }
      }

      set({ videoDevices: videoInputs });

      // Auto-select first device, or keep current selection
      const current = get().selectedVideoDevice;
      if (current) {
        const still = videoInputs.find((d) => d.id === current.id);
        if (still) {
          set({ selectedVideoDevice: still });
        } else {
          set({ selectedVideoDevice: videoInputs[0] || null });
        }
      } else if (videoInputs.length > 0) {
        set({ selectedVideoDevice: videoInputs[0] });
      }
    } catch (err) {
      console.error('Failed to fetch video devices:', err);
    }
  },

  // USB devices still come from main process (needs native access)
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
        get().fetchAudioDevices(),
        get().fetchVideoDevices(),
        get().fetchUSBDevices(),
      ]);
    } finally {
      set({ isLoading: false });
    }
  },

  selectAudioDevice: (device) => set({ selectedAudioDevice: device }),
  selectVideoDevice: (device) => set({ selectedVideoDevice: device }),
}));
