export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">About</h1>
      
      <div className="space-y-4 text-gray-700">
        <p>
          worklesslab는 "덜 일하고 더 잘 살기 위한 작은 웹 도구들을 만드는 실험실"입니다.
        </p>
        <p>
          생활비 계산, 구독료 정리처럼 반복되거나 번거로운 작업을
          간단한 웹 도구로 더 빠르고 쉽게 해결할 수 있도록 만들고 있습니다.
        </p>
        <p>
          모든 도구는 무료로 사용할 수 있으며,
          로그인이나 개인정보 입력 없이 바로 이용할 수 있습니다.
        </p>
        <p>
          앞으로도 최소한의 노력으로 최대한의 효율을 만드는
          작고 실용적인 유틸리티들을 계속 실험해 나가겠습니다.
        </p>
      </div>
    </div>
  );
}

