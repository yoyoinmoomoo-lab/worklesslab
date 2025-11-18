import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Work less, build smart tools.
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          worklesslab는 덜 일하고 더 잘 살기 위한 도구 실험실입니다.
          <br />
          일상에서 유용한 계산기와 도구들을 제공합니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/tools/rent"
          className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">전월세 계산기</h2>
          <p className="text-sm text-gray-600">
            보증금·월세·관리비·이자 등을 입력해 여러 매물의 월·총 비용을 비교하세요.
          </p>
        </Link>

        <Link
          href="/tools/subscription"
          className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">월 구독료 계산기</h2>
          <p className="text-sm text-gray-600">
            여러 구독 서비스의 월/연 총액을 한눈에 계산하세요.
          </p>
        </Link>

        <Link
          href="/tools/covermaker"
          className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow opacity-60"
        >
          <h2 className="text-xl font-semibold mb-2">노션 커버 메이커</h2>
          <p className="text-sm text-gray-600">
            Coming soon...
          </p>
        </Link>
      </div>
    </div>
  );
}

