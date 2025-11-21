import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, Signal } from "lucide-react";

const plans = [
  {
    id: 1,
    provider: "SK Telecom",
    name: "Daily Unlimited Pass",
    type: "eSIM / USIM",
    data: "Unlimited (3Mbps after 3GB)",
    days: "1 / 3 / 5 / 10 / 20 / 30 Days",
    price: "From ₩6,600",
    features: ["Reliable Coverage", "Voice Call Option", "Free Incoming Calls"],
    recommended: true,
    color: "bg-orange-500"
  },
  {
    id: 2,
    provider: "KT",
    name: "Roaming Egg (WiFi)",
    type: "Pocket WiFi",
    data: "Unlimited 4G/LTE",
    days: "Rental per day",
    price: "₩3,300 / day",
    features: ["Connect up to 3 devices", "Pick up at Airport", "Power Bank function"],
    recommended: false,
    color: "bg-red-500"
  },
  {
    id: 3,
    provider: "LG U+",
    name: "Data SIM Plan",
    type: "USIM Only",
    data: "Daily 3GB + Unlimited 5Mbps",
    days: "5 / 7 / 10 Days",
    price: "From ₩25,000",
    features: ["T-Money Card Included", "LG U+ WiFi Zone Free", "Voice Call Support"],
    recommended: false,
    color: "bg-pink-600"
  },
  {
    id: 4,
    provider: "Chingu Mobile",
    name: "Monthly Prepaid",
    type: "USIM",
    data: "15GB + 3Mbps Unlimited",
    days: "30 Days",
    price: "₩30,000",
    features: ["Cheapest Long-term", "Chinese Support", "University Pickup"],
    recommended: false,
    color: "bg-blue-500"
  }
];

export default function Compare() {
  return (
    <Layout>
      <div className="bg-secondary/30 py-12 border-b">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-heading font-bold mb-4">요금제 비교 (Plan Comparison)</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            한국의 주요 통신사 요금제를 한눈에 비교하세요. 여행 기간과 데이터 사용량에 맞는 최적의 플랜을 찾아드립니다.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group">
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                  BEST CHOICE
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="font-normal">{plan.type}</Badge>
                  <div className="flex items-center text-muted-foreground text-xs">
                    <Signal className="h-3 w-3 mr-1" /> {plan.provider}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="font-medium text-foreground mt-2 text-lg">
                  {plan.price}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Data</div>
                    <div className="font-semibold">{plan.data}</div>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Duration</div>
                    <div className="font-semibold">{plan.days}</div>
                  </div>
                  <ul className="space-y-2 mt-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button className="w-full text-base font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  상세 보기 <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
