# リッチテキストエディタのカスタマイズ知見

## 概要

アプリケーションで使用している `react-native-pell-rich-editor` ライブラリのカスタマイズに関する知見を記録したドキュメントです。特にフォーマットボタン（見出し、リスト等）の排他的処理の実装方法を中心に記載しています。

## 実装した機能

1. **見出しとリストの排他処理**
   - 見出し（H1、H2、H3、引用）と各種リスト（順序付き、箇条書き、チェックボックス）が排他的に動作
   - 同じフォーマットを再度押すとプレーンテキストに戻る（トグル動作）

2. **カスタムチェックボックスリスト**
   - ライブラリ標準のチェックボックスリストをより使いやすく拡張
   - クリックで状態が切り替わるインタラクティブなチェックボックス

## 技術的アプローチ

### 1. WebViewのJavaScript実行環境のカスタマイズ

`react-native-pell-rich-editor`はWebViewをベースにしたコンポーネントで、内部でHTMLとJavaScriptを使用しています。エディタの動作をカスタマイズするには、WebView内のJavaScript環境を拡張する必要があります。

```javascript
// document.execCommandをオーバーライドする方法
const overrideDefaultFormattingScript = `
  (function() {
    try {
      // オリジナルのexecCommandをバックアップ
      if (!document.originalExecCommand) {
        document.originalExecCommand = document.execCommand;
        
        // execCommandをオーバーライドして排他ロジックを組み込む
        document.execCommand = function(command, showUI, value) {
          console.log('execCommand intercepted:', command, value);
          
          // カスタム処理をここに実装
          
          // 最後にオリジナルの関数を呼び出す
          return document.originalExecCommand(command, showUI, value);
        };
      }
    } catch (e) {
      console.error('execCommandオーバーライドエラー:', e);
    }
  })();
`;

// WebViewの初期化時にスクリプトを注入
richText.current.commandDOM(overrideDefaultFormattingScript);
```

### 2. RichToolbarと連携するためのアプローチ

`RichToolbar`コンポーネントの標準アクション名を使いつつ、アクションハンドラをカスタマイズするには複数のアプローチがあります：

#### アプローチ1: アクションインターセプト

```javascript
const handleRichToolbarAction = useCallback((action: string, selected: boolean) => {
  switch (action) {
    case actions.heading1:
      handleCustomHeadingOne();
      return true; // アクションを処理したことを示す
    // その他のアクション...
    default:
      return false; // 標準の処理に委ねる
  }
}, []);

// RichToolbarに渡す
<RichToolbar
  editor={richText}
  actions={standardActions}
  onAction={handleRichToolbarAction}
  // ...
/>
```

#### アプローチ2: 個別のコールバックをオーバーライド

```javascript
<RichToolbar
  editor={richText}
  actions={standardActions}
  onHeading1={handleCustomHeadingOne}
  onHeading2={handleCustomHeadingTwo}
  onHeading3={handleCustomHeadingThree}
  onBlockquote={handleCustomBlockquote}
  onOrderedList={handleCustomOrderedList}
  onUnorderedList={handleCustomBulletsList}
  onCheckboxList={handleCustomCheckboxList}
  // ...
/>
```

### 3. フォーマット状態の検出と操作

フォーマット状態を検出する方法：

```javascript
// 標準のフォーマット状態の検出
const formatBlock = document.queryCommandValue('formatBlock').toLowerCase();
const isOrderedList = document.queryCommandState('insertOrderedList');
const isUnorderedList = document.queryCommandState('insertUnorderedList');

// カスタムフォーマット（チェックボックスリスト）の検出
let isCheckboxList = false;
const selection = window.getSelection();
if (selection && selection.rangeCount > 0) {
  let node = selection.anchorNode;
  if (node.nodeType === 3) node = node.parentNode;
  
  while (node && node !== document.body) {
    if (node.nodeName === 'UL' && node.classList.contains('checklist')) {
      isCheckboxList = true;
      break;
    }
    node = node.parentNode;
  }
}
```

## 実装上の課題と解決策

### 1. 標準コマンドと排他処理の連携

**課題**: ライブラリの標準コマンドはそれぞれ独立して動作し、排他的な処理を行わない。

**解決策**: `document.execCommand`をオーバーライドして、コマンド実行前に現在の状態をチェックし、必要に応じて他のフォーマットを解除するロジックを追加。

### 2. カスタムフォーマットの管理

**課題**: チェックボックスリストなどのカスタムフォーマットは標準のコマンドでは管理できない。

**解決策**: クラス名ベースでDOMを直接操作し、状態を管理するカスタムコードを実装。セレクションAPIを使って現在の選択範囲から親要素をたどり、フォーマット状態を検出する方法を採用。

### 3. WebViewとReactのコミュニケーション

**課題**: WebView内の状態変化をReactコンポーネント側に伝える必要がある。

**解決策**: `window.ReactNativeWebView.postMessage`を使用して、フォーマット状態の変化をJSON形式でReact側に通知。React側では`onMessage`ハンドラでこれを受け取り、状態を更新。

## パフォーマンスとユーザー体験の改善

1. **状態チェックの最適化**
   - 連続的な状態チェックはパフォーマンスに影響するため、操作後や選択変更時など必要なタイミングでのみ実行
   - タイマーを使った定期チェックは500ms間隔に設定し、過剰な処理を回避

2. **レスポンシブなフィードバック**
   - フォーマット状態に基づいてツールバーのアイコン色を変更し、現在のフォーマットを視覚的に表示
   - 処理の遅延を考慮し、状態変更後に少し遅延（50ms）を入れてから状態を再確認

## 今後の改善点

1. **バイナリ選択ではなく複数選択のサポート**
   - 現在は見出しかリストのどちらかだけを選択できるが、将来的には複数の書式（太字+斜体など）の組み合わせをよりきめ細かくサポート

2. **カスタムスタイルの拡張**
   - 色選択やフォントサイズなど、より多様なフォーマットオプションを追加

3. **Undo/Redoの改善**
   - 現在のUndo/Redoは標準のブラウザ機能に依存しているが、より細かい粒度での操作履歴管理を実装 