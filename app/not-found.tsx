import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold mb-4 text-text-main">404</h1>
      <h2 className="text-xl font-semibold mb-4 text-text-sub">
        This page could not be found.
      </h2>
      <p className="text-muted mb-8">
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[#007AFF] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#0051D5]"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

