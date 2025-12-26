import { config } from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

// .env 파일 로드
config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listAvailableModels() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Gemini API 모델 목록 확인');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // ListModels API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ 사용 가능한 모델 개수: ${data.models.length}\n`);

    console.log('📋 generateContent를 지원하는 모델:\n');

    data.models
      .filter((model: any) =>
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .forEach((model: any) => {
        console.log(`  ✓ ${model.name.replace('models/', '')}`);
        console.log(`    - Display: ${model.displayName}`);
        console.log(`    - Description: ${model.description}`);
        console.log(`    - Input limit: ${model.inputTokenLimit?.toLocaleString()} tokens`);
        console.log(`    - Output limit: ${model.outputTokenLimit?.toLocaleString()} tokens`);
        console.log();
      });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 모델 목록 조회 실패:', error);
    throw error;
  }
}

async function testModel(modelName: string) {
  console.log(`🧪 모델 테스트: ${modelName}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent("안녕하세요. 간단한 인사말을 해주세요.");
    const response = result.response.text();

    console.log(`✅ 테스트 성공!`);
    console.log(`응답: ${response}\n`);

    return true;
  } catch (error) {
    console.error(`❌ 테스트 실패:`, error);
    return false;
  }
}

(async () => {
  try {
    // 1. 사용 가능한 모델 목록 확인
    await listAvailableModels();

    // 2. 추천 모델들 테스트
    const modelsToTest = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-002'
    ];

    console.log('🧪 모델 테스트 시작\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const modelName of modelsToTest) {
      const success = await testModel(modelName);
      if (success) {
        console.log(`\n✨ 추천 모델: ${modelName}\n`);
        break;
      }
      console.log();
    }

  } catch (error) {
    console.error('실행 중 오류:', error);
    process.exit(1);
  }
})();
