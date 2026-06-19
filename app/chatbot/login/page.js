"use client";

import { ChatbotAuthShell } from "../components/ChatbotAuthShell";
import { ChatbotAuthForm } from "../components/ChatbotAuthForm";

export default function ChatbotLoginPage() {
  return (
    <ChatbotAuthShell
      heading="Sign In"
      panelTitle="Hello Friend!"
      panelText="New to JoJo? Sign up with just your email or phone to keep chatting."
      panelCtaLabel="Sign Up"
      panelCtaHref="/chatbot/signup"
      switchPrompt="New to JoJo?"
    >
      <ChatbotAuthForm mode="login" />
    </ChatbotAuthShell>
  );
}
