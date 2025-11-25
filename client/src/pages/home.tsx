import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Smartphone, Wifi, Zap } from "lucide-react";
import { Link } from "wouter";
import { useTips } from "@/hooks/useTips";
import { Spinner } from "@/components/ui/spinner";
import { SEOHead } from "@/components/seo/SEOHead";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import heroImage from "@assets/generated_images/diverse_travelers_in_seoul_using_smartphones.png";

export default function Home() {
  // 최신 꿀팁 3개 가져오기
  const { data: tipsData, isLoading: tipsLoading } = useTips({ limit: 3, page: 1 });
  const latestTips = tipsData?.tips || [];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KOREAUSIMGUIDE",
    "description": "한국 여행을 위한 완벽한 유심/eSIM 가이드",
    "url": "https://koreausimguide.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://koreausimguide.com/compare?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Layout>
      <SEOHead
        title="KOREAUSIMGUIDE - 한국 유심/eSIM 가이드 | 요금제 비교 및 통신 꿀팁"
        description="한국 여행을 위한 완벽한 유심/eSIM 가이드. SK, KT, LG 등 통신사 요금제 비교 및 한국 통신 꿀팁을 제공합니다."
        canonical="https://koreausimguide.com"
        structuredData={structuredData}
      />
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-secondary/50 text-secondary-foreground backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                2025 최신 요금제 업데이트 완료
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight text-foreground leading-[1.1]">
                Korea <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                  SIM & eSIM Guide
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0 leading-relaxed">
                한국 여행을 위한 완벽한 통신 가이드. <br className="hidden md:block" />
                나에게 딱 맞는 유심/eSIM을 찾고, 스마트한 여행을 시작하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/compare">
                  <Button size="lg" className="h-14 px-8 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    요금제 비교하기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/tips">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-background/50 backdrop-blur-sm hover:bg-accent">
                    통신 꿀팁 보기
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 relative w-full max-w-lg md:max-w-none">
              <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-border/50">
                <OptimizedImage
                  src={heroImage}
                  alt="한국 여행객들이 서울에서 스마트폰으로 유심/eSIM 정보를 확인하는 모습"
                  width={800}
                  height={600}
                  loading="eager"
                  fetchPriority="high"
                  quality={90}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 md:bottom-10 md:-left-10 bg-background p-4 rounded-2xl shadow-xl border flex items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 max-w-[240px]">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wifi className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">Fastest 5G Network</p>
                  <p className="text-xs text-muted-foreground">Korea has world-class speed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Why KOREAUSIMGUIDE?</h2>
            <p className="text-muted-foreground text-lg">
              복잡한 한국 통신사 요금제, 저희가 쉽게 정리해 드립니다.
              외국인 여행객을 위한 맞춤형 정보를 확인하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone className="h-8 w-8 text-primary" />,
                title: "Easy Comparison",
                desc: "SKT, KT, LG U+ 등 주요 통신사의 선불 유심과 eSIM 요금제를 한눈에 비교하세요."
              },
              {
                icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
                title: "Verified Tips",
                desc: "공항 수령 방법, 개통 절차, 본인 인증 등 한국 여행 필수 통신 정보를 제공합니다."
              },
              {
                icon: <Zap className="h-8 w-8 text-primary" />,
                title: "Fast & Reliable",
                desc: "데이터 속도와 커버리지, 가격 효율성을 고려하여 최고의 옵션만을 추천합니다."
              }
            ].map((feature, index) => (
              <Card key={index} className="border-none shadow-md bg-background/50 backdrop-blur-sm hover:bg-background transition-colors">
                <CardContent className="pt-8 pb-8 px-6 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Tips Section */}
      {latestTips.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">최신 통신 꿀팁</h2>
              <p className="text-muted-foreground text-lg">
                한국 여행 시 알아두면 유용한 통신 관련 팁을 확인하세요.
              </p>
            </div>

            {tipsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {latestTips.map((tip) => (
                  <Link key={tip.id} href={`/tips/${tip.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1">
                      <div className="aspect-video relative overflow-hidden rounded-t-xl bg-secondary/50">
                        <OptimizedImage
                          src={tip.thumbnail_url}
                          alt={`${tip.title} - 한국 통신 꿀팁 이미지`}
                          width={400}
                          height={225}
                          loading="lazy"
                          quality={80}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                          fallbackSrc={heroImage}
                        />
                      </div>
                      <CardContent className="pt-6">
                        {tip.category_name && (
                          <div className="text-xs text-muted-foreground mb-2">{tip.category_name}</div>
                        )}
                        <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {tip.title}
                        </h3>
                        {tip.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {tip.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>조회수: {tip.view_count}</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link href="/tips">
                <Button variant="outline" size="lg">
                  모든 꿀팁 보기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="bg-primary text-primary-foreground rounded-[2rem] p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                Ready for your trip?
              </h2>
              <p className="text-primary-foreground/80 text-lg md:text-xl mb-10">
                지금 바로 나에게 맞는 최적의 요금제를 찾아보세요.
                데이터 걱정 없는 즐거운 한국 여행이 시작됩니다.
              </p>
              <Link href="/compare">
                <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold shadow-lg">
                  요금제 비교하러 가기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
