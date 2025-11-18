export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-zinc-800">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-6 text-sm text-zinc-500">Last updated: 2025-01-10</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Overview</h2>
      <p className="mb-4">
        worklesslab builds simple web tools for creators. We respect your privacy and
        collect as little data as possible to operate and improve our sites.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
      <ul className="list-disc ml-5 space-y-2 mb-4">
        <li>
          <strong>Usage & analytics data:</strong> anonymous metrics such as page
          views, device type, approximate location, and performance.
        </li>
        <li>
          <strong>Advertising cookies (Google AdSense):</strong> Google and its
          partners may use cookies to serve and measure personalized or
          non-personalized ads.
        </li>
        <li>
          <strong>Tool inputs:</strong> Unless explicitly stated, inputs provided
          to our calculators or generators are processed in your browser and are
          not stored on our servers.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Information</h2>
      <ul className="list-disc ml-5 space-y-2 mb-4">
        <li>To operate, secure, and improve our sites and tools.</li>
        <li>To display advertising and measure its effectiveness.</li>
        <li>To respond to user inquiries and support requests.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Ads & Cookies</h2>
      <p className="mb-4">
        We use Google AdSense. Google may use cookies and similar technologies to
        show ads based on your visits to this and other websites. You can manage
        ad settings and learn more at Google's Ads Settings and policies pages.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Data Retention</h2>
      <p className="mb-4">
        We retain only the minimal information required for the purposes above
        and for the time necessary to provide our services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Your Choices</h2>
      <ul className="list-disc ml-5 space-y-2 mb-4">
        <li>Use browser controls to block or delete cookies.</li>
        <li>Opt out of personalized ads via your Google Ads Settings.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
      <p>
        If you have questions about this policy, contact us at{" "}
        <a className="underline text-blue-600" href="mailto:yoyo.in.moomoo@gmail.com">
          yoyo.in.moomoo@gmail.com
        </a>.
      </p>
    </main>
  );
}

