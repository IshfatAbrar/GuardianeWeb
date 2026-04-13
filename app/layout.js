import { Epilogue } from "next/font/google";
import "./globals.css";
import { RevealObserver } from "../components/reveal-observer";
import { SiteHeader } from "../components/site-header";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title:
    "AI-Guardian Center — Protecting Children's Digital Safety & Mental Wellbeing",
  description:
    "The AI-Guardian Center is an innovation and research hub advancing ethical AI solutions for child digital safety, adolescent emotional wellbeing, and family support. Home of Guardiané.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={epilogue.variable}
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
        className={`${epilogue.className} antialiased`}
        suppressHydrationWarning
      >
        <RevealObserver />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
