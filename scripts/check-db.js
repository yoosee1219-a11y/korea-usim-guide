// Supabase 연결 테스트 및 blog_posts 테이블 구조 확인
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Supabase 연결 테스트 중...\n');

  // 1. blog_posts 테이블 데이터 조회
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ 에러:', error.message);
    return;
  }

  console.log('✅ Supabase 연결 성공!\n');

  if (data && data.length > 0) {
    console.log('📊 blog_posts 테이블 구조:');
    console.log('컬럼 목록:', Object.keys(data[0]));
    console.log('\n샘플 데이터:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️ blog_posts 테이블이 비어있습니다.');
  }

  // 2. 전체 블로그 개수 확인
  const { count } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📝 총 블로그 포스트 개수: ${count}`);
}

checkDatabase();
