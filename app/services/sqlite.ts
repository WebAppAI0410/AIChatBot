import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { SQLiteDatabase } from 'expo-sqlite';

// 型定義
export type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type NoteTag = {
  note_id: string;
  tag_id: string;
};

// シングルトンとしてデータベース参照を保持
let _db: SQLiteDatabase | null = null;

// データベースのセット
export const setDatabase = (db: SQLiteDatabase) => {
  _db = db;
};

// データベース参照の取得
export const getDatabase = (): SQLiteDatabase => {
  if (!_db) {
    if (Platform.OS === 'web') {
      throw new Error('SQLite is not supported on web');
    }
    throw new Error('Database not initialized. Make sure to wrap your app with SQLiteProvider.');
  }
  return _db;
};

// 初期化処理
export const initDatabase = async (): Promise<void> => {
  const db = getDatabase();
  
  try {
    // フォルダテーブル作成
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE
      );
    `);
    
    // ノートテーブル作成
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        folder_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE CASCADE
      );
    `);
    
    // タグテーブル作成
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
    `);
    
    // ノートとタグの関連テーブル作成
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// フォルダ操作
export const createFolder = async (folder: Omit<Folder, 'id' | 'created_at' | 'updated_at'>): Promise<Folder> => {
  const db = getDatabase();
  const id = `folder_${uuidv4()}`;
  const now = new Date().toISOString();
  
  const stmt = await db.prepareAsync(
    `INSERT INTO folders (id, name, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
  );
  
  await stmt.executeAsync([id, folder.name, folder.parent_id, now, now]);
  await stmt.finalizeAsync();
  
  return {
    id,
    name: folder.name,
    parent_id: folder.parent_id,
    created_at: now,
    updated_at: now
  };
};

export const getAllFolders = async (): Promise<Folder[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<Folder>(`SELECT * FROM folders ORDER BY name`);
  return result;
};

export const getFolder = async (id: string): Promise<Folder | null> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<Folder>(`SELECT * FROM folders WHERE id = ?`, [id]);
  return result || null;
};

export const updateFolder = async (id: string, name: string): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const stmt = await db.prepareAsync(
    `UPDATE folders SET name = ?, updated_at = ? WHERE id = ?`
  );
  
  await stmt.executeAsync([name, now, id]);
  await stmt.finalizeAsync();
};

export const deleteFolder = async (id: string): Promise<void> => {
  const db = getDatabase();
  
  const stmt = await db.prepareAsync(`DELETE FROM folders WHERE id = ?`);
  await stmt.executeAsync([id]);
  await stmt.finalizeAsync();
};

// ノート操作
export const createNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note> => {
  const db = getDatabase();
  const id = `note_${uuidv4()}`;
  const now = new Date().toISOString();
  
  const stmt = await db.prepareAsync(
    `INSERT INTO notes (id, title, content, folder_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
  );
  
  await stmt.executeAsync([id, note.title, note.content, note.folder_id, now, now]);
  await stmt.finalizeAsync();
  
  return {
    id,
    title: note.title,
    content: note.content,
    folder_id: note.folder_id,
    created_at: now,
    updated_at: now
  };
};

export const getAllNotes = async (): Promise<Note[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<Note>(`SELECT * FROM notes ORDER BY updated_at DESC`);
  return result;
};

export const getNote = async (id: string): Promise<Note | null> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<Note>(`SELECT * FROM notes WHERE id = ?`, [id]);
  return result || null;
};

export const updateNote = async (id: string, changes: Partial<Note>): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  // 現在のノートを取得
  const note = await getNote(id);
  if (!note) {
    throw new Error('Note not found');
  }
  
  // 変更を適用
  const updated = {
    ...note,
    ...changes,
    updated_at: now
  };
  
  const stmt = await db.prepareAsync(
    `UPDATE notes SET title = ?, content = ?, folder_id = ?, updated_at = ? WHERE id = ?`
  );
  
  await stmt.executeAsync([updated.title, updated.content, updated.folder_id, now, id]);
  await stmt.finalizeAsync();
};

export const deleteNote = async (id: string): Promise<void> => {
  const db = getDatabase();
  
  const stmt = await db.prepareAsync(`DELETE FROM notes WHERE id = ?`);
  await stmt.executeAsync([id]);
  await stmt.finalizeAsync();
};

// タグ操作
export const createTag = async (name: string): Promise<Tag> => {
  const db = getDatabase();
  const id = `tag_${uuidv4()}`;
  
  const stmt = await db.prepareAsync(`INSERT INTO tags (id, name) VALUES (?, ?)`);
  await stmt.executeAsync([id, name]);
  await stmt.finalizeAsync();
  
  return { id, name };
};

export const getAllTags = async (): Promise<Tag[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<Tag>(`SELECT * FROM tags ORDER BY name`);
  return result;
};

export const updateTag = async (id: string, name: string): Promise<void> => {
  const db = getDatabase();
  
  const stmt = await db.prepareAsync(`UPDATE tags SET name = ? WHERE id = ?`);
  await stmt.executeAsync([name, id]);
  await stmt.finalizeAsync();
};

export const deleteTag = async (id: string): Promise<void> => {
  const db = getDatabase();
  
  const stmt = await db.prepareAsync(`DELETE FROM tags WHERE id = ?`);
  await stmt.executeAsync([id]);
  await stmt.finalizeAsync();
};

// ノート・タグ関連操作
export const addTagToNote = async (noteId: string, tagId: string): Promise<void> => {
  const db = getDatabase();
  
  const stmt = await db.prepareAsync(
    `INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`
  );
  
  await stmt.executeAsync([noteId, tagId]);
  await stmt.finalizeAsync();
};

export const removeTagFromNote = async (noteId: string, tagId: string): Promise<void> => {
  const db = getDatabase();
  
  const stmt = await db.prepareAsync(
    `DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?`
  );
  
  await stmt.executeAsync([noteId, tagId]);
  await stmt.finalizeAsync();
};

export const getNoteTagIds = async (noteId: string): Promise<string[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<{tag_id: string}>(
    `SELECT tag_id FROM note_tags WHERE note_id = ?`, 
    [noteId]
  );
  
  return result.map(r => r.tag_id);
};

export const getNoteTags = async (noteId: string): Promise<Tag[]> => {
  const db = getDatabase();
  return await db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     JOIN note_tags nt ON t.id = nt.tag_id
     WHERE nt.note_id = ?
     ORDER BY t.name`,
    [noteId]
  );
};

export const getNotesByTag = async (tagId: string): Promise<Note[]> => {
  const db = getDatabase();
  return await db.getAllAsync<Note>(
    `SELECT n.* FROM notes n
     JOIN note_tags nt ON n.id = nt.note_id
     WHERE nt.tag_id = ?
     ORDER BY n.updated_at DESC`,
    [tagId]
  );
}; 