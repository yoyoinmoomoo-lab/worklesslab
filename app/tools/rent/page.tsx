"use client";

import { useMemo, useRef, useState, useCallback, memo, useEffect, Fragment } from "react";
import { FeedbackBox } from "@/components/tools/FeedbackBox";

type RentType = "JEONSE" | "WOLSE";
type NumStr = string; // "30000000" 같은 원시 문자열

interface CommonInput {
  cashOnHandStr: NumStr; // "300000000"
  annualRatePctStr: NumStr; // "4.25"
}

interface OptionInput {
  id: string; // 동적 ID (옵션1, 옵션2, ...)
  enabled: boolean;
  title: string;                 // 옵션 타이틀
  rentType: RentType;
  depositStr: NumStr;
  monthlyRentStr?: NumStr;
  mgmtFeeStr: NumStr;
  parkingFeeStr: NumStr;
  transportMonthlyStr: NumStr;
  loanAuto: boolean;             // 자동 계산 여부
  loanPrincipalManualStr?: NumStr; // 수동 입력값
}

interface OptionCalcResult {
  loanPrincipal: number;
  monthlyInterest: number;
  monthlyTotal: number; // 월 실지출 (기회비용 미포함)
  ownCapital: number; // 자기자본(내 돈)
  monthlyOpp?: number; // 월 기회비용 (고급 계산용)
  monthlyWithOpp?: number; // 월 실지출(기회비용 포함) (고급 계산용)
  totalBase?: number; // 총 비용(계약기간, 기회비용 미포함) (고급 계산용)
  totalWithOpp?: number; // 총 비용(기회비용 포함) (고급 계산용)
}

// 파서 유틸 (계산시에만 사용)
const onlyDigits = (s: string) => (s ?? "").replace(/\D+/g, "");
const toNum = (s?: string): number => {
  const n = parseFloat(s ?? "");
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// 숫자만 허용하되, 소수점도 허용하는 파서 (연이율용)
const toNumDecimal = (s?: string): number => {
  const cleaned = (s ?? "").replace(/[^\d.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const formatNumber = (n: number): string => n.toLocaleString("ko-KR");

// 만원 → 원 변환 유틸
const manToWon = (man: number): number => Math.round((man || 0) * 10000);

// 한국식 짧은 표기 (출력용 선택): 1억 2,345만원 / 123.4만원 등
function formatKoreanCurrencyShort(won: number): string {
  if (won === 0) return "0원";
  const abs = Math.abs(won);
  const sign = won < 0 ? "-" : "";
  const eok = Math.floor(abs / 100_000_000);
  const rest = abs % 100_000_000;
  const man = Math.round(rest / 10_000);
  if (eok > 0) {
    return `${sign}${eok}억${man ? " " + new Intl.NumberFormat("ko-KR").format(man) + "만원" : ""}`;
  }
  return `${sign}${new Intl.NumberFormat("ko-KR").format(man)}만원`;
}

// 한글 금액 변환 함수
const formatKoreanCurrency = (num: number): string => {
  if (num === 0) return "";
  if (num < 10000) return `${formatNumber(num)}원`;

  const eok = Math.floor(num / 100000000); // 억
  const remainderAfterEok = num % 100000000;
  const man = Math.floor(remainderAfterEok / 10000); // 만
  const remainder = remainderAfterEok % 10000; // 나머지

  const parts: string[] = [];

  // 억 단위
  if (eok > 0) {
    parts.push(`${eok}억`);
  }

  // 만원 단위 처리
  if (man > 0) {
    // 만원 단위가 10 이상이면 그냥 숫자로 표시
    if (man >= 10) {
      parts.push(`${man}만`);
    } else {
      // 만원 단위가 10 미만일 때만 천/백/십/일 단위로 분해
      const manParts: string[] = [];
      const cheon = Math.floor(man / 1000);
      const baek = Math.floor((man % 1000) / 100);
      const sip = Math.floor((man % 100) / 10);
      const il = man % 10;

      if (cheon > 0) manParts.push(`${cheon}천`);
      if (baek > 0) manParts.push(`${baek}백`);
      if (sip > 0) manParts.push(`${sip}십`);
      if (il > 0) manParts.push(`${il}`);

      if (manParts.length > 0) {
        parts.push(manParts.join(" ") + "만");
      } else {
        parts.push(`${man}만`);
      }
    }
  }

  // 나머지 (만원 미만) - 억 단위가 없을 때만 표시
  if (remainder > 0 && eok === 0) {
    const remParts: string[] = [];
    const cheon = Math.floor(remainder / 1000);
    const baek = Math.floor((remainder % 1000) / 100);
    const sip = Math.floor((remainder % 100) / 10);
    const il = remainder % 10;

    if (cheon > 0) remParts.push(`${cheon}천`);
    if (baek > 0) remParts.push(`${baek}백`);
    if (sip > 0) remParts.push(`${sip}십`);
    if (il > 0) remParts.push(`${il}`);

    if (remParts.length > 0) {
      parts.push(remParts.join(" "));
    }
  }

  return parts.length > 0 ? parts.join(" ") + "원" : "";
};

const fmtStr = (s?: string) => formatNumber(toNum(s));
const fmtStrDecimal = (s?: string) => {
  const n = toNumDecimal(s);
  return n > 0 ? n.toFixed(2) : "";
};

// 대출원금 계산 (만원 단위 입력값을 원으로 변환)
const calcLoanPrincipal = (o: OptionInput, c: CommonInput): number => {
  if (!o.loanAuto) {
    // 수동 입력값도 만원 단위
    return manToWon(toNum(o.loanPrincipalManualStr));
  }
  // 보증금(만원) - 보유현금(만원) = 만원 단위 차이 → 원으로 변환
  return manToWon(Math.max(toNum(o.depositStr) - toNum(c.cashOnHandStr), 0));
};

// 월 이자 계산
const calcMonthlyInterest = (
  loanPrincipal: number,
  annualRatePctStr: string
): number => {
  return Math.floor(
    loanPrincipal * (toNumDecimal(annualRatePctStr) / 100) / 12
  );
};

// 자기자본 계산 (묶이는 금액) - 만원 단위로 비교 후 원으로 변환
function calcOwnCapital(o: OptionInput, c: CommonInput): number {
  return manToWon(Math.min(toNum(o.depositStr), toNum(c.cashOnHandStr)));
}

// 월 기회비용 계산
function calcMonthlyOppCost(
  o: OptionInput,
  c: CommonInput,
  oppRatePct: number
): number {
  if (oppRatePct <= 0) return 0;
  const ownCapital = calcOwnCapital(o, c);
  return Math.floor(ownCapital * (oppRatePct / 100) / 12);
}

// 월 실지출 합계 계산 (만원 단위 입력값을 원으로 변환)
function calcMonthlyTotal(
  o: OptionInput,
  c: CommonInput,
  advanced?: { enabled: boolean; termYears: number; oppRatePct: number } | { enabled: boolean; termYearsStr: string; oppRatePctStr: string }
): OptionCalcResult {
  const lp = calcLoanPrincipal(o, c);
  const interest = calcMonthlyInterest(lp, c.annualRatePctStr);
  // 관리비, 주차비, 교통비는 원 단위 그대로
  const base =
    toNum(o.mgmtFeeStr) +
    toNum(o.parkingFeeStr) +
    toNum(o.transportMonthlyStr);
  // 월세는 만원 단위 → 원으로 변환
  const wolse = o.rentType === "WOLSE" ? manToWon(toNum(o.monthlyRentStr)) : 0;
  const monthlyTotal = base + wolse + interest;

  // 자기자본은 항상 계산 (고급 계산 ON/OFF 관계없이)
  const cap = calcOwnCapital(o, c);

  const result: OptionCalcResult = {
    loanPrincipal: lp,
    monthlyInterest: interest,
    monthlyTotal: monthlyTotal,
    ownCapital: cap,
  };

  // 고급 계산이 활성화된 경우
  if (advanced?.enabled) {
    const oppRatePct = 'oppRatePct' in advanced ? (advanced.oppRatePct ?? 0) : (toNumDecimal(advanced.oppRatePctStr) || 0);
    const monthlyOpp = Math.floor(cap * (oppRatePct / 100) / 12);
    const monthlyWithOpp = monthlyTotal + monthlyOpp;

    const term = 'termYears' in advanced ? (advanced.termYears ?? 2) : (toNum(advanced.termYearsStr) || 2);
    const totalBase = monthlyTotal * 12 * term;
    const totalWithOpp = monthlyWithOpp * 12 * term;

    result.monthlyOpp = monthlyOpp;
    result.monthlyWithOpp = monthlyWithOpp;
    result.totalBase = totalBase;
    result.totalWithOpp = totalWithOpp;
  }

  return result;
}

// MoneyInput 컴포넌트 (문자열 컨트롤 + 커서 보존)
type MoneyInputProps = {
  value: string; // 문자열로 유지
  onChange: (s: string) => void;
  placeholder?: string;
  allowDecimal?: boolean;
  disabled?: boolean;
};

// 각 입력 필드를 완전히 독립적인 컴포넌트로 분리
const MoneyInputField = memo(function MoneyInputField({
  id,
  value,
  onChange,
  placeholder,
  allowDecimal = false,
  disabled = false,
}: MoneyInputProps & { id: string }) {
  // 숫자만 허용하되, 빈문자열 허용
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (allowDecimal) {
      // 소수점 허용 (연이율용)
      const filtered = raw.replace(/[^\d.]/g, "");
      // 소수점이 하나만 있도록 제한
      const parts = filtered.split(".");
      const filtered2 =
        parts.length > 2
          ? parts[0] + "." + parts.slice(1).join("")
          : filtered;
      onChange(filtered2);
    } else {
      // 정수만 허용
      const filtered = raw.replace(/[^\d]/g, "");
      onChange(filtered);
    }
  };

  return (
    <input
      id={id}
      inputMode={allowDecimal ? "decimal" : "numeric"}
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
}, (prevProps, nextProps) => {
  // 값과 설정이 같으면 리렌더링하지 않음 (onChange는 비교하지 않음)
  // onChange가 변경되어도 실제 값이 같으면 리렌더링하지 않음
  return (
    prevProps.id === nextProps.id &&
    prevProps.value === nextProps.value && 
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.allowDecimal === nextProps.allowDecimal &&
    prevProps.disabled === nextProps.disabled
  );
});

MoneyInputField.displayName = "MoneyInputField";

// 만원 단위 입력 컴포넌트
const MoneyInputMan = memo(function MoneyInputMan({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  id: string;
  value: string;
  onChange?: (s: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange || disabled) return;
    const raw = e.target.value;
    // 숫자만 허용
    const filtered = raw.replace(/[^\d]/g, "");
    onChange(filtered);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d]/g, "");
    if (v) {
      e.target.value = new Intl.NumberFormat("ko-KR").format(Number(v));
    }
  };

  return (
    <input
      id={id}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      disabled={disabled}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
        disabled
          ? "bg-gray-50 text-gray-400 cursor-not-allowed"
          : "text-[#222222]"
      }`}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.value === nextProps.value &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.disabled === nextProps.disabled
  );
});

MoneyInputMan.displayName = "MoneyInputMan";

// 소수점 입력 컴포넌트 (기회비용 연수익률용)
const DecimalInput = memo(function DecimalInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/[^0-9.]/g, "");
      const parts = v.split(".");
      if (parts.length > 2) {
        v = parts[0] + "." + parts.slice(1).join("");
      }
      onChange(v);
    },
    [onChange]
  );

  return (
    <input
      id={id}
      inputMode="decimal"
      autoComplete="off"
      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-[#222222]"
      value={value}
      onChange={handleChange}
      placeholder={placeholder ?? "0.0"}
    />
  );
});

DecimalInput.displayName = "DecimalInput";

// 비활성화된 입력 필드 컴포넌트
const DisabledBox = memo(function DisabledBox({ label }: { label: string }) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium text-gray-500">{label}</div>
      <input
        className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
        value="—"
        disabled
        aria-disabled
        readOnly
      />
    </div>
  );
});

DisabledBox.displayName = "DisabledBox";

export default function RentCalculator() {
  const [common, setCommon] = useState<CommonInput>({
    cashOnHandStr: "",
    annualRatePctStr: "",
  });

  const [showResults, setShowResults] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [dirty, setDirty] = useState(false); // 입력 변경 추적
  const [advanced, setAdvanced] = useState({
    enabled: false,
    termYearsStr: "2",
    oppRatePctStr: "",
  });

  // 비교표 스냅샷 상태
  const [snapshot, setSnapshot] = useState<{
    common: CommonInput;
    options: OptionInput[];
    advanced: { termYears: number; oppRatePct: number; enabled: boolean };
    results: Map<string, OptionCalcResult>;
  } | null>(null);

  const [opts, setOpts] = useState<OptionInput[]>([
    {
      id: "옵션1",
      enabled: true,
      title: "옵션1",
      rentType: "JEONSE",
      depositStr: "",
      mgmtFeeStr: "",
      parkingFeeStr: "",
      transportMonthlyStr: "",
      loanAuto: true,
      loanPrincipalManualStr: "",
    },
    {
      id: "옵션2",
      enabled: true,
      title: "옵션2",
      rentType: "WOLSE",
      depositStr: "",
      monthlyRentStr: "",
      mgmtFeeStr: "",
      parkingFeeStr: "",
      transportMonthlyStr: "",
      loanAuto: true,
      loanPrincipalManualStr: "",
    },
  ]);

  const resultWrapRef = useRef<HTMLDivElement>(null);

  // 전체 결과 계산 함수
  function computeAll(
    optsState = opts,
    commonState = common,
    advState = advanced
  ) {
    const map = new Map<string, OptionCalcResult>();
    const termYears = toNum(advState.termYearsStr) || 2;
    const oppRatePct = toNumDecimal(advState.oppRatePctStr) || 0;
    const advCalc = advState.enabled
      ? { enabled: true, termYears, oppRatePct }
      : { enabled: false, termYears: 2, oppRatePct: 0 };

    optsState.forEach((o) => {
      if (o.enabled) {
        map.set(o.id, calcMonthlyTotal(o, commonState, advCalc));
      }
    });
    return map;
  }

  // 옵션 카드용 실시간 결과 (참고용만)
  const realtimeResults = useMemo(() => {
    return computeAll();
  }, [opts, common, advanced]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCompare = useCallback(() => {
    // 비교 클릭 카운터 (10회당 1회만 인터스티셜)
    const key = "rentcalc_compare_count_v1";
    const n = parseInt(localStorage.getItem(key) || "0", 10) + 1;
    localStorage.setItem(key, String(n));

    const shouldShowInterstitial = n % 10 === 0; // 10회당 1회

    // 스냅샷 생성
    const results = computeAll();
    const termYears = toNum(advanced.termYearsStr) || 2;
    const oppRatePct = toNumDecimal(advanced.oppRatePctStr) || 0;

    const createSnapshot = () => {
      setSnapshot({
        common: { ...common },
        options: JSON.parse(JSON.stringify(opts)), // 깊은 복사
        advanced: {
          termYears,
          oppRatePct,
          enabled: advanced.enabled,
        },
        results,
      });
      setShowResults(true);
    };

    if (shouldShowInterstitial) {
      setShowAd(true);
      setAdCountdown(5);

      // 기존 타이머가 있으면 정리
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setShowAd(false);
            createSnapshot();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // 인터스티셜 없이 바로 스냅샷 생성 및 결과 표시
      createSnapshot();
    }
  }, [opts, common, advanced]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const setCommonField = useCallback(
    (k: keyof CommonInput) => (v: string) => {
      setDirty(true); // 입력 변경 시 dirty 표시
      setCommon((p) => ({ ...p, [k]: v }));
    },
    []
  );

  const setOpt = useCallback(
    (id: string, patch: Partial<OptionInput>) => {
      setDirty(true); // 입력 변경 시 dirty 표시
      setOpts((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    },
    []
  );

  const addOption = useCallback(() => {
    if (opts.length >= 5) {
      alert("최대 5개까지 추가할 수 있습니다.");
      return;
    }
    // 기존 옵션 번호 중 최대값 찾기
    const maxNum = opts.reduce((max, opt) => {
      const match = opt.id.match(/옵션(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const newId = `옵션${maxNum + 1}`;
    setOpts((prev) => [
      ...prev,
      {
        id: newId,
        enabled: true,
        title: "",
        rentType: "WOLSE",
        depositStr: "",
        monthlyRentStr: "",
        mgmtFeeStr: "",
        parkingFeeStr: "",
        transportMonthlyStr: "",
        loanAuto: true,
      },
    ]);
  }, [opts]);

  const removeOption = useCallback(
    (id: string) => {
      if (opts.length <= 1) {
        alert("최소 1개는 유지해야 합니다.");
        return;
      }
      setOpts((prev) => prev.filter((o) => o.id !== id));
    },
    [opts.length]
  );

  const copyTotal = useCallback(async (id: string) => {
    const r = realtimeResults.get(id);
    if (!r) return;
    try {
      await navigator.clipboard.writeText(String(r.monthlyTotal));
      alert(`${id} 합계가 복사되었습니다: ${formatNumber(r.monthlyTotal)}원`);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  }, [realtimeResults]);


  // 결과 표시 컴포넌트 (별도 분리)
  const ResultDisplay = memo(
    ({
      opt,
      result,
      common,
      onCopy,
    }: {
      opt: OptionInput;
      result: OptionCalcResult;
      common: CommonInput;
      onCopy: () => void;
    }) => (
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-2 text-sm text-gray-500">
          {opt.id} · {opt.title || "제목 미지정"}
        </div>
        <div className="mb-4 rounded-lg bg-gradient-to-r from-[#007AFF] to-[#0051D5] px-4 py-3 text-white">
          <div className="text-sm opacity-90">월 실지출</div>
          <div className="text-2xl md:text-3xl font-bold">
            {formatNumber(result.monthlyTotal)}원
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600">
              <th className="py-2 font-semibold">항목</th>
              <th className="py-2 text-right font-semibold">금액</th>
              <th className="py-2 text-center font-semibold">비고</th>
            </tr>
          </thead>
          <tbody className="text-[#222222]">
            <tr className="border-b border-gray-200">
              <td className="py-2">보증금</td>
              <td className="py-2 text-right">{fmtStr(opt.depositStr)}</td>
              <td className="py-2 text-center text-gray-500 text-xs">기준</td>
            </tr>
            {opt.rentType === "WOLSE" && (
              <tr className="border-b border-gray-200">
                <td className="py-2">월세</td>
                <td className="py-2 text-right">
                  {fmtStr(opt.monthlyRentStr)}
                </td>
                <td className="py-2 text-center text-gray-500 text-xs">-</td>
              </tr>
            )}
            <tr className="border-b border-gray-200">
              <td className="py-2">관리비</td>
              <td className="py-2 text-right">{fmtStr(opt.mgmtFeeStr)}</td>
              <td className="py-2 text-center text-gray-500 text-xs">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">주차비</td>
              <td className="py-2 text-right">{fmtStr(opt.parkingFeeStr)}</td>
              <td className="py-2 text-center text-gray-500 text-xs">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">교통비</td>
              <td className="py-2 text-right">
                {fmtStr(opt.transportMonthlyStr)}
              </td>
              <td className="py-2 text-center text-gray-500 text-xs">-</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">대출원금</td>
              <td className="py-2 text-right">
                {formatNumber(result.loanPrincipal)}
              </td>
              <td className="py-2 text-center text-gray-500 text-xs">
                {toNumDecimal(common.annualRatePctStr) > 0
                  ? `${fmtStrDecimal(common.annualRatePctStr)}%`
                  : "-"}
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2">월 이자</td>
              <td className="py-2 text-right">
                {formatNumber(result.monthlyInterest)}
              </td>
              <td className="py-2 text-center text-gray-500 text-xs">
                연이율/12
              </td>
            </tr>
            <tr className="bg-gray-100 font-semibold">
              <td className="py-2">월 합계</td>
              <td className="py-2 text-right text-[#007AFF]">
                {formatNumber(result.monthlyTotal)}
              </td>
              <td className="py-2 text-center text-gray-500 text-xs">-</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-lg bg-[#007AFF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0051D5]"
            onClick={onCopy}
          >
            합계 복사
          </button>
        </div>
      </div>
    )
  );

  ResultDisplay.displayName = "ResultDisplay";

  // === 유틸: 결과 포맷 ===
  const dash = "—";
  const won = (n?: number) =>
    typeof n === "number" ? n.toLocaleString("ko-KR") : dash;
  const KRW = (n: number) => n.toLocaleString("ko-KR");

  // 차액 표시 컴포넌트
  const Delta = memo(function Delta({
    val,
    best,
  }: {
    val?: number;
    best?: number;
  }) {
    if (typeof val !== "number" || typeof best !== "number") return null;
    const d = val - best;
    if (d <= 0)
      return (
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">
          최저
        </span>
      );
    return <span className="text-xs text-gray-500">+{KRW(d)}</span>;
  });

  Delta.displayName = "Delta";

  // 결과 맵에서 사용 가능한 옵션 id만 뽑기
  const enabledIds = (opts: OptionInput[]) =>
    opts.filter((o) => o.enabled).map((o) => o.id);

  // 최저 월합계와 차액 계산
  function getBestTotals(
    results: Map<string, OptionCalcResult>,
    ids: string[]
  ) {
    const list = ids.map((id) => ({
      id,
      total: results.get(id)?.monthlyTotal ?? Number.POSITIVE_INFINITY,
    }));
    const best = list.reduce(
      (m, c) => (c.total < m.total ? c : m),
      list[0] ?? { id: "", total: Infinity }
    );
    return { bestId: best?.id, bestTotal: best?.total };
  }

  // === 하단 비교표 ===
  function CompareTable({
    opts,
    results,
    adv,
  }: {
    opts: OptionInput[];
    results: Map<string, OptionCalcResult>;
    adv: { termYears: number; oppRatePct: number; enabled: boolean };
  }) {
    // 활성화된 옵션 ID만 추출
    const enabledOpts = opts.filter((o) => o.enabled);
    const ids = enabledOpts.map((o) => o.id);

    // 최저/차액 유틸
    const KRW = (n: number) => n.toLocaleString("ko-KR");

    // 베스트 값들 계산 (섹션별로 따로)
    const bestMonthlyBase = Math.min(
      ...ids.map((id) => results.get(id)?.monthlyTotal ?? Infinity)
    );
    const bestTotalBase = adv.enabled
      ? Math.min(...ids.map((id) => results.get(id)?.totalBase ?? Infinity))
      : Infinity;
    const bestMonthlyWithOpp = adv.enabled
      ? Math.min(
          ...ids.map((id) => results.get(id)?.monthlyWithOpp ?? Infinity)
        )
      : Infinity;
    const bestTotalWithOpp = adv.enabled
      ? Math.min(
          ...ids.map((id) => results.get(id)?.totalWithOpp ?? Infinity)
        )
      : Infinity;

    // 옵션 id -> 표시값 헬퍼
    const get = (id: string) => {
      const o = opts.find((x) => x.id === id);
      const r = results.get(id);
      return { o, r };
    };

    // Delta 컴포넌트
    const Delta = ({ val, best }: { val?: number; best?: number }) => {
      if (typeof val !== "number" || typeof best !== "number") return null;
      const d = val - best;
      if (d <= 0)
        return (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-600">
            최저
          </span>
        );
      return <span className="text-xs text-gray-500">+{KRW(d)}</span>;
    };

    // 항상 5개 슬롯으로 고정
    const MAX_OPTIONS = 5;
    const active = opts.filter((o) => o.enabled);
    const slots = [...active, ...Array(Math.max(0, MAX_OPTIONS - active.length)).fill(null)];
    
    // 고정 폭 설정
    const FIRST_W = 140; // 항목명 열
    const COL_W = 160; // 옵션 열(각각)
    const TABLE_MINW = FIRST_W + MAX_OPTIONS * COL_W; // 140 + 5*160 = 940

    return (
      <section
        id="compare-table"
        className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 text-lg font-semibold text-[#222222]">
          옵션 비교표
        </div>

        {/* 모바일 스크롤 안내 */}
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 md:hidden">
          <span>←</span>
          <span>좌우로 스크롤하여 모든 옵션을 확인하세요</span>
          <span>→</span>
        </div>

        <div className="w-full overflow-x-auto">
          <table
            className="w-full border-collapse text-sm"
            style={{ minWidth: TABLE_MINW }}
          >
            <colgroup>
              <col style={{ width: FIRST_W }} />
              {Array.from({ length: MAX_OPTIONS }).map((_, i) => (
                <col key={i} style={{ width: COL_W }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-4 py-2 text-left text-gray-500 whitespace-nowrap">
                  항목
                </th>
                {slots.map((opt, i) => (
                  <th
                    key={i}
                    className={`px-3 py-2 text-right ${!opt ? "text-gray-300" : ""}`}
                    title={opt?.title || "비어 있음"}
                  >
                    {opt ? (opt.title || opt.id) : "—"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 계약정보 */}
              <tr className="border-t bg-gray-50">
                <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
                  계약정보
                </td>
                {slots.map((opt, i) => (
                  <td key={i} className="px-3 py-2"></td>
                ))}
              </tr>
              <tr className="border-t border-gray-200">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                  거래유형
                </td>
                {slots.map((opt, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2 text-right align-middle text-[#222222] ${!opt ? "text-gray-300" : ""}`}
                  >
                    {opt && opt.enabled
                      ? opt.rentType === "JEONSE"
                        ? "전세"
                        : "월세"
                      : dash}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-gray-200">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                  보증금
                </td>
                {slots.map((opt, i) => {
                  const r = opt ? results.get(opt.id) : null;
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                    >
                      {opt && opt.enabled && r
                        ? KRW(manToWon(toNum(opt.depositStr)))
                        : dash}
                    </td>
                  );
                })}
              </tr>

              {/* 월 고정비 */}
              <tr className="border-t bg-gray-50">
                <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
                  월 고정비
                </td>
                {slots.map((opt, i) => (
                  <td key={i} className="px-3 py-2"></td>
                ))}
              </tr>
              {[
                {
                  label: "월세",
                  getVal: (opt: OptionInput | null) => {
                    if (!opt || !opt.enabled) return null;
                    return opt.rentType === "WOLSE"
                      ? manToWon(toNum(opt.monthlyRentStr))
                      : null;
                  },
                },
                {
                  label: "관리비",
                  getVal: (opt: OptionInput | null) => opt && opt.enabled ? toNum(opt.mgmtFeeStr || "") : null,
                },
                {
                  label: "주차비",
                  getVal: (opt: OptionInput | null) => opt && opt.enabled ? toNum(opt.parkingFeeStr || "") : null,
                },
                {
                  label: "교통비",
                  getVal: (opt: OptionInput | null) => opt && opt.enabled ? toNum(opt.transportMonthlyStr || "") : null,
                },
              ].map((row) => (
                <tr key={row.label} className="border-t border-gray-200">
                  <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                    {row.label}
                  </td>
                  {slots.map((opt, i) => {
                    const v = row.getVal(opt);
                    return (
                      <td
                        key={i}
                        className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                      >
                        {opt && opt.enabled ? (v != null ? KRW(v) : dash) : dash}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* 대출/이자 */}
              <tr className="border-t bg-gray-50">
                <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
                  대출/이자
                </td>
                {slots.map((opt, i) => (
                  <td key={i} className="px-3 py-2"></td>
                ))}
              </tr>
              <tr className="border-t border-gray-200">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                  대출원금
                </td>
                {slots.map((opt, i) => {
                  const r = opt ? results.get(opt.id) : null;
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                    >
                      {opt && opt.enabled && r ? KRW(r.loanPrincipal) : dash}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-t border-gray-200">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                  월 이자
                </td>
                {slots.map((opt, i) => {
                  const r = opt ? results.get(opt.id) : null;
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                    >
                      {opt && opt.enabled && r ? KRW(r.monthlyInterest) : dash}
                    </td>
                  );
                })}
              </tr>

              {/* 합계 */}
              <tr className="border-t bg-gray-50">
                <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
                  합계
                </td>
                {slots.map((opt, i) => (
                  <td key={i} className="px-3 py-2"></td>
                ))}
              </tr>
              <tr className="border-t border-gray-200">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                  월 합계
                </td>
                {slots.map((opt, i) => {
                  const v = opt ? results.get(opt.id)?.monthlyTotal : undefined;
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                    >
                      {opt && opt.enabled ? (
                        <div className="inline-flex items-center justify-end gap-2 w-full">
                          <Delta val={v} best={bestMonthlyBase} />
                          <span className="font-semibold text-[#222222]">
                            {typeof v === "number" ? KRW(v) : dash}
                          </span>
                        </div>
                      ) : (
                        dash
                      )}
                    </td>
                  );
                })}
              </tr>
              {adv.enabled && (
                <tr className="border-t border-gray-200">
                  <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                    총 비용
                  </td>
                  {slots.map((opt, i) => {
                    const v = opt ? results.get(opt.id)?.totalBase : undefined;
                    return (
                      <td
                        key={i}
                        className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                      >
                        {opt && opt.enabled ? (
                          <div className="inline-flex items-center justify-end gap-2 w-full">
                            <Delta val={v} best={bestTotalBase} />
                            <span className="font-semibold text-[#222222]">
                              {typeof v === "number" ? KRW(v) : dash}
                            </span>
                          </div>
                        ) : (
                          dash
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* 합계(+기회비용) */}
              {adv.enabled && (
                <>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
                      합계(+기회비용)
                    </td>
                    {slots.map((opt, i) => (
                      <td key={i} className="px-3 py-2"></td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                      내 돈
                    </td>
                    {slots.map((opt, i) => {
                      const v = opt ? results.get(opt.id)?.ownCapital : undefined;
                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                        >
                          {opt && opt.enabled ? (typeof v === "number" ? KRW(v) : dash) : dash}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                      월 기회비용
                    </td>
                    {slots.map((opt, i) => {
                      const v = opt ? results.get(opt.id)?.monthlyOpp : undefined;
                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                        >
                          {opt && opt.enabled ? (typeof v === "number" ? KRW(v) : dash) : dash}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                      월 합계
                    </td>
                    {slots.map((opt, i) => {
                      const v = opt ? results.get(opt.id)?.monthlyWithOpp : undefined;
                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                        >
                          {opt && opt.enabled ? (
                            <div className="inline-flex items-center justify-end gap-2 w-full">
                              <Delta val={v} best={bestMonthlyWithOpp} />
                              <span className="font-semibold text-[#222222]">
                                {typeof v === "number" ? KRW(v) : dash}
                              </span>
                            </div>
                          ) : (
                            dash
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 pl-8 whitespace-nowrap text-left text-[#222222] truncate">
                      총 비용
                    </td>
                    {slots.map((opt, i) => {
                      const v = opt ? results.get(opt.id)?.totalWithOpp : undefined;
                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 text-right align-middle text-[#222222] tabular-nums ${!opt ? "text-gray-300" : ""}`}
                        >
                          {opt && opt.enabled ? (
                            <div className="inline-flex items-center justify-end gap-2 w-full">
                              <Delta val={v} best={bestTotalWithOpp} />
                              <span className="font-semibold text-[#222222]">
                                {typeof v === "number" ? KRW(v) : dash}
                              </span>
                            </div>
                          ) : (
                            dash
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          * 월 이자 = 대출원금 × (연이율/12). 최저가 기준으로 차액을 표시합니다.
        </p>
      </section>
    );
  }

  // 옵션 필드별 setter 함수 (공통 입력과 동일한 패턴)
  const setOptField = useCallback(
    (id: string, field: "depositStr" | "monthlyRentStr" | "mgmtFeeStr" | "parkingFeeStr" | "transportMonthlyStr" | "loanPrincipalManualStr") => (v: string) => {
      setDirty(true); // 입력 변경 시 dirty 표시
      setOpts((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, [field]: v } : o
        )
      );
    },
    []
  );

  const OptionCard = memo(
    ({
      opt,
      result,
      common,
      onSetOpt,
      onCopy,
      showResults,
    }: {
      opt: OptionInput;
      result?: OptionCalcResult;
      common: CommonInput;
      onSetOpt: (id: string, patch: Partial<OptionInput>) => void;
      onCopy: (id: string) => void;
      showResults: boolean;
    }) => {
      const o = opt;
      const r = result;

      return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm min-h-[420px]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <input
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
              value={o.title}
              onChange={(e) => onSetOpt(o.id, { title: e.target.value })}
              placeholder={`${o.id} 제목`}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
              <input
                type="checkbox"
                checked={o.enabled}
                onChange={(e) =>
                  onSetOpt(o.id, { enabled: e.target.checked })
                }
                className="rounded"
              />
              사용
            </label>
        </div>

          <div className="mb-4 flex gap-3">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                o.rentType === "JEONSE"
                  ? "bg-[#007AFF] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => onSetOpt(o.id, { rentType: "JEONSE" })}
            >
              전세
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                o.rentType === "WOLSE"
                  ? "bg-[#007AFF] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => onSetOpt(o.id, { rentType: "WOLSE" })}
            >
              월세
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Row 1: 보증금 | 월세 */}
            <div>
              <div className="mb-1 text-sm font-medium text-gray-700">
                보증금(원)
              </div>
              <MoneyInputField
                id={`${o.id}-deposit`}
                value={o.depositStr}
                onChange={setOptField(o.id, "depositStr")}
              />
              {o.depositStr && toNum(o.depositStr) >= 10000 && (
                <div className="mt-1 text-xs text-[#007AFF]">
                  {formatKoreanCurrency(toNum(o.depositStr))}
                </div>
              )}
            </div>
            <div>
              {o.rentType === "WOLSE" ? (
                <>
                  <div className="mb-1 text-sm font-medium text-gray-700">
                    월세(원)
                  </div>
                  <MoneyInputField
                    id={`${o.id}-monthlyRent`}
                    value={o.monthlyRentStr ?? ""}
                    onChange={setOptField(o.id, "monthlyRentStr")}
                  />
                  {o.monthlyRentStr && toNum(o.monthlyRentStr) >= 10000 && (
                    <div className="mt-1 text-xs text-[#007AFF]">
                      {formatKoreanCurrency(toNum(o.monthlyRentStr))}
                    </div>
                  )}
                </>
              ) : (
                <DisabledBox label="월세(원)" />
              )}
            </div>

            {/* Row 2: 관리비 | 주차비 */}
            <div>
              <div className="mb-1 text-sm font-medium text-gray-700">
                관리비(원)
              </div>
              <MoneyInputField
                id={`${o.id}-mgmtFee`}
                value={o.mgmtFeeStr}
                onChange={setOptField(o.id, "mgmtFeeStr")}
              />
              {o.mgmtFeeStr && toNum(o.mgmtFeeStr) >= 10000 && (
                <div className="mt-1 text-xs text-[#007AFF]">
                  {formatKoreanCurrency(toNum(o.mgmtFeeStr))}
                </div>
              )}
            </div>
            <div>
              <div className="mb-1 text-sm font-medium text-gray-700">
                주차비(원)
              </div>
              <MoneyInputField
                id={`${o.id}-parkingFee`}
                value={o.parkingFeeStr}
                onChange={setOptField(o.id, "parkingFeeStr")}
              />
              {o.parkingFeeStr && toNum(o.parkingFeeStr) >= 10000 && (
                <div className="mt-1 text-xs text-[#007AFF]">
                  {formatKoreanCurrency(toNum(o.parkingFeeStr))}
                </div>
              )}
            </div>

            {/* Row 3: 교통비 | 대출 계산 */}
            <div>
              <div className="mb-1 text-sm font-medium text-gray-700">
                교통비(월, 원)
              </div>
              <MoneyInputField
                id={`${o.id}-transportMonthly`}
                value={o.transportMonthlyStr}
                onChange={setOptField(o.id, "transportMonthlyStr")}
              />
              {o.transportMonthlyStr && toNum(o.transportMonthlyStr) >= 10000 && (
                <div className="mt-1 text-xs text-[#007AFF]">
                  {formatKoreanCurrency(toNum(o.transportMonthlyStr))}
                </div>
              )}
            </div>
            <div className="flex items-end justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={o.loanAuto}
                  onChange={(e) =>
                    onSetOpt(o.id, { loanAuto: e.target.checked })
                  }
                />
                대출 원금 자동(보증금-보유현금)
              </label>
            </div>

            {/* Row 4: 대출원금(항상 표시, 자동이면 비활성 + 자동값 표시) */}
            <div className="col-span-2">
              <div className="mb-1 text-sm font-medium text-gray-700">
                대출원금(원)
              </div>
              <MoneyInputField
                id={`${o.id}-loanPrincipal`}
                value={
                  o.loanAuto
                    ? String(
                        Math.max(
                          toNum(o.depositStr) - toNum(common.cashOnHandStr),
                          0
                        )
                      )
                    : o.loanPrincipalManualStr ?? ""
                }
                onChange={(s) =>
                  !o.loanAuto &&
                  setOptField(o.id, "loanPrincipalManualStr")(s)
                }
                disabled={o.loanAuto}
              />
              {o.loanAuto && (
                <p className="mt-1 text-xs text-gray-500">
                  보증금-보유현금으로 자동 계산됩니다.
                </p>
              )}
              {!o.loanAuto &&
                o.loanPrincipalManualStr &&
                toNum(o.loanPrincipalManualStr) >= 10000 && (
                  <div className="mt-1 text-xs text-[#007AFF]">
                    {formatKoreanCurrency(toNum(o.loanPrincipalManualStr))}
                  </div>
                )}
              {o.loanAuto &&
                toNum(o.depositStr) - toNum(common.cashOnHandStr) >= 10000 && (
                  <div className="mt-1 text-xs text-[#007AFF]">
                    {formatKoreanCurrency(
                      Math.max(
                        toNum(o.depositStr) - toNum(common.cashOnHandStr),
                        0
                      )
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* 결과 표시 */}
          {showResults && o.enabled && r && (
            <ResultDisplay
              opt={o}
              result={r}
              common={common}
              onCopy={() => onCopy(o.id)}
            />
          )}
        </div>
      );
    }
  );

  OptionCard.displayName = "OptionCard";

  // OptionCard의 props 비교 함수 커스터마이징
  const areEqual = (
    prevProps: {
      opt: OptionInput;
      result?: OptionCalcResult;
      common: CommonInput;
      onSetOpt: (id: string, patch: Partial<OptionInput>) => void;
      onCopy: (id: string) => void;
      showResults: boolean;
    },
    nextProps: {
      opt: OptionInput;
      result?: OptionCalcResult;
      common: CommonInput;
      onSetOpt: (id: string, patch: Partial<OptionInput>) => void;
      onCopy: (id: string) => void;
      showResults: boolean;
    }
  ) => {
    // showResults가 변경되면 리렌더링
    if (prevProps.showResults !== nextProps.showResults) return false;
    
    // opt의 실제 값들이 변경되었는지 확인 (참조가 아닌 값 비교)
    if (
      prevProps.opt.id !== nextProps.opt.id ||
      prevProps.opt.enabled !== nextProps.opt.enabled ||
      prevProps.opt.title !== nextProps.opt.title ||
      prevProps.opt.rentType !== nextProps.opt.rentType ||
      prevProps.opt.loanAuto !== nextProps.opt.loanAuto ||
      prevProps.opt.depositStr !== nextProps.opt.depositStr ||
      prevProps.opt.monthlyRentStr !== nextProps.opt.monthlyRentStr ||
      prevProps.opt.mgmtFeeStr !== nextProps.opt.mgmtFeeStr ||
      prevProps.opt.parkingFeeStr !== nextProps.opt.parkingFeeStr ||
      prevProps.opt.transportMonthlyStr !== nextProps.opt.transportMonthlyStr ||
      prevProps.opt.loanPrincipalManualStr !== nextProps.opt.loanPrincipalManualStr
    ) {
      return false;
    }
    
    // common의 값들이 변경되었는지 확인
    if (
      prevProps.common.cashOnHandStr !== nextProps.common.cashOnHandStr ||
      prevProps.common.annualRatePctStr !== nextProps.common.annualRatePctStr
    ) {
      return false;
    }
    
    // result는 showResults가 false일 때는 비교하지 않음
    if (prevProps.showResults && nextProps.showResults) {
      if (prevProps.result?.monthlyTotal !== nextProps.result?.monthlyTotal) {
        return false;
      }
    }
    
    return true;
  };

  const MemoizedOptionCard = memo(OptionCard, areEqual);

  return (
    <>
      <header className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#222222] mb-2">
            전월세 비교 계산기
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            여러 매물의 보증금·월세·관리비·이자 등을 입력해 월·총 비용을 한눈에 비교하세요.
          </p>
        </header>

        {/* 공통 입력 */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#222222]">
            공통 입력
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                보유현금 <span className="text-gray-700">(만원)</span>
              </label>
              <MoneyInputMan
                id="common-cashOnHand"
                value={common.cashOnHandStr}
                onChange={setCommonField("cashOnHandStr")}
              />
              {common.cashOnHandStr && toNum(common.cashOnHandStr) > 0 && (
                <div className="mt-1 text-xs text-[#007AFF]">
                  {formatKoreanCurrency(manToWon(toNum(common.cashOnHandStr)))}
                </div>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                대출 연이율(%)
              </label>
              <MoneyInputField
                id="common-annualRatePct"
                value={common.annualRatePctStr}
                onChange={setCommonField("annualRatePctStr")}
                allowDecimal={true}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* 고급 계산기 토글 */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={advanced.enabled}
                onChange={(e) =>
                  setAdvanced((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                고급 계산(계약기간·기회비용)
              </span>
            </label>

            {advanced.enabled && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    계약기간(년)
                  </label>
                  <MoneyInputField
                    id="advanced-termYears"
                    value={advanced.termYearsStr}
                    onChange={(s) => {
                      setAdvanced((prev) => ({ ...prev, termYearsStr: s }));
                    }}
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    기회비용 연수익률(%)
                  </label>
                  <DecimalInput
                    id="advanced-oppRatePct"
                    value={advanced.oppRatePctStr}
                    onChange={(s) => {
                      setAdvanced((prev) => ({ ...prev, oppRatePctStr: s }));
                    }}
                    placeholder="0.0"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    보증금으로 잠시 묶이는 돈에 적용할 예상 수익률이에요.
                    <br />
                    예를 들어 3%로 설정하면, 그 돈을 예금이나 투자에 넣었을 때 받을 수 있는 이자 수준을 비용 계산에 반영합니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            💡 입력값은 저장하지 않습니다.
          </p>
        </section>

        {/* 광고 슬롯 - 중간 (입력과 비교표 사이) */}
        <div id="ad-slot-mid" className="my-6">
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-8 text-center text-gray-400">
            <p className="text-sm">광고 영역 (중간)</p>
            <p className="mt-1 text-xs">320x100 또는 728x90</p>
          </div>
        </div>

        {/* 옵션 + 결과 (PNG/PDF 캡처 대상) */}
        <div ref={resultWrapRef}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#222222]">
              옵션 비교 ({opts.length}/5)
            </h2>
            {opts.length < 5 && (
              <button
                onClick={addOption}
                className="rounded-lg border border-[#007AFF] bg-white px-4 py-2 text-sm font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF] hover:text-white"
              >
                + 옵션 추가
              </button>
            )}
        </div>
          <section className="grid gap-5 grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(450px,1fr))]">
            {opts.map((o) => {
              const r = realtimeResults.get(o.id);
              
              return (
                <div key={o.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:min-w-[450px]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <input
                      className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 font-semibold text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                      value={o.title}
                      onChange={(e) => setOpt(o.id, { title: e.target.value })}
                      placeholder={`${o.id} 제목`}
                    />
                    {opts.length > 1 && (
                      <button
                        onClick={() => removeOption(o.id)}
                        className="flex-shrink-0 text-sm text-red-500 hover:text-red-700 transition-colors"
                        title="옵션 삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="mb-4 flex gap-3">
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        o.rentType === "JEONSE"
                          ? "bg-[#007AFF] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => setOpt(o.id, { rentType: "JEONSE" })}
                    >
                      전세
                    </button>
                    <button
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        o.rentType === "WOLSE"
                          ? "bg-[#007AFF] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                      onClick={() => setOpt(o.id, { rentType: "WOLSE" })}
                    >
                      월세
                    </button>
                  </div>

                  {/* 입력 필드: 2열 그리드 */}
                  <div className="space-y-3">
                    {/* 1. 보증금/월세 (2열) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-700">
                          보증금 <span className="text-gray-700">(만원)</span>
                        </div>
                        <MoneyInputMan
                          id={`${o.id}-deposit`}
                          value={o.depositStr}
                          onChange={setOptField(o.id, "depositStr")}
                        />
                        {o.depositStr && toNum(o.depositStr) > 0 && (
                          <div className="mt-1 text-xs text-[#007AFF]">
                            {formatKoreanCurrency(manToWon(toNum(o.depositStr)))}
                          </div>
                        )}
                      </div>
                      {o.rentType === "WOLSE" ? (
                        <div>
                          <div className="mb-1 text-sm font-medium text-gray-700">
                            월세 <span className="text-gray-700">(만원)</span>
                          </div>
                          <MoneyInputMan
                            id={`${o.id}-monthlyRent`}
                            value={o.monthlyRentStr ?? ""}
                            onChange={setOptField(o.id, "monthlyRentStr")}
                          />
                          {o.monthlyRentStr && toNum(o.monthlyRentStr) > 0 && (
                            <div className="mt-1 text-xs text-[#007AFF]">
                              {formatKoreanCurrency(manToWon(toNum(o.monthlyRentStr)))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <DisabledBox label="월세(만원)" />
                      )}
                    </div>

                    {/* 2. 대출원금(만원) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        대출원금 <span className="text-gray-700">(만원)</span>
                      </label>
                      <MoneyInputMan
                        id={`${o.id}-loanPrincipal`}
                        value={
                          o.loanAuto
                            ? String(
                                Math.max(
                                  toNum(o.depositStr) - toNum(common.cashOnHandStr),
                                  0
                                )
                              )
                            : o.loanPrincipalManualStr ?? ""
                        }
                        onChange={setOptField(o.id, "loanPrincipalManualStr")}
                        disabled={o.loanAuto}
                      />
                      {(o.loanAuto
                        ? toNum(o.depositStr) - toNum(common.cashOnHandStr) > 0
                        : o.loanPrincipalManualStr && toNum(o.loanPrincipalManualStr) > 0) && (
                        <div className="mt-1 text-xs text-[#007AFF]">
                          {formatKoreanCurrency(
                            manToWon(
                              o.loanAuto
                                ? Math.max(
                                    toNum(o.depositStr) - toNum(common.cashOnHandStr),
                                    0
                                  )
                                : toNum(o.loanPrincipalManualStr)
                            )
                          )}
                        </div>
                      )}
                      
                      {/* 자동 입력 체크박스 */}
                      <div className="mt-2 flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={o.loanAuto}
                          onChange={(e) =>
                            setOpt(o.id, { loanAuto: e.target.checked })
                          }
                          className="mt-1"
                        />
                        <span className="text-sm">
                          자동 입력
                          <p className="text-xs text-gray-500 leading-snug">
                            보유 현금이 부족한 경우, 부족한 금액만큼을 대출로 계산합니다.
                            <br />
                            기본 계산식은 <b>보증금 − 보유현금</b> 입니다.
                          </p>
                        </span>
                      </div>
                    </div>

                    {/* 4. 관리비, 주차비 (2열) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-700">
                          관리비 <span className="text-gray-700">(원)</span>
                        </div>
                        <MoneyInputField
                          id={`${o.id}-mgmtFee`}
                          value={o.mgmtFeeStr}
                          onChange={setOptField(o.id, "mgmtFeeStr")}
                        />
                        {o.mgmtFeeStr && toNum(o.mgmtFeeStr) >= 10000 && (
                          <div className="mt-1 text-xs text-[#007AFF]">
                            {formatKoreanCurrency(toNum(o.mgmtFeeStr))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="mb-1 text-sm font-medium text-gray-700">
                          주차비 <span className="text-gray-700">(원)</span>
                        </div>
                        <MoneyInputField
                          id={`${o.id}-parkingFee`}
                          value={o.parkingFeeStr}
                          onChange={setOptField(o.id, "parkingFeeStr")}
                        />
                        {o.parkingFeeStr && toNum(o.parkingFeeStr) >= 10000 && (
                          <div className="mt-1 text-xs text-[#007AFF]">
                            {formatKoreanCurrency(toNum(o.parkingFeeStr))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. 교통비 (전체 너비) */}
                    <div>
                      <div className="mb-1 text-sm font-medium text-gray-700">
                        교통비 <span className="text-gray-700">(원)</span>
                      </div>
                      <MoneyInputField
                        id={`${o.id}-transportMonthly`}
                        value={o.transportMonthlyStr}
                        onChange={setOptField(o.id, "transportMonthlyStr")}
                      />
                      {o.transportMonthlyStr && toNum(o.transportMonthlyStr) >= 10000 && (
                        <div className="mt-1 text-xs text-[#007AFF]">
                          {formatKoreanCurrency(toNum(o.transportMonthlyStr))}
                        </div>
                      )}
                    </div>
                  </div>

    </div>
              );
            })}
          </section>

          {/* 비교하기 버튼 (옵션 아래, 비교표 위) */}
          <div className="mt-6 mb-6 flex justify-center">
            <button
              onClick={handleCompare}
              className="rounded-lg bg-[#007AFF] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#0051D5] shadow-lg"
            >
              {dirty ? "다시 비교하기" : "비교하기"}
            </button>
          </div>

          {/* 하단 비교표 (스냅샷 기반) */}
          {snapshot && (
            <div id="compare-table">
              <CompareTable
                opts={snapshot.options}
                results={snapshot.results}
                adv={snapshot.advanced}
              />
            </div>
          )}

          {/* 피드백 박스 (상시 노출, 비교표 아래) */}
          <section className="mt-10 border-t border-gray-200 pt-6">
            <FeedbackBox source="rent" />
          </section>
        </div>

        {/* 광고 오버레이 */}
        {showAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 text-center">
              <div className="mb-6">
                <div className="text-6xl font-bold text-[#007AFF] mb-4">
                  {adCountdown}
                </div>
                <p className="text-xl text-gray-700 mb-4">
                  광고를 시청하고 있습니다...
                </p>
              </div>
              <div className="bg-gray-100 rounded-lg p-8 mb-6 min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300">
                <div>
                  <p className="text-lg font-semibold text-gray-600 mb-2">
                    광고 영역
                  </p>
                  <p className="text-sm text-gray-500">
                    728x90 또는 320x100 크기의 광고가 여기에 표시됩니다
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {adCountdown}초 후 비교 결과를 확인할 수 있습니다
              </p>
            </div>
          </div>
        )}


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
