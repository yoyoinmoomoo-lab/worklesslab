"use client";

import { useState, useCallback, useMemo } from "react";
import {
  SubscriptionItem,
  Currency,
  Cycle,
  Category,
  monthlyKRW,
  yearlyKRW,
  categoryLabels,
  cycleLabels,
} from "@/app/utils/subscription";
import { FeedbackBox } from "@/components/tools/FeedbackBox";

const formatNumber = (n: number): string => n.toLocaleString("ko-KR");

// 입력 필드 컴포넌트 (기존 스타일 재사용)
const MoneyInputField = ({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  id: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 숫자와 소수점만 허용
    const filtered = raw.replace(/[^\d.]/g, "");
    const parts = filtered.split(".");
    const filtered2 =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : filtered;
    onChange(filtered2);
  };

  return (
    <input
      id={id}
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
        disabled
          ? "bg-gray-50 text-gray-400 cursor-not-allowed"
          : "text-[#222222]"
      }`}
      value={value}
      onChange={handleChange}
      placeholder={placeholder ?? "0"}
    />
  );
};

// 텍스트 입력 필드
const TextInputField = ({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) => {
  return (
    <input
      id={id}
      type="text"
      autoComplete="off"
      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-[#222222]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};

// Select 필드
const SelectField = ({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (s: string) => void;
  options: { value: string; label: string }[];
}) => {
  return (
    <select
      id={id}
      className="w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sea focus:border-transparent text-text-main bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default function SubscriptionCalculator() {
  const [exchangeRate, setExchangeRate] = useState<string>("1400");
  const [items, setItems] = useState<SubscriptionItem[]>([
    {
      id: Date.now().toString(),
      name: "",
      price: 0,
      currency: "KRW",
      cycle: "monthly",
      category: "Other",
    },
  ]);

  const toNum = (s?: string): number => {
    const n = parseFloat(s ?? "");
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const rate = toNum(exchangeRate) || 1400;

  // 합계 계산
  const monthlyTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.name || item.price <= 0) return sum;
      return sum + monthlyKRW(item, rate);
    }, 0);
  }, [items, rate]);

  const yearlyTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!item.name || item.price <= 0) return sum;
      return sum + yearlyKRW(item, rate);
    }, 0);
  }, [items, rate]);

  // 항목 추가
  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        price: 0,
        currency: "KRW",
        cycle: "monthly",
        category: "Other",
      },
    ]);
  }, []);

  // 항목 삭제
  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      if (prev.length <= 1) {
        alert("최소 1개는 유지해야 합니다.");
        return prev;
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // 항목 업데이트
  const updateItem = useCallback(
    (id: string, patch: Partial<SubscriptionItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  return (
    <>
      <header className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#222222] mb-2">
            월 구독료 계산기
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            여러 구독 서비스의 월/연 총액을 한눈에 계산하세요.
          </p>
        </header>

        {/* 환율 입력 섹션 */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#222222]">
            환율 설정
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                환율 (원/달러)
              </label>
              <MoneyInputField
                id="exchange-rate"
                value={exchangeRate}
                onChange={setExchangeRate}
                placeholder="1400"
              />
              <p className="mt-1 text-xs text-gray-500">
                달러 구독은 이 환율로 원화로 계산합니다. 필요하면 수정하세요.
              </p>
            </div>
          </div>
        </section>

        {/* 구독 항목 입력 테이블 */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#222222]">
              구독 항목 ({items.length})
            </h2>
            <button
              onClick={addItem}
              className="rounded-lg border border-[#007AFF] bg-white px-4 py-2 text-sm font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF] hover:text-white"
            >
              + 항목 추가
            </button>
          </div>

          {/* 데스크톱 테이블 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">
                    구독명
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">
                    금액
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">
                    통화
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">
                    결제 주기
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600">
                    카테고리
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="px-3 py-2">
                      <TextInputField
                        id={`${item.id}-name`}
                        value={item.name}
                        onChange={(v) => updateItem(item.id, { name: v })}
                        placeholder="예: ChatGPT Plus"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <MoneyInputField
                        id={`${item.id}-price`}
                        value={item.price > 0 ? String(item.price) : ""}
                        onChange={(v) =>
                          updateItem(item.id, { price: toNum(v) })
                        }
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <SelectField
                        id={`${item.id}-currency`}
                        value={item.currency}
                        onChange={(v) =>
                          updateItem(item.id, { currency: v as Currency })
                        }
                        options={[
                          { value: "KRW", label: "KRW" },
                          { value: "USD", label: "USD" },
                        ]}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <SelectField
                        id={`${item.id}-cycle`}
                        value={item.cycle}
                        onChange={(v) =>
                          updateItem(item.id, { cycle: v as Cycle })
                        }
                        options={Object.entries(cycleLabels).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <SelectField
                        id={`${item.id}-category`}
                        value={item.category}
                        onChange={(v) =>
                          updateItem(item.id, { category: v as Category })
                        }
                        options={Object.entries(categoryLabels).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors text-lg"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 형식 */}
          <div className="md:hidden space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-[#222222]">구독 항목</h3>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      구독명
                    </label>
                    <TextInputField
                      id={`${item.id}-name-mobile`}
                      value={item.name}
                      onChange={(v) => updateItem(item.id, { name: v })}
                      placeholder="예: ChatGPT Plus"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        금액
                      </label>
                      <MoneyInputField
                        id={`${item.id}-price-mobile`}
                        value={item.price > 0 ? String(item.price) : ""}
                        onChange={(v) =>
                          updateItem(item.id, { price: toNum(v) })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        통화
                      </label>
                      <SelectField
                        id={`${item.id}-currency-mobile`}
                        value={item.currency}
                        onChange={(v) =>
                          updateItem(item.id, { currency: v as Currency })
                        }
                        options={[
                          { value: "KRW", label: "KRW" },
                          { value: "USD", label: "USD" },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        결제 주기
                      </label>
                      <SelectField
                        id={`${item.id}-cycle-mobile`}
                        value={item.cycle}
                        onChange={(v) =>
                          updateItem(item.id, { cycle: v as Cycle })
                        }
                        options={Object.entries(cycleLabels).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        카테고리
                      </label>
                      <SelectField
                        id={`${item.id}-category-mobile`}
                        value={item.category}
                        onChange={(v) =>
                          updateItem(item.id, { category: v as Category })
                        }
                        options={Object.entries(categoryLabels).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 합계 요약 영역 */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#222222]">
            월/연 구독 총액
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-gradient-to-r from-[#007AFF] to-[#0051D5] px-4 py-3 text-white">
              <div className="text-sm opacity-90">월 구독 합계</div>
              <div className="text-2xl md:text-3xl font-bold">
                ￦{formatNumber(Math.round(monthlyTotal))}
              </div>
            </div>
            <div className="rounded-lg bg-gradient-to-r from-[#007AFF] to-[#0051D5] px-4 py-3 text-white">
              <div className="text-sm opacity-90">연 구독 합계</div>
              <div className="text-2xl md:text-3xl font-bold">
                ￦{formatNumber(Math.round(yearlyTotal))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            모든 구독 금액을 환율을 적용해 원화 기준으로 계산했습니다.
          </p>
        </section>

        {/* 피드백 박스 (상시 노출, 합계 박스 아래) */}
        <section className="mt-10 border-t border-gray-200 pt-6">
          <FeedbackBox source="subscription" />
        </section>

        {/* 광고 슬롯 #2 */}
        <div id="ad-slot-2" className="mt-8 md:mt-12">
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center text-gray-400">
            <p className="text-sm">광고 영역 #2</p>
            <p className="mt-1 text-xs">320x100 또는 728x90</p>
          </div>
        </div>
    </>
  );
}

