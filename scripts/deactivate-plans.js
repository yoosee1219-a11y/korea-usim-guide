/**
 * Deactivate specific plans by name
 */

const API_URL = 'https://koreausimguide.com';

// Plans to deactivate
const PLANS_TO_DEACTIVATE = [
  '인스모바일 | 인스 유심 스트롱 100GB+',
  '찬스모바일 | 알찬 100분 15GB+3Mbps'
];

async function deactivatePlans() {
  console.log('🗑️  Deactivating problem plans...\n');

  for (const planName of PLANS_TO_DEACTIVATE) {
    try {
      const response = await fetch(`${API_URL}/api/plans/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: planName }),
      });

      if (response.ok) {
        console.log(`✅ Deactivated: ${planName}`);
      } else {
        console.log(`❌ Failed: ${planName}`);
      }
    } catch (error) {
      console.error(`❌ Error deactivating ${planName}:`, error.message);
    }
  }

  console.log('\n✅ Done!');
}

deactivatePlans();
