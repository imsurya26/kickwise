import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "KICKWISE — Bundesliga Match Intelligence & Tactical Simulator",
  description:
    "Read the game before it happens. Machine Learning-powered Bundesliga match prediction and tactical What-If simulator using XGBoost, Poisson regression, and SHAP explainability.",
  keywords: ["Bundesliga", "football prediction", "match analytics", "tactical simulator", "xG model", "machine learning"],
  openGraph: {
    title: "KICKWISE — Bundesliga Match Intelligence",
    description: "Machine Learning Bundesliga Tactical Match Simulator & Forecast.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Faculty+Glyphic&family=Press+Start+2P&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[--kw-bg] text-[--kw-text] antialiased transition-colors duration-200 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
