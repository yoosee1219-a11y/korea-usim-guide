import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const tips = [
  {
    id: 1,
    title: "인천공항 유심 수령 완벽 가이드",
    excerpt: "인천공항 제1터미널, 제2터미널 통신사 부스 위치와 영업시간, 수령 시 필요한 준비물을 정리해 드립니다.",
    category: "Airport Guide",
    date: "2025.05.20",
    readTime: "5 min read",
    featured: true,
    image: "https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 2,
    title: "eSIM vs USIM: 나에게 맞는 것은?",
    excerpt: "물리 유심 교체의 번거로움이 없는 eSIM과 안정적인 물리 유심의 장단점을 비교 분석합니다.",
    category: "Comparison",
    date: "2025.05.18",
    readTime: "4 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 3,
    title: "한국 무료 와이파이 사용 꿀팁",
    excerpt: "지하철, 카페, 공공장소에서 무료 와이파이를 안전하게 사용하는 방법과 접속 가이드.",
    category: "WiFi Tips",
    date: "2025.05.15",
    readTime: "3 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 4,
    title: "본인인증(Identity Verification)이란?",
    excerpt: "한국 장기 체류 시 필수적인 휴대폰 본인인증 서비스에 대한 이해와 선불유심으로 인증하는 법.",
    category: "Living in Korea",
    date: "2025.05.10",
    readTime: "6 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1555421689-d68471e18963?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: 5,
    title: "긴급 상황 시 유용한 전화번호",
    excerpt: "112, 119 등 한국 여행 중 위급 상황 발생 시 알아두어야 할 필수 긴급 전화번호 목록.",
    category: "Safety",
    date: "2025.05.01",
    readTime: "2 min read",
    featured: false,
    image: "https://images.unsplash.com/photo-1595248438190-7f46435707d6?auto=format&fit=crop&q=80&w=800"
  }
];

export default function Tips() {
  return (
    <Layout>
      <div className="bg-secondary/30 py-16 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-heading font-bold mb-4">한국 통신 꿀팁 (Telecom Tips)</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            한국 여행과 생활에 도움이 되는 유용한 통신 정보를 확인하세요.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {tips.filter(t => t.featured).map(tip => (
            <Link key={tip.id} href={`/tips/${tip.id}`}>
              <div className="group relative rounded-2xl overflow-hidden aspect-video lg:aspect-[2/1] border cursor-pointer">
                <img src={tip.image} alt={tip.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 flex flex-col justify-end text-white">
                  <Badge className="w-fit mb-3 bg-primary hover:bg-primary/90 border-none text-primary-foreground">
                    {tip.category}
                  </Badge>
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary-foreground transition-colors">{tip.title}</h2>
                  <p className="text-gray-300 line-clamp-2 mb-4">{tip.excerpt}</p>
                  <div className="flex items-center text-sm text-gray-400 gap-4">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {tip.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {tip.readTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tips.filter(t => !t.featured).map(tip => (
            <Link key={tip.id} href={`/tips/${tip.id}`}>
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1">
                <div className="aspect-video relative overflow-hidden rounded-t-xl">
                  <img src={tip.image} alt={tip.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs font-normal">{tip.category}</Badge>
                    <span className="text-xs text-muted-foreground">{tip.date}</span>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3">
                    {tip.excerpt}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full justify-between text-muted-foreground group-hover:text-primary">
                    Read More <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
