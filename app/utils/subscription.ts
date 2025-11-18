export type Currency = "KRW" | "USD";
export type Cycle = "monthly" | "yearly" | "weekly" | "quarterly" | "semiannual";
export type Category = "AI" | "OTT" | "Music" | "Shopping" | "Productivity" | "Other";

export interface SubscriptionItem {
  id: string;        // uuid or timestamp
  name: string;      // "ChatGPT Plus"
  price: number;     // raw amount
  currency: Currency;
  cycle: Cycle;
  category: Category;
}

/**
 * 통화를 원화로 변환
 * @param price 원본 금액
 * @param currency 통화 (KRW 또는 USD)
 * @param rate 환율 (원/달러)
 * @returns 원화 금액
 */
export function toKRW(price: number, currency: Currency, rate: number): number {
  return currency === "USD" ? price * rate : price;
}

/**
 * 구독 항목의 월간 원화 금액 계산
 * @param item 구독 항목
 * @param rate 환율 (원/달러)
 * @returns 월간 원화 금액
 */
export function monthlyKRW(item: SubscriptionItem, rate: number): number {
  const base = toKRW(item.price, item.currency, rate);
  switch (item.cycle) {
    case "monthly":
      return base;
    case "weekly":
      return base * 4.345; // 주간 → 월간 (52주 / 12개월 ≈ 4.345)
    case "yearly":
      return base / 12;
    case "quarterly":
      return base / 3;
    case "semiannual":
      return base / 6;
  }
}

/**
 * 구독 항목의 연간 원화 금액 계산
 * @param item 구독 항목
 * @param rate 환율 (원/달러)
 * @returns 연간 원화 금액
 */
export function yearlyKRW(item: SubscriptionItem, rate: number): number {
  const base = toKRW(item.price, item.currency, rate);
  switch (item.cycle) {
    case "monthly":
      return base * 12;
    case "weekly":
      return base * 52;
    case "yearly":
      return base;
    case "quarterly":
      return base * 4;
    case "semiannual":
      return base * 2;
  }
}

/**
 * 카테고리 표시 텍스트 (한글)
 */
export const categoryLabels: Record<Category, string> = {
  AI: "AI",
  OTT: "OTT",
  Music: "음악",
  Shopping: "쇼핑",
  Productivity: "생산성",
  Other: "기타",
};

/**
 * 주기 표시 텍스트 (한글)
 */
export const cycleLabels: Record<Cycle, string> = {
  monthly: "월간",
  yearly: "연간",
  weekly: "주간",
  quarterly: "3개월",
  semiannual: "6개월",
};

