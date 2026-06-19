"use client";

import { ChatbotAuthShell } from "../components/ChatbotAuthShell";
import { ChatbotAuthForm } from "../components/ChatbotAuthForm";

export default function ChatbotSignupPage() {
  return (
    <ChatbotAuthShell
      heading="Sign Up"
      panelTitle="Welcome Back!"
      panelText="Already chatting with JoJo? Sign in with your email or phone."
      panelCtaLabel="Sign In"
      panelCtaHref="/chatbot/login"
      switchPrompt="Already have an account?"
    >
      <ChatbotAuthForm mode="signup" />
    </ChatbotAuthShell>
  );
}
