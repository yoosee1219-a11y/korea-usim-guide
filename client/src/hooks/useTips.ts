import { useQuery } from "@tanstack/react-query";
import { apiPost } from "../lib/api.js";
import { type LanguageCode } from "@/contexts/LanguageContext";

export interface Tip {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  is_published: boolean;
  view_count: number;
  language: LanguageCode;
  original_tip_id: string | null;
  seo_meta: {
    meta_title?: string;
    meta_description?: string;
    keywords?: string[];
  } | null;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface TipFilters {
  category_id?: string;
  page?: number;
  limit?: number;
  is_published?: boolean;
  language?: LanguageCode;
}

export interface TipCategory {
  id: string;
  name: string;
  created_at: string;
}

interface TipsResponse {
  tips: Tip[];
  total: number;
  page: number;
  limit: number;
}

interface TipResponse {
  tip: Tip;
}

interface CategoriesResponse {
  categories: TipCategory[];
}

export function useTips(filters: TipFilters = {}) {
  return useQuery<TipsResponse>({
    queryKey: ["tips", filters],
    queryFn: async () => {
      const response = await apiPost<{ success: boolean; data: TipsResponse }>("/tips", filters);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Use cache on mount
  });
}

export function useTip(tipId: string) {
  return useQuery<Tip>({
    queryKey: ["tip", tipId],
    queryFn: async () => {
      const response = await apiPost<{ success: boolean; data: TipResponse }>(`/tips/${tipId}`, {});
      return response.data.tip;
    },
    enabled: !!tipId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useTipBySlug(slug: string, language?: LanguageCode) {
  return useQuery<Tip>({
    queryKey: ["tip-slug", slug, language],
    queryFn: async () => {
      const response = await apiPost<{ success: boolean; data: TipResponse }>(`/tips/slug/${slug}`, { language });
      return response.data.tip;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useTipCategories() {
  return useQuery<TipCategory[]>({
    queryKey: ["tip-categories"],
    queryFn: async () => {
      const response = await apiPost<{ success: boolean; data: CategoriesResponse }>("/tips/categories", {});
      return response.data.categories;
    },
    staleTime: 1000 * 60 * 60, // 1시간
  });
}

