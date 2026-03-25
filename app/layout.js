import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "../components/theme-toggle";
import { RevealObserver } from "../components/reveal-observer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Guardiané — Clarity for parents. Calm for families.",
  description:
    "Mood boards, screen-time intelligence, learning progress, family messaging, and smart alerts—including threat-aware signals on texts. The parent dashboard that turns signals into action.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);})();",
          }}
        />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <RevealObserver />
        {children}
      </body>
    </html>
  );
}
