import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";
import { Link, useRoute } from "wouter";

// Mock data for article detail - in a real app this would come from an API or CMS
const articleData = {
  title: "인천공항 유심 수령 완벽 가이드",
  category: "Airport Guide",
  date: "2025.05.20",
  readTime: "5 min read",
  image: "https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?auto=format&fit=crop&q=80&w=1200",
  content: `
    <p class="mb-6 text-lg leading-relaxed">
      한국에 도착하자마자 가장 먼저 해야 할 일은 바로 통신 연결입니다. 
      인천공항에서 유심(USIM)을 수령하는 방법은 생각보다 간단하지만, 
      미리 알고 가면 훨씬 시간을 절약할 수 있습니다.
    </p>

    <h2 class="text-2xl font-bold mt-8 mb-4">1. 예약 확인서 준비하기</h2>
    <p class="mb-4 leading-relaxed text-muted-foreground">
      온라인으로 미리 예약했다면, 이메일이나 앱으로 받은 바우처(QR코드)를 미리 캡처해 두세요. 
      공항 와이파이가 불안정할 수 있으므로 오프라인 상태에서도 볼 수 있는 이미지가 좋습니다.
    </p>

    <h2 class="text-2xl font-bold mt-8 mb-4">2. 수령 장소(카운터) 찾기</h2>
    <p class="mb-4 leading-relaxed text-muted-foreground">
      대부분의 통신사 로밍 센터는 1층 입국장에 위치해 있습니다. 
      SKT, KT, LG U+ 등 메이저 통신사의 부스는 24시간 운영되는 곳이 많지만, 
      알뜰폰 사업자나 특정 여행사 부스는 운영 시간이 정해져 있을 수 있으니 
      도착 시간을 반드시 체크해야 합니다.
    </p>
    
    <div class="bg-secondary/50 p-6 rounded-xl my-8 border-l-4 border-primary">
      <h3 class="font-bold mb-2">💡 Pro Tip</h3>
      <p class="text-sm">
        새벽 도착 비행기라면, 24시간 운영하는 편의점(CU, GS25)에서도 유심을 구매할 수 있습니다.
        하지만 편의점 유심은 직접 개통 절차를 진행해야 하므로, 초보자에게는 공항 카운터 수령을 추천합니다.
      </p>
    </div>

    <h2 class="text-2xl font-bold mt-8 mb-4">3. 현장 개통 및 테스트</h2>
    <p class="mb-4 leading-relaxed text-muted-foreground">
      유심을 받았다면 그 자리에서 바로 갈아 끼우고 데이터가 터지는지 확인하세요. 
      직원분께 "Please check if it works"라고 요청하면 대부분 친절하게 설정을 도와줍니다.
      데이터가 안 터진다면 재부팅을 2-3회 시도해 보세요.
    </p>
  `
};

export default function TipDetail() {
  const [match, params] = useRoute("/tips/:id");
  // In a real app, fetch data using params.id

  return (
    <Layout>
      <article className="min-h-screen pb-20">
        {/* Hero Image */}
        <div className="w-full h-[40vh] md:h-[50vh] relative">
          <img 
            src={articleData.image} 
            alt={articleData.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
          
          <div className="absolute top-6 left-4 md:left-8">
            <Link href="/tips">
              <Button variant="secondary" size="sm" className="gap-2 shadow-lg backdrop-blur-md bg-background/50 hover:bg-background/80">
                <ArrowLeft className="h-4 w-4" /> Back to Tips
              </Button>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-10">
          <div className="max-w-3xl mx-auto bg-background rounded-3xl shadow-xl border p-6 md:p-12">
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {articleData.category}
              </span>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {articleData.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {articleData.readTime}</span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-8 leading-tight">
              {articleData.title}
            </h1>

            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: articleData.content }}
            />

            <div className="mt-12 pt-8 border-t flex justify-between items-center">
              <div className="text-muted-foreground text-sm">
                Was this article helpful?
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" /> Share Article
              </Button>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
}
