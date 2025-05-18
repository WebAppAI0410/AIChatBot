import { create } from 'zustand';
import { StateCreator } from 'zustand';
import { StoreSlice } from './types';
import { 
  initDatabase,
  createFolder as dbCreateFolder,
  createNote as dbCreateNote,
  getAllFolders,
  getAllNotes,
  getFolder,
  getNote,
  updateFolder as dbUpdateFolder,
  updateNote as dbUpdateNote,
  deleteFolder as dbDeleteFolder,
  deleteNote as dbDeleteNote,
  createTag as dbCreateTag,
  getAllTags,
  updateTag as dbUpdateTag,
  deleteTag as dbDeleteTag,
  addTagToNote as dbAddTagToNote,
  removeTagFromNote as dbRemoveTagFromNote,
  getNoteTags,
  getNoteTagIds,
  getNotesByTag as dbGetNotesByTag,
  addAttachment as dbAddAttachment,
  getAttachment as dbGetAttachment,
  getNoteAttachments as dbGetNoteAttachments,
  deleteAttachment as dbDeleteAttachment,
  Note,
  Folder,
  Tag,
  NoteAttachment,
  getNotesInFolder
} from '../services/sqlite';

export interface NoteState {
  // 状態
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  currentFolder: string | null;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  initNoteModule: () => Promise<void>;
  
