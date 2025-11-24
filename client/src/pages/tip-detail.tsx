import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Share2, Eye } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useTipBySlug, useTips } from "@/hooks/useTips";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

export default function TipDetail() {
  const [match, params] = useRoute("/tips/:id");
  const tipIdOrSlug = params?.id || "";

  // 슬러그 또는 ID로 꿀팁 조회
  const { data: tip, isLoading, error } = useTipBySlug(tipIdOrSlug);

  // 관련 꿀팁 (같은 카테고리, 최신 3개)
  const { data: relatedTipsData } = useTips({
    category_id: tip?.category_id,
    limit: 3,
    page: 1,
  });
  const relatedTips = relatedTipsData?.tips?.filter((t) => t.id !== tip?.id).slice(0, 3) || [];

  // 날짜 포맷팅
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일");
    } catch {
      return dateString;
    }
  };

  // 읽기 시간 계산 (대략적으로)
  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes}분`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner />
        </div>
      </Layout>
    );
  }

  if (error || !tip) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">꿀팁을 찾을 수 없습니다</h1>
          <p className="text-muted-foreground mb-8">요청하신 꿀팁이 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/tips">
            <Button>꿀팁 목록으로 돌아가기</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="min-h-screen pb-20">
        {/* Hero Image */}
        {tip.thumbnail_url && (
          <div className="w-full h-[40vh] md:h-[50vh] relative">
            <img
              src={tip.thumbnail_url}
              alt={tip.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>

            <div className="absolute top-6 left-4 md:left-8">
              <Link href="/tips">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 shadow-lg backdrop-blur-md bg-background/50 hover:bg-background/80"
                >
                  <ArrowLeft className="h-4 w-4" /> 목록으로
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className={`container mx-auto px-4 ${tip.thumbnail_url ? "-mt-20" : "pt-12"} relative z-10`}>
          <div className="max-w-3xl mx-auto bg-background rounded-3xl shadow-xl border p-6 md:p-12">
            {/* 카테고리 및 메타 정보 */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              {tip.category_name && (
                <Badge className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium">
                  {tip.category_name}
                </Badge>
              )}
              <div className="flex items-center gap-4 text-muted-foreground text-sm flex-wrap">
                {tip.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {formatDate(tip.published_at)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> 조회수 {tip.view_count}
                </span>
                <span className="flex items-center gap-1">
                  읽는 시간 약 {estimateReadTime(tip.content)}분
                </span>
              </div>
            </div>

            {/* 제목 */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-8 leading-tight">
              {tip.title}
            </h1>

            {/* 요약 */}
            {tip.excerpt && (
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary pl-4">
                {tip.excerpt}
              </p>
            )}

            {/* 본문 (마크다운 렌더링) */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
              <ReactMarkdown>{tip.content}</ReactMarkdown>
            </div>

            {/* 공유 및 하단 */}
            <div className="mt-12 pt-8 border-t flex justify-between items-center flex-wrap gap-4">
              <div className="text-muted-foreground text-sm">
                이 꿀팁이 도움이 되었나요?
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: tip.title,
                      text: tip.excerpt || "",
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("링크가 클립보드에 복사되었습니다.");
                  }
                }}
              >
                <Share2 className="h-4 w-4" /> 공유하기
              </Button>
            </div>
          </div>

          {/* 관련 꿀팁 */}
          {relatedTips.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-8">관련 꿀팁</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedTips.map((relatedTip) => (
                  <Link key={relatedTip.id} href={`/tips/${relatedTip.slug}`}>
                    <div className="group cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                      {relatedTip.thumbnail_url && (
                        <div className="aspect-video relative overflow-hidden">
                          <img
                            src={relatedTip.thumbnail_url}
                            alt={relatedTip.title}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        {relatedTip.category_name && (
                          <Badge variant="secondary" className="text-xs mb-2">
                            {relatedTip.category_name}
                          </Badge>
                        )}
                        <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedTip.title}
                        </h3>
                        {relatedTip.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {relatedTip.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </Layout>
  );
}
