/**
 * HTMLコンテンツからタイトルとプレビューを抽出するユーティリティ
 */

/**
 * HTMLタグを除去してプレーンテキストを取得
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // HTMLタグを除去
    .replace(/&nbsp;/g, ' ') // &nbsp;をスペースに変換
    .replace(/&amp;/g, '&') // &amp;を&に変換
    .replace(/&lt;/g, '<') // &lt;を<に変換
    .replace(/&gt;/g, '>') // &gt;を>に変換
    .replace(/&quot;/g, '"') // &quot;を"に変換
    .replace(/&#x27;/g, "'") // &#x27;を'に変換
    .replace(/\s+/g, ' ') // 連続する空白を単一スペースに
    .trim();
}

/**
 * HTMLコンテンツから一行目をタイトルとして抽出
 */
export function extractTitleFromContent(content: string): string {
  if (!content || content.trim() === '') {
    return '無題のノート';
  }

  // HTMLを行に分割
  const lines = content.split(/[\r\n]+/);
  
  for (const line of lines) {
    const cleanLine = stripHtmlTags(line).trim();
    if (cleanLine.length > 0) {
      // 最大50文字でタイトルを切り詰め
      return cleanLine.length > 50 
        ? cleanLine.substring(0, 50) + '...' 
        : cleanLine;
    }
  }
  
  return '無題のノート';
}

/**
 * HTMLコンテンツから2行目以降をプレビューとして抽出
 */
export function extractPreviewFromContent(content: string): string {
  if (!content || content.trim() === '') {
    return '';
  }

  const plainText = stripHtmlTags(content);
  const lines = plainText.split(/[\r\n]+/);
  
  // 最初の行（タイトル）をスキップして、2行目以降を取得
  const previewLines = lines.slice(1).filter(line => line.trim().length > 0);
  
  if (previewLines.length === 0) {
    return '';
  }
  
  const preview = previewLines.join(' ').trim();
  
  // 最大100文字でプレビューを切り詰め
  return preview.length > 100 
    ? preview.substring(0, 100) + '...' 
    : preview;
}

/**
 * 相対的な時間表示を生成
 */
export function getRelativeTimeString(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'たった今';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}週間前`;
  } else if (diffMonths < 12) {
    return `${diffMonths}ヶ月前`;
  } else {
    return `${diffYears}年前`;
  }
}

/**
 * より詳細な日時表示を生成
 */
export function getDetailedDateString(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (diffDays === 0) {
    return `今日 ${formatTime(date)}`;
  } else if (diffDays === 1) {
    return `昨日 ${formatTime(date)}`;
  } else if (diffDays < 7) {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${weekday}曜日 ${formatTime(date)}`;
  } else {
    return `${formatDate(date)} ${formatTime(date)}`;
  }
}

/**
 * フォルダ階層のパンくずリストを生成
 */
export function generateBreadcrumb(folders: any[], currentFolderId: string | null): string[] {
  if (!currentFolderId) {
    return [];
  }

  const breadcrumb: string[] = [];
  let currentFolder = folders.find(f => f.id === currentFolderId);

  while (currentFolder) {
    breadcrumb.unshift(currentFolder.name);
    currentFolder = currentFolder.parent_id 
      ? folders.find(f => f.id === currentFolder?.parent_id)
      : null;
  }

  return breadcrumb;
}

/**
 * フォルダの階層レベルを計算
 */
export function getFolderLevel(folders: any[], folderId: string): number {
  let level = 0;
  let currentFolder = folders.find(f => f.id === folderId);

  while (currentFolder?.parent_id) {
    level++;
    currentFolder = folders.find(f => f.id === currentFolder?.parent_id);
  }

  return level;
}