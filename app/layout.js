import { Epilogue } from "next/font/google";
import "./globals.css";
import { RevealObserver } from "../components/reveal-observer";
import { SiteHeader } from "../components/site-header";
import { AuthProvider } from "./context/AuthContext";
import { NotificationsProvider } from "./lib/useNotifications";
import { ToastProvider } from "./lib/useToast";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title:
    "Guardiané",
  description:
    "The AI-Guardian Center is an innovation and research hub advancing ethical AI solutions for child digital safety, adolescent emotional wellbeing, and family support. Home of Guardiané.",
  icons: {
    icon: "/guardian-icon.png",
    apple: "/guardian-icon.png",
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
        <AuthProvider>
          <NotificationsProvider>
            <ToastProvider>
              <RevealObserver />
              <SiteHeader />
              {children}
            </ToastProvider>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
