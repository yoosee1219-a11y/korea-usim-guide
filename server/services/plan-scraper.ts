import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedPlan {
  name: string;
  price: number;
  data: string;
  voice: string;
  sms: string;
  features?: string[];
  details?: any; // 전체 원본 데이터 (요금제별 상세 정보)
}

export class PlanScraperService {
  /**
   * URL에서 요금제 정보 스크래핑 (정적 HTML 또는 API)
   */
  async scrapePlans(url: string): Promise<ScrapedPlan[]> {
    console.log(`🚀 Starting scraper for: ${url}`);

    try {
      // 프리티 사이트는 API 직접 호출
      if (url.includes('freet.co.kr')) {
        return await this.scrapeFreetAPI(url);
      }

      console.log('📄 Loading page...');

      // HTML 페이지 가져오기
      const response = await axios.get(url, {
        headers: {
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      console.log('🔍 Extracting plan data...');

      // Cheerio로 HTML 파싱
      const $ = cheerio.load(response.data);
      const results: ScrapedPlan[] = [];

      // 여러 선택자 패턴 시도
      const selectors = [
        '.plan-box',
        '.plan-item',
        '.rate-plan',
        '[class*="plan-"]',
        '.product-item',
        '.product',
        '.item'
      ];

      let foundElements: cheerio.Cheerio<cheerio.Element> | null = null;

      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          foundElements = elements;
          console.log(`Found ${elements.length} plans with selector: ${selector}`);
          break;
        }
      }

      if (!foundElements || foundElements.length === 0) {
        console.log('⚠️ No plan elements found, trying generic extraction...');

        // 선택자로 찾지 못하면 전체 텍스트에서 패턴 추출
        const bodyText = $('body').text();
        const genericPlans = this.extractFromText(bodyText);

        if (genericPlans.length > 0) {
          console.log(`✅ Extracted ${genericPlans.length} plans from text patterns`);
          return genericPlans;
        }

        return [];
      }

      foundElements.each((_, element) => {
        const $card = $(element);
        const allText = $card.text();

        // 요금제 이름 추출
        const $nameEl = $card.find('h3, h4, .name, strong, .title').first();
        let name = $nameEl.text().trim();

        // 가격 추출 (숫자만)
        const priceMatch = allText.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;

        // 데이터량 추출
        const dataMatch = allText.match(/(\d+(?:\.\d+)?)\s*(GB|MB|기가|메가)/i);
        const data = dataMatch ? `${dataMatch[1]}${dataMatch[2]}` : 'N/A';

        // 이름이 없으면 데이터량을 이름으로 사용
        if (!name || name.length < 3) {
          name = data !== 'N/A' ? `데이터 ${data}` : 'Unknown Plan';
        }

        // 음성 추출
        let voice = 'N/A';
        if (/무제한.*통화|통화.*무제한/i.test(allText)) {
          voice = '무제한';
        } else if (/기본.*제공|통화.*제공/i.test(allText)) {
          voice = '기본제공';
        } else {
          const voiceMatch = allText.match(/(\d+)\s*분/);
          if (voiceMatch) voice = `${voiceMatch[1]}분`;
        }

        // 문자 추출
        let sms = 'N/A';
        if (/무제한.*문자|문자.*무제한/i.test(allText)) {
          sms = '무제한';
        } else if (/기본.*제공|문자.*제공/i.test(allText)) {
          sms = '기본제공';
        } else {
          const smsMatch = allText.match(/(\d+)\s*건/);
          if (smsMatch) sms = `${smsMatch[1]}건`;
        }

        // 특징 추출
        const features: string[] = [];
        if (/속도.*무한|무제한.*속도/i.test(allText)) {
          const speedMatch = allText.match(/(\d+Mbps)/i);
          if (speedMatch) features.push(`소진 후 ${speedMatch[1]} 속도`);
        }

        if (price > 0 || data !== 'N/A') {
          results.push({
            name,
            price,
            data,
            voice,
            sms,
            features: features.length > 0 ? features : undefined
          });
        }
      });

      console.log(`✅ Extracted ${results.length} plans`);

      return results.filter(p => p.price > 0); // 가격이 0인 것 필터링

    } catch (error) {
      console.error('❌ Scraping error:', error);
      throw new Error(`Scraping failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 텍스트에서 직접 요금제 패턴 추출 (fallback)
   */
  private extractFromText(text: string): ScrapedPlan[] {
    const results: ScrapedPlan[] = [];

    // 간단한 패턴 매칭으로 요금제 추출
    const lines = text.split('\n');
    let currentPlan: Partial<ScrapedPlan> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // 가격 찾기
      const priceMatch = trimmed.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
      if (priceMatch) {
        if (currentPlan.price) {
          // 새 요금제 시작
          if (this.isValidPlan(currentPlan)) {
            results.push(currentPlan as ScrapedPlan);
          }
          currentPlan = {};
        }
        currentPlan.price = parseInt(priceMatch[1].replace(/,/g, ''));
      }

      // 데이터 찾기
      const dataMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*(GB|MB|기가)/i);
      if (dataMatch && !currentPlan.data) {
        currentPlan.data = `${dataMatch[1]}${dataMatch[2]}`;
      }
    }

    // 마지막 요금제 추가
    if (this.isValidPlan(currentPlan)) {
      results.push(currentPlan as ScrapedPlan);
    }

    return results;
  }

  private isValidPlan(plan: Partial<ScrapedPlan>): plan is ScrapedPlan {
    return !!(plan.price && plan.data);
  }

  /**
   * 프리티 API 직접 호출
   */
  private async scrapeFreetAPI(url: string): Promise<ScrapedPlan[]> {
    console.log('🔍 Detected Freet.co.kr - using API...');

    try {
      // 프리티 요금제 API 호출
      const response = await axios.get('https://api.freet.co.kr/plan/v1/list', {
        params: {
          rowSize: 100,
          pageNo: 1,
          svcTypes: 'PP', // 선불 요금제
          onlineAuth: 'Y'
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      if (response.data.status !== 'success') {
        throw new Error('API request failed');
      }

      const ratePlans = response.data.data?.ratePlans || [];
      console.log(`✅ Found ${ratePlans.length} plans from API`);

      // API 데이터를 우리 형식으로 변환 (전체 원본 데이터 포함)
      const results: ScrapedPlan[] = ratePlans.map((plan: any) => ({
        name: plan.svcName || 'Unknown Plan',
        price: parseInt(plan.monthlyFee || plan.basicFee || '0'),
        data: plan.freeData || 'N/A',
        voice: plan.freeVoice || 'N/A',
        sms: plan.freeSms || 'N/A',
        features: plan.freeVoiceAdd || plan.freeDataAdd ?
          [plan.freeVoiceAdd, plan.freeDataAdd].filter(Boolean) :
          undefined,
        details: plan // 전체 API 응답 저장 (모든 상세 정보)
      })).filter(p => p.price > 0);

      console.log(`📦 Including full details for ${results.length} plans`);
      return results;

    } catch (error) {
      console.error('❌ Freet API error:', error);
      throw new Error(`Freet API scraping failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 수집된 데이터를 DB 스키마에 맞게 정규화
   */
  normalizeForDB(scrapedPlans: ScrapedPlan[]) {
    return scrapedPlans.map(plan => ({
      name: plan.name.substring(0, 100),
      description: `${plan.data} 데이터 / ${plan.voice} 통화 / ${plan.sms} 문자`,
      price: plan.price,
      data: plan.data,
      voice: plan.voice,
      sms: plan.sms,
      features: JSON.stringify(plan.features || []),
      is_active: true
    }));
  }
}

export const planScraperService = new PlanScraperService();
