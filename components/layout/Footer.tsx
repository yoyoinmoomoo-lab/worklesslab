import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-base border-t border-border mt-8">
      <div className="max-w-4xl mx-auto px-4 py-4 text-xs flex justify-between">
        <span className="text-muted">© {new Date().getFullYear()} worklesslab</span>
        <div className="flex gap-3">
          <Link 
            href="/docs/privacy" 
            className="text-text-sub hover:text-[#007AFF] transition-colors"
          >
            Privacy
          </Link>
          <Link 
            href="/docs/terms" 
            className="text-text-sub hover:text-[#007AFF] transition-colors"
          >
            Terms
          </Link>
          <Link 
            href="/docs/disclaimer" 
            className="text-text-sub hover:text-[#007AFF] transition-colors"
          >
            Disclaimer
          </Link>
        </div>
      </div>
    </footer>
  );
}

