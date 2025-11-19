import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-base-light border-b border-border">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image 
            src="/favicon-128x128.png" 
            alt="worklesslab" 
            width={24} 
            height={24}
            className="w-6 h-6"
          />
          <span className="text-text-main">worklesslab</span>
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link 
            href="/about" 
            className="text-text-sub hover:text-[#007AFF] transition-colors"
          >
            About
          </Link>
          <Link 
            href="/tools" 
            className="text-text-sub hover:text-[#007AFF] transition-colors"
          >
            Tools
          </Link>
          <Link 
            href="/blog" 
            className="text-text-sub hover:text-[#007AFF] transition-colors"
          >
            Blog
          </Link>
        </nav>
      </div>
    </header>
  );
}

