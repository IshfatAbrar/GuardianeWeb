import { JojoAuthProvider } from "./lib/jojoAuth";

export const metadata = {
  title: "JoJo — Free parenting chat assistant | Guardiané",
  description:
    "Chat with JoJo, Guardiané's AI parenting assistant. Ask about your teen's digital safety and emotional wellbeing — no account required.",
};

export default function ChatbotLayout({ children }) {
  // Shares the lightweight JoJo identity across /chatbot, /chatbot/login and
  // /chatbot/signup.
  return <JojoAuthProvider>{children}</JojoAuthProvider>;
}
