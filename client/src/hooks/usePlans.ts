import { useQuery } from "@tanstack/react-query";
import { apiPost } from "../lib/api.js";

export interface Plan {
  id: string;
  carrier_id: string;
  plan_type: string;
  payment_type: string; // 'prepaid' (선불) or 'postpaid' (후불)
  name: string;
  description: string | null;
  data_amount_gb: number | null;
  validity_days: number;
  voice_minutes: number | null;
  sms_count: number | null;
  price_krw: number;
  features: string[] | null;
  airport_pickup: boolean;
  esim_support: boolean;
  physical_sim: boolean;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  carrier_name_ko?: string;
  carrier_name_en?: string;
}

export interface PlanFilters {
  carrier_id?: string;
  dataMin?: number;
  dataMax?: number;
  priceMin?: number;
  priceMax?: number;
  plan_type?: string;
  payment_type?: string; // 'prepaid' (선불) or 'postpaid' (후불)
  airport_pickup?: boolean;
  esim_support?: boolean;
  is_popular?: boolean;
}

interface PlansResponse {
  plans: Plan[];
}

interface PlanResponse {
  plan: Plan;
}

interface ComparePlansResponse {
  plans: Plan[];
}

export function usePlans(filters: PlanFilters = {}) {
  return useQuery<Plan[]>({
    queryKey: ["plans", filters],
    queryFn: async () => {
      const data = await apiPost<PlansResponse>("/plans", filters);
      return data.plans;
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

export function usePlan(planId: string) {
  return useQuery<Plan>({
    queryKey: ["plan", planId],
    queryFn: async () => {
      const data = await apiPost<PlanResponse>(`/plans/${planId}`, {});
      return data.plan;
    },
    enabled: !!planId,
  });
}

export function useComparePlans(planIds: string[]) {
  return useQuery<Plan[]>({
    queryKey: ["compare-plans", planIds.join(",")],
    queryFn: async () => {
      const data = await apiPost<ComparePlansResponse>("/plans/compare", {
        plan_ids: planIds,
      });
      return data.plans;
    },
    enabled: planIds.length > 0,
  });
}

