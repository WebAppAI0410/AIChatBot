import { UserState } from './userStore';
import { ChatState } from './chatStore';
import { SettingsState } from './settingsStore';
import { ImageState } from './imageStore';
import { NoteState } from './noteStore';

/**
 * 全てのストアスライスを結合した型
 * これを各スライスの StateCreator で使用することで循環参照を防ぎます
 */
export type StoreSlice = 
  & UserState 
  & ChatState 
  & SettingsState 
  & ImageState
  & NoteState; 