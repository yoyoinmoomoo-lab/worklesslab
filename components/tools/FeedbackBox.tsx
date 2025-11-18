"use client";

import { useState } from "react";

type FeedbackSource = "rent" | "subscription" | "other";

interface FeedbackBoxProps {
  source: FeedbackSource;
}

export function FeedbackBox({ source }: FeedbackBoxProps) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (msg.trim().length < 3) return;
    
    setLoading(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, source }),
      });
      
      if (r.ok) {
        setDone(true);
        setMsg("");
        setTimeout(() => {
          setDone(false);
          setOpen(false);
        }, 2000);
      } else {
        alert("전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch (err) {
      alert("전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="text-sm text-gray-600 hover:text-[#007AFF] transition-colors"
        onClick={() => setOpen(!open)}
      >
        💬 피드백 남기기
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <textarea
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
            rows={4}
            placeholder="불편한 점이나 개선 아이디어를 적어주세요."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <div className="space-y-1">
            <p className="text-xs text-gray-500">
              * 입력 내용은 제작자에게 익명으로 전달됩니다.
            </p>
            <p className="text-xs text-gray-500">
              * 최소 3자 이상 입력해주세요.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg bg-[#007AFF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0051D5] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={submit}
              disabled={loading || msg.trim().length < 3}
            >
              {loading ? "전송 중…" : "피드백 보내기"}
            </button>
            {done && (
              <span className="text-sm text-green-600">
                감사합니다! 잘 받았어요 🙏
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

