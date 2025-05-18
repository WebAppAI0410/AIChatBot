import { Platform } from 'react-native';
import { generateUuid } from '../store/chatStore';
import { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as pako from 'pako';

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
  is_compressed?: boolean; // 圧縮フラグ
};

// データベース操作用のNoteDB型（is_compressedをnumber型に）
export type NoteDB = Omit<Note, 'is_compressed'> & {
  is_compressed: number;
};

export type Tag = {
  id: string;
  name: string;
};

export type NoteTag = {
  note_id: string;
  tag_id: string;
};

export type NoteAttachment = {
  id: string;
  note_id: string;
  content_type: string;
  data: string; // Base64エンコードされたデータ
  created_at: string;
};

export type DbVersion = {
  version: number;
  applied_at: string;
};

// 現在のデータベースバージョン
export const CURRENT_DB_VERSION = 2;

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
    console.log('データベースの初期化を開始します...');
    
    // データベースバージョン管理テーブル
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS db_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
    
    // 現在のバージョンを確認
    const versionResult = await db.getFirstAsync<{version: number}>(`
      SELECT version FROM db_version ORDER BY version DESC LIMIT 1
    `);
    
    const currentVersion = versionResult?.version || 0;
    console.log(`現在のデータベースバージョン: ${currentVersion}, ターゲットバージョン: ${CURRENT_DB_VERSION}`);
    
    // マイグレーション実行
    if (currentVersion < CURRENT_DB_VERSION) {
      console.log(`マイグレーションを実行します (${currentVersion} → ${CURRENT_DB_VERSION})...`);
      await runMigrations(currentVersion);
      console.log('マイグレーションが完了しました');
    } else {
      console.log('マイグレーションは不要です');
    }
    
    // テーブル構造を確認（デバッグ用）
    const tableInfo = await db.getAllAsync<{name: string}>(`PRAGMA table_info(notes)`);
    console.log('notesテーブルのカラム:', tableInfo.map(col => col.name).join(', '));
    
    console.log('データベースの初期化が完了しました');
  } catch (error) {
    console.error('データベース初期化エラー:', error);
    throw error;
  }
};