  // フォルダ操作
  loadFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string | null) => Promise<Folder>;
  updateFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  navigateToFolder: (folderId: string | null) => void;
  
  // ノート操作
  loadNotes: () => Promise<void>;
  loadNotesInFolder: (folderId: string | null) => Promise<Note[]>;
  createNote: (note: Partial<Note>) => Promise<string>;
  updateNote: (id: string, changes: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNoteById: (id: string) => Note | undefined;
  
  // タグ操作
  loadTags: () => Promise<void>;
  createTag: (name: string) => Promise<string>;
  updateTag: (id: string, name: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  getTagsForNote: (noteId: string) => Promise<Tag[]>;
  addTagToNote: (noteId: string, tagId: string) => Promise<void>;
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>;
  getNotesByTag: (tagId: string) => Promise<Note[]>;

  // 添付ファイル操作
  addAttachment: (noteId: string, contentType: string, data: string) => Promise<NoteAttachment>;
  getAttachment: (id: string) => Promise<NoteAttachment | null>;
  getNoteAttachments: (noteId: string) => Promise<NoteAttachment[]>;
  deleteAttachment: (id: string) => Promise<void>;
}

export const createNoteSlice: StateCreator<
  StoreSlice,
  [],
  [],
  NoteState
> = (set, get) => ({
  // 初期状態
  notes: [],
  folders: [],
  tags: [],
  currentFolder: null,
  isLoading: false,
  error: null,
  
  // モジュール初期化 - 新しいSQLite APIに対応
  initNoteModule: async () => {
    set({ isLoading: true, error: null });
    try {
      // テーブルの作成
      await initDatabase();
      
      // データのロード
      await get().loadFolders();
      await get().loadNotes();
      await get().loadTags();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to initialize note module:', error);
      set({ 
        error: error instanceof Error ? error.message : '初期化に失敗しました', 
        isLoading: false 
      });
    }
  },
  
  // フォルダ操作
  loadFolders: async () => {
    set({ isLoading: true, error: null });
    try {
      const folders = await getAllFolders();
      set({ folders, isLoading: false });
    } catch (error) {
      console.error('Failed to load folders:', error);
      set({ 
        error: error instanceof Error ? error.message : 'フォルダの読み込みに失敗しました', 
        isLoading: false 
      });
    }
  },
  
  createFolder: async (name, parentId = null) => {
    set({ isLoading: true, error: null });
    try {
      const folder = await dbCreateFolder({ 
        name, 
        parent_id: parentId !== undefined ? parentId : get().currentFolder 
      });
      
      set(state => ({ 
        folders: [...state.folders, folder], 
        isLoading: false 
      }));
      
      return folder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      set({ 
        error: error instanceof Error ? error.message : 'フォルダの作成に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateFolder: async (id, name) => {
    set({ isLoading: true, error: null });
    try {
      await dbUpdateFolder(id, name);
      
      set(state => ({
        folders: state.folders.map(f => 
          f.id === id ? { ...f, name } : f
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update folder:', error);
      set({ 
        error: error instanceof Error ? error.message : 'フォルダの更新に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteFolder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dbDeleteFolder(id);
      
      set(state => ({
        folders: state.folders.filter(f => f.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete folder:', error);
      set({ 
        error: error instanceof Error ? error.message : 'フォルダの削除に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  navigateToFolder: (folderId) => {
    set({ currentFolder: folderId });
    // フォルダ変更時に自動的にそのフォルダ内のノートをロード
    get()
      .loadNotesInFolder(folderId)
      .then((notes) => set({ notes }))
      .catch((e) => console.error(e));
  },
  
  // ノート操作
  loadNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await getAllNotes();
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Failed to load notes:', error);
      set({ 
        error: error instanceof Error ? error.message : 'ノートの読み込みに失敗しました', 
        isLoading: false 
      });
    }
  },

  loadNotesInFolder: async (folderId) => {
    set({ isLoading: true, error: null });
    try {
      const notes = await getNotesInFolder(folderId);
      set({ notes, isLoading: false });
      return notes;
    } catch (error) {
      console.error('Failed to load notes in folder:', error);
      set({ 
        error: error instanceof Error ? error.message : 'フォルダ内のノート読み込みに失敗しました', 
        isLoading: false 
      });
      return [];
    }
  },
  
  createNote: async (noteData) => {
    set({ isLoading: true, error: null });
    try {
      const folder_id = noteData.folder_id !== undefined 
        ? noteData.folder_id 
        : get().currentFolder;
        
      const note = await dbCreateNote({
        title: noteData.title || '無題のノート',
        content: noteData.content || '',
        folder_id
      });
      
      set(state => ({ 
        notes: [note, ...state.notes], 
        isLoading: false 
      }));
      
      return note.id;
    } catch (error) {
      console.error('Failed to create note:', error);
      set({ 
        error: error instanceof Error ? error.message : 'ノートの作成に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateNote: async (id, changes) => {
    set({ isLoading: true, error: null });
    try {
      await dbUpdateNote(id, changes);
      
      set(state => ({
        notes: state.notes.map(n => 
          n.id === id 
            ? { ...n, ...changes, updated_at: new Date().toISOString() } 
            : n
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update note:', error);
      set({ 
        error: error instanceof Error ? error.message : 'ノートの更新に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteNote: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dbDeleteNote(id);
      
      set(state => ({
        notes: state.notes.filter(n => n.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete note:', error);
      set({ 
        error: error instanceof Error ? error.message : 'ノートの削除に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  getNoteById: (id) => {
    return get().notes.find(note => note.id === id);
  },
  
  // タグ操作
  loadTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await getAllTags();
      set({ tags, isLoading: false });
    } catch (error) {
      console.error('Failed to load tags:', error);
      set({ 
        error: error instanceof Error ? error.message : 'タグの読み込みに失敗しました', 
        isLoading: false 
      });
    }
  },
  
  createTag: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const tag = await dbCreateTag(name);
      
      set(state => ({ 
        tags: [...state.tags, tag], 
        isLoading: false 
      }));
      
      return tag.id;
    } catch (error) {
      console.error('Failed to create tag:', error);
      set({ 
        error: error instanceof Error ? error.message : 'タグの作成に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  updateTag: async (id, name) => {
    set({ isLoading: true, error: null });
    try {
      await dbUpdateTag(id, name);
      
      set(state => ({
        tags: state.tags.map(t => 
          t.id === id ? { ...t, name } : t
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update tag:', error);
      set({ 
        error: error instanceof Error ? error.message : 'タグの更新に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  deleteTag: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dbDeleteTag(id);
      
      set(state => ({
        tags: state.tags.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete tag:', error);
      set({ 
        error: error instanceof Error ? error.message : 'タグの削除に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  getTagsForNote: async (noteId) => {
    try {
      return await getNoteTags(noteId);
    } catch (error) {
      console.error('Failed to get tags for note:', error);
      return [];
    }
  },
  
  addTagToNote: async (noteId, tagId) => {
    try {
      await dbAddTagToNote(noteId, tagId);
    } catch (error) {
      console.error('Failed to add tag to note:', error);
      throw error;
    }
  },
  
  removeTagFromNote: async (noteId, tagId) => {
    try {
      await dbRemoveTagFromNote(noteId, tagId);
    } catch (error) {
      console.error('Failed to remove tag from note:', error);
      throw error;
    }
  },
  
  getNotesByTag: async (tagId) => {
    try {
      return await dbGetNotesByTag(tagId);
    } catch (error) {
      console.error('Failed to get notes by tag:', error);
      return [];
    }
  },

  // 添付ファイル操作
  addAttachment: async (noteId, contentType, data) => {
    set({ isLoading: true, error: null });
    try {
      const attachment = await dbAddAttachment(noteId, contentType, data);
      set({ isLoading: false });
      return attachment;
    } catch (error) {
      console.error('Failed to add attachment:', error);
      set({ 
        error: error instanceof Error ? error.message : '添付ファイルの追加に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  },

  getAttachment: async (id) => {
    try {
      return await dbGetAttachment(id);
    } catch (error) {
      console.error('Failed to get attachment:', error);
      return null;
    }
  },

  getNoteAttachments: async (noteId) => {
    try {
      return await dbGetNoteAttachments(noteId);
    } catch (error) {
      console.error('Failed to get note attachments:', error);
      return [];
    }
  },

  deleteAttachment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dbDeleteAttachment(id);
      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      set({ 
        error: error instanceof Error ? error.message : '添付ファイルの削除に失敗しました', 
        isLoading: false 
      });
      throw error;
    }
  }
});

// 単独で使用する場合のフック - 型定義エラーを修正
const createStandaloneNoteStore = () => 
  create<NoteState>((set, get) => 
    createNoteSlice(
      set as any, 
      get as any, 
      {} as any
    )
  );

export const useNoteStore = createStandaloneNoteStore(); 