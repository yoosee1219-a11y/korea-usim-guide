import puppeteer from 'puppeteer';

export interface ScrapedPlan {
  name: string;
  price: number;
  data: string;
  voice: string;
  sms: string;
  features?: string[];
}

export class PlanScraperService {
  /**
   * URL에서 요금제 정보 스크래핑
   */
  async scrapePlans(url: string): Promise<ScrapedPlan[]> {
    console.log(`🚀 Starting scraper for: ${url}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // 한국어 설정
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9'
      });

      console.log('📄 Loading page...');
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // 페이지 로딩 대기
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('🔍 Extracting plan data...');

      // 요금제 데이터 추출
      const plans = await page.evaluate(() => {
        const results: any[] = [];

        // 여러 선택자 패턴 시도
        const selectors = [
          '.plan-box',
          '.plan-item',
          '.rate-plan',
          '[class*="plan-"]',
          '.product-item'
        ];

        let foundElements: NodeListOf<Element> | null = null;

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            foundElements = elements;
            console.log(`Found ${elements.length} plans with selector: ${selector}`);
            break;
          }
        }

        if (!foundElements || foundElements.length === 0) {
          return [];
        }

        foundElements.forEach((card) => {
          const allText = card.textContent || '';

          // 요금제 이름 추출
          const nameEl = card.querySelector('h3, h4, .name, strong, .title');
          let name = nameEl?.textContent?.trim() || '';

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

          results.push({
            name,
            price,
            data,
            voice,
            sms,
            features: features.length > 0 ? features : undefined
          });
        });

        return results;
      });

      console.log(`✅ Extracted ${plans.length} plans`);

      return plans.filter(p => p.price > 0); // 가격이 0인 것 필터링

    } catch (error) {
      console.error('❌ Scraping error:', error);
      throw new Error(`Scraping failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await browser.close();
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
