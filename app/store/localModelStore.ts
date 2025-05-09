import { StateCreator } from 'zustand';

export type LocalModelStatus = 'not_installed' | 'downloading' | 'ready';

export interface LocalModelState {
  localModelStatus: LocalModelStatus;
  downloadProgress: number;
  localModelPath: string | null;
  startDownload: () => void;
  cancelDownload: () => void;
  setLocalModelStatus: (status: LocalModelStatus) => void;
  setDownloadProgress: (progress: number) => void;
  setLocalModelPath: (path: string | null) => void;
}

export const createLocalModelSlice: StateCreator<
  LocalModelState,
  [],
  [],
  LocalModelState
> = (set) => ({
  localModelStatus: 'not_installed',
  downloadProgress: 0,
  localModelPath: null,
  startDownload: () => set({ localModelStatus: 'downloading', downloadProgress: 0 }),
  cancelDownload: () => set({ localModelStatus: 'not_installed', downloadProgress: 0 }),
  setLocalModelStatus: (status) => set({ localModelStatus: status }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  setLocalModelPath: (path) => set({ localModelPath: path }),
});
