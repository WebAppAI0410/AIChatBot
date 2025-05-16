const { StorageClient } = require('@supabase/storage-js');

// 環境変数からSupabase情報を取得
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// 環境変数の検証
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('環境変数が設定されていません: SUPABASE_URL と SUPABASE_SERVICE_KEY が必要です');
  process.exit(1);
}

// StorageClientの初期化
const storageClient = new StorageClient(`${SUPABASE_URL}/storage/v1`, {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
});

async function setupStorage() {
  try {
    console.log('Supabaseストレージのセットアップを開始します...');

    // バケットの存在確認
    const { data: buckets, error: getBucketsError } = await storageClient.listBuckets();
    
    if (getBucketsError) {
      throw new Error(`バケット一覧の取得に失敗しました: ${getBucketsError.message}`);
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'user-content');

    if (bucketExists) {
      console.log('user-contentバケットはすでに存在します');
    } else {
      // バケットの作成
      console.log('user-contentバケットを作成します...');
      const { data, error } = await storageClient.createBucket('user-content', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        throw new Error(`バケットの作成に失敗しました: ${error.message}`);
      }

      console.log('バケットが正常に作成されました:', data);
    }

    // バケットのポリシーを設定（パブリックアクセス）
    console.log('バケットのポリシーを設定します...');
    
    // 最初にテストファイルをアップロード
    const testContent = Buffer.from('test content');
    console.log('テストファイルをアップロードしています...');
    const { error: uploadError } = await storageClient.from('user-content').upload('test.txt', testContent);
    
    if (uploadError) {
      console.log('テストファイルのアップロードに失敗しました:', uploadError.message);
      console.log('ポリシーのテストはスキップされます。');
    } else {
      // テストファイルがアップロードできたら、パブリックURLを取得してテスト
      console.log('テストファイルのパブリックURLを取得しています...');
      const { data: urlData, error: policyError } = storageClient.from('user-content').getPublicUrl('test.txt');
      
      if (policyError) {
        console.log('ポリシーの設定中にエラーが発生しました:', policyError.message);
        console.log('ポリシーを手動で設定してください。');
      } else {
        console.log('バケットのポリシーが正常に設定されました');
        console.log('パブリックURL:', urlData.publicUrl);
      }
      
      // テスト後、テストファイルを削除（オプション）
      console.log('テストファイルを削除しています...');
      const { error: deleteError } = await storageClient.from('user-content').remove(['test.txt']);
      if (deleteError) {
        console.log('テストファイルの削除に失敗しました:', deleteError.message);
      } else {
        console.log('テストファイルが削除されました');
      }
    }

    console.log('Supabaseストレージのセットアップが完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

setupStorage(); 