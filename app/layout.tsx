import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "worklesslab — 일 적게, 더 잘 살기",
  description: "비개발자의 자동화 실험, 블로그, 도구, 삶의 시스템 빌드.",
  icons: { icon: "/icon.png" },
  metadataBase: new URL("https://worklesslab.io/"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-base">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

