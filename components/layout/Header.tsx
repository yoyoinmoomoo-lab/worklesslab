"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          worklesslab
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/about">소개</Link>
          <Link href="/tools">도구</Link>
        </nav>
      </div>
    </header>
  );
}