// マイグレーション実行
const runMigrations = async (fromVersion: number): Promise<void> => {
  if (fromVersion >= CURRENT_DB_VERSION) {
    return; // マイグレーション不要
  }
  
  const db = getDatabase();
  
  try {
    // トランザクション開始
    await db.execAsync('BEGIN TRANSACTION');
    
    // バージョン1のマイグレーション（初期スキーマ）
    if (fromVersion < 1) {
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
          is_compressed INTEGER DEFAULT 0,
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
      
      // 画像添付テーブル作成
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS note_attachments (
          id TEXT PRIMARY KEY,
          note_id TEXT NOT NULL,
          content_type TEXT NOT NULL,
          data BLOB NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
        );
      `);
      
      // 検索最適化のためのインデックス作成
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);');
      
      // バージョン記録
      await recordMigration(1);
    }
    
    // バージョン2のマイグレーション（既存テーブルにカラム追加）
    if (fromVersion < 2) {
      console.log('マイグレーション: バージョン2を適用します');
      
      // notesテーブルにis_compressedカラムが存在するかチェック
      const columnInfo = await db.getAllAsync<{name: string}>(`PRAGMA table_info(notes)`);
      const hasCompressedColumn = columnInfo.some(col => col.name === 'is_compressed');
      
      // カラムが存在しない場合のみ追加
      if (!hasCompressedColumn) {
        try {
          console.log('notesテーブルにis_compressedカラムを追加します');
          await db.execAsync(`
            ALTER TABLE notes 
            ADD COLUMN is_compressed INTEGER DEFAULT 0;
          `);
          console.log('is_compressedカラムの追加が完了しました');
        } catch (e) {
          // カラム追加のエラーをログに記録
          console.error('is_compressedカラム追加エラー:', e);
          // トランザクションはロールバックされるのでスローします
          throw e;
        }
      } else {
        console.log('is_compressedカラムは既に存在しています。スキップします。');
      }
      
      // バージョン記録
      await recordMigration(2);
    }
    
    // 将来のバージョンマイグレーションはここに追加
    
    // トランザクション完了
    await db.execAsync('COMMIT');
  } catch (error) {
    // エラー時はロールバック
    await db.execAsync('ROLLBACK');
    console.error('Migration error:', error);
    throw error;
  }
};

// マイグレーション記録
const recordMigration = async (version: number): Promise<void> => {
  const db = getDatabase();
  const now = new Date().toISOString();
  
  const stmt = await db.prepareAsync(
    'INSERT INTO db_version (version, applied_at) VALUES (?, ?)'
  );
  
  await stmt.executeAsync([version, now]);
  await stmt.finalizeAsync();
};

// フォルダ操作
export const createFolder = async (folder: Omit<Folder, 'id' | 'created_at' | 'updated_at'>): Promise<Folder> => {
  const db = getDatabase();
  const id = `folder_${generateUuid()}`;
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

// コンテンツ圧縮処理
const compressContent = (content: string): string => {
  try {
    // 文字列からUint8Arrayを作成して圧縮し、base64文字列に変換
    const compressed = Buffer.from(pako.deflate(content)).toString('base64');
    return compressed;
  } catch (error) {
    console.error('Content compression error:', error);
    return content; // 圧縮失敗時は元のコンテンツを返す
  }
};

// コンテンツ解凍処理
const decompressContent = (compressed: string, isCompressed: boolean): string => {
  if (!isCompressed) return compressed;
  
  try {
    // base64文字列からバイナリデータに変換して解凍
    const data = Buffer.from(compressed, 'base64');
    const decompressed = new TextDecoder().decode(pako.inflate(data));
    return decompressed;
  } catch (error) {
    console.error('Content decompression error:', error);
    return compressed; // 解凍失敗時は圧縮されたコンテンツを返す
  }
};

// ノート操作（圧縮機能対応）
export const createNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note> => {
  const db = getDatabase();
  const id = `note_${generateUuid()}`;
  const now = new Date().toISOString();
  
  // 大きいコンテンツは圧縮
  const shouldCompress = note.content.length > 10000; // 10KB以上は圧縮
  const content = shouldCompress ? compressContent(note.content) : note.content;
  
  const stmt = await db.prepareAsync(
    `INSERT INTO notes (id, title, content, folder_id, created_at, updated_at, is_compressed) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  
  await stmt.executeAsync([id, note.title, content, note.folder_id, now, now, shouldCompress ? 1 : 0]);
  await stmt.finalizeAsync();
  
  return {
    id,
    title: note.title,
    content: note.content, // 元のコンテンツを返す
    folder_id: note.folder_id,
    created_at: now,
    updated_at: now,
    is_compressed: shouldCompress
  };
};

export const getAllNotes = async (): Promise<Note[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<NoteDB>(`SELECT * FROM notes ORDER BY updated_at DESC`);
  
  // 圧縮されたコンテンツの解凍
  return result.map(note => ({
    id: note.id,
    title: note.title,
    content: decompressContent(note.content, note.is_compressed === 1),
    folder_id: note.folder_id,
    created_at: note.created_at,
    updated_at: note.updated_at,
    is_compressed: note.is_compressed === 1
  }));
};

export const getNotesInFolder = async (folderId: string | null): Promise<Note[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<NoteDB>(
    `SELECT * FROM notes WHERE folder_id ${folderId === null ? 'IS NULL' : '= ?'} 
     ORDER BY updated_at DESC`,
    folderId !== null ? [folderId] : []
  );
  
  // 圧縮されたコンテンツの解凍
  return result.map(note => ({
    id: note.id,
    title: note.title,
    content: decompressContent(note.content, note.is_compressed === 1),
    folder_id: note.folder_id,
    created_at: note.created_at,
    updated_at: note.updated_at,
    is_compressed: note.is_compressed === 1
  }));
};

export const getNote = async (id: string): Promise<Note | null> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<NoteDB>(`SELECT * FROM notes WHERE id = ?`, [id]);
  
  if (!result) return null;
  
  // 圧縮されたコンテンツの解凍
  return {
    id: result.id,
    title: result.title,
    content: decompressContent(result.content, result.is_compressed === 1),
    folder_id: result.folder_id,
    created_at: result.created_at,
    updated_at: result.updated_at,
    is_compressed: result.is_compressed === 1
  };
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
  const updatedNote = {
    ...note,
    ...changes,
    updated_at: now
  };
  
  // コンテンツが大きい場合は圧縮
  const content = changes.content || note.content;
  const shouldCompress = content.length > 10000; // 10KB以上は圧縮
  const compressedContent = shouldCompress ? compressContent(content) : content;
  
  const stmt = await db.prepareAsync(
    `UPDATE notes SET 
      title = ?, 
      content = ?, 
      folder_id = ?, 
      updated_at = ?,
      is_compressed = ?
     WHERE id = ?`
  );
  
  await stmt.executeAsync([
    updatedNote.title, 
    compressedContent, 
    updatedNote.folder_id, 
    now, 
    shouldCompress ? 1 : 0,
    id
  ]);
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
  const id = `tag_${generateUuid()}`;
  
  try {
    const stmt = await db.prepareAsync(`INSERT INTO tags (id, name) VALUES (?, ?)`);
    await stmt.executeAsync([id, name]);
    await stmt.finalizeAsync();
    
    return { id, name };
  } catch (err: any) {
    // UNIQUE制約違反の場合は既存のタグを返す
    if (err.message?.includes('UNIQUE')) {
      const existingTag = await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE name = ?', [name]);
      if (existingTag) {
        return existingTag;
      }
    }
    // その他のエラーは再スロー
    throw err;
  }
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
  const result = await db.getAllAsync<NoteDB>(
    `SELECT n.* FROM notes n
     JOIN note_tags nt ON n.id = nt.note_id
     WHERE nt.tag_id = ?
     ORDER BY n.updated_at DESC`,
    [tagId]
  );
  
  // 圧縮されたコンテンツの解凍
  return result.map(note => ({
    id: note.id,
    title: note.title,
    content: decompressContent(note.content, note.is_compressed === 1),
    folder_id: note.folder_id,
    created_at: note.created_at,
    updated_at: note.updated_at,
    is_compressed: note.is_compressed === 1
  }));
};

// 添付ファイル操作
export const addAttachment = async (
  noteId: string, 
  contentType: string, 
  data: string
): Promise<NoteAttachment> => {
  const db = getDatabase();
  const id = `attachment_${generateUuid()}`;
  const now = new Date().toISOString();
  
  const stmt = await db.prepareAsync(
    `INSERT INTO note_attachments (id, note_id, content_type, data, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  
  await stmt.executeAsync([id, noteId, contentType, data, now]);
  await stmt.finalizeAsync();
  
  return {
    id,
    note_id: noteId,
    content_type: contentType,
    data,
    created_at: now
  };
};

export const getAttachment = async (id: string): Promise<NoteAttachment | null> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<NoteAttachment>(
    `SELECT * FROM note_attachments WHERE id = ?`,
    [id]
  );
  
  return result || null;
};

export const getNoteAttachments = async (noteId: string): Promise<NoteAttachment[]> => {
  const db = getDatabase();
  return await db.getAllAsync<NoteAttachment>(
    `SELECT * FROM note_attachments 
     WHERE note_id = ? 
     ORDER BY created_at DESC`,
    [noteId]
  );
};

export const deleteAttachment = async (id: string): Promise<void> => {
  const db = getDatabase();
  
  const stmt = await db.prepareAsync(`DELETE FROM note_attachments WHERE id = ?`);
  await stmt.executeAsync([id]);
  await stmt.finalizeAsync();
};

// データベースバージョン取得
export const getDatabaseVersion = async (): Promise<number> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<{version: number}>(
    `SELECT version FROM db_version ORDER BY version DESC LIMIT 1`
  );
  
  return result?.version || 0;
};

// 開発環境用: データベースをリセットする関数（注意: すべてのデータが削除されます）
export const resetDatabase = async (): Promise<boolean> => {
  // 開発環境でのみ実行可能にする
  if (!__DEV__) {
    console.error('resetDatabase関数は開発環境でのみ使用可能です');
    return false;
  }
  
  try {
    console.log('データベースリセットを開始します...');
    
    // 現在のデータベース参照を取得
    let db = getDatabase();
    
    // 既存の接続を閉じる
    await db.closeAsync();
    
    // データベースファイルのパスを取得
    // Expoではデータベースはデフォルトで以下のパスに保存される
    const dbPath = `${FileSystem.documentDirectory}SQLite/app-default.db`;
    
    // ファイルの存在を確認
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    
    if (fileInfo.exists) {
      // ファイルを削除
      await FileSystem.deleteAsync(dbPath);
      console.log(`データベースファイルを削除しました: ${dbPath}`);
    } else {
      console.log(`データベースファイルが見つかりません: ${dbPath}`);
    }
    
    // 新しくデータベースを再作成
    console.log('データベースを再初期化します...');
    
    // _dbをnullにセットして再初期化を強制
    _db = null;
    
    // アプリ側でデータベース参照を取得し直す必要があります
    
    console.log('データベースリセットが完了しました');
    return true;
  } catch (error) {
    console.error('データベースリセットエラー:', error);
    return false;
  }
}; 