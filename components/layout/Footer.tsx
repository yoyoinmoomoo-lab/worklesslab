import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t mt-8">
      <div className="max-w-4xl mx-auto px-4 py-4 text-xs flex justify-between">
        <span>© {new Date().getFullYear()} worklesslab</span>
        <div className="flex gap-3">
          <Link href="/docs/privacy">Privacy</Link>
          <Link href="/docs/terms">Terms</Link>
          <Link href="/docs/disclaimer">Disclaimer</Link>
        </div>
      </div>
    </footer>
  );
}

