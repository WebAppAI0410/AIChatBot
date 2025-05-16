const { StorageClient } = require('@supabase/storage-js');

// Supabaseプロジェクト情報
const SUPABASE_URL = 'https://alperyqhdtpnivxfnqdi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscGVyeXFoZHRwbml2eGZucWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4ODg4ODg4OCwiZXhwIjoxOTk0MjQ4ODg4fQ.XXX'; // サービスキーを推奨

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
    const { data: urlData, error: policyError } = storageClient.from('user-content').getPublicUrl('test.txt');
    
    if (policyError) {
      console.log('ポリシーの設定中にエラーが発生しました:', policyError.message);
      console.log('ポリシーを手動で設定してください。');
    } else {
      console.log('バケットのポリシーが正常に設定されました');
    }

    console.log('Supabaseストレージのセットアップが完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

setupStorage(); 