// Supabase 데이터베이스 타입 정의

export interface Database {
  public: {
    Tables: {
      carriers: {
        Row: Carrier
        Insert: Omit<Carrier, 'id' | 'created_at'>
        Update: Partial<Omit<Carrier, 'id' | 'created_at'>>
      }
      plans: {
        Row: Plan
        Insert: Omit<Plan, 'id' | 'created_at'>
        Update: Partial<Omit<Plan, 'id' | 'created_at'>>
      }
      blog_posts: {
        Row: BlogPost
        Insert: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

// 통신사 타입
export interface Carrier {
  id: string
  name: string
  name_en: string
  logo_url: string | null
  website: string | null
  customer_service: string | null
  created_at: string
}

// 요금제 타입
export interface Plan {
  id: string
  carrier_id: string
  name: string
  monthly_fee: number
  discounted_fee: number | null
  data_amount: string
  voice_minutes: string | null
  sms_count: string | null
  network_type: '5G' | 'LTE' | 'LTE-A'
  plan_type: 'prepaid' | 'postpaid' | 'mou'
  contract_period: number | null
  discount_conditions: string | null
  benefits: string | null
  is_active: boolean
  created_at: string
}

// 블로그 포스트 타입
export interface BlogPost {
  id: string
  // 제목 (12개 언어)
  title_ko: string
  title_en: string
  title_vi: string | null
  title_th: string | null
  title_tl: string | null
  title_uz: string | null
  title_ne: string | null
  title_mn: string | null
  title_id: string | null
  title_my: string | null
  title_zh: string | null
  title_ru: string | null
  slug: string
  // 내용 (12개 언어)
  content_ko: string
  content_en: string
  content_vi: string | null
  content_th: string | null
  content_tl: string | null
  content_uz: string | null
  content_ne: string | null
  content_mn: string | null
  content_id: string | null
  content_my: string | null
  content_zh: string | null
  content_ru: string | null
  // 요약 (일부 언어)
  excerpt_ko: string | null
  excerpt_en: string | null
  excerpt_tl: string | null
  featured_image: string | null
  author: string | null
  category: string | null
  tags: string[] | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

// 요금제 with 통신사 정보
export interface PlanWithCarrier extends Plan {
  carrier: Carrier
}
