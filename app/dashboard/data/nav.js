export const sideNavItems = [
  {
    id: "overview",
    label: "Home",
    icon: (
      <svg
        width="22"
        height="22"
        fill="currentColor"
        fillRule="evenodd"
        viewBox="0 0 24 24"
      >
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    id: "messaging",
    label: "Messages",
    icon: (
      <svg
        width="22"
        height="22"
        fill="currentColor"
        fillRule="evenodd"
        viewBox="0 0 24 24"
      >
        <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
      </svg>
    ),
  },
  {
    id: "learning",
    label: "Learning Hub",
    icon: (
      <svg
        width="22"
        height="22"
        fill="currentColor"
        fillRule="evenodd"
        viewBox="0 0 24 24"
      >
        <path d="M11.3 6.4C9.9 5.4 8.2 5 6.5 5 5 5 3.5 5.3 2 6v13.5c1.5-.7 3-1 4.5-1 1.7 0 3.4.4 4.8 1.3V6.4zM12.7 6.4c1.4-1 3.1-1.4 4.8-1.4 1.5 0 3 .3 4.5 1v13.5c-1.5-.7-3-1-4.5-1-1.7 0-3.4.4-4.8 1.3V6.4z" />
      </svg>
    ),
  },
  {
    id: "modules",
    label: "Module Assignments",
    icon: (
      <svg
        width="22"
        height="22"
        fill="currentColor"
        fillRule="evenodd"
        viewBox="0 0 24 24"
      >
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  // Access Requests is hidden: neither Android app has any access-request flow.
  // The child device never asks for permission and never reads a response, so
  // the tab could only ever show an empty list. Restore it here once
  // Guardiane_Android can actually raise a request.
  {
    id: "emergency",
    label: "Emergency",
    icon: (
      <svg
        width="22"
        height="22"
        fill="currentColor"
        fillRule="evenodd"
        viewBox="0 0 24 24"
      >
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg
        width="22"
        height="22"
        fill="currentColor"
        fillRule="evenodd"
        viewBox="0 0 24 24"
      >
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  },
];

export const quickActions = [
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg
        width="26"
        height="26"
        fill="none"
        style={{ stroke: "var(--accent)" }}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: "messages",
    label: "Messages",
    icon: (
      <svg
        width="26"
        height="26"
        fill="none"
        style={{ stroke: "var(--accent)" }}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "emergency",
    label: "Emergency",
    icon: (
      <svg
        width="26"
        height="26"
        fill="none"
        style={{ stroke: "var(--accent)" }}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: "appLimits",
    label: "App Limits",
    icon: (
      <svg
        width="26"
        height="26"
        fill="none"
        style={{ stroke: "var(--accent)" }}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    id: "screenTimeLimit",
    label: "Screen Time Limit",
    icon: (
      <svg
        width="26"
        height="26"
        fill="none"
        style={{ stroke: "var(--accent)" }}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    id: "assignModule",
    label: "Assign Module",
    icon: (
      <svg
        width="26"
        height="26"
        fill="none"
        style={{ stroke: "var(--accent)" }}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
      </svg>
    ),
  },
];

// Static labels used by PlaceholderTab when a non-overview sidebar item is active
export const placeholderTabLabels = {
  messaging: ["Messages", "Chat with your children"],
  learning: ["Learning Hub", "Browse educational modules"],
  modules: ["Module Assignments", "Track your children's progress"],
  chatbot: ["Jojo Chatbot", "AI-powered support for your family"],
  emergency: ["Emergency", "Quick access to emergency contacts"],
  settings: ["Settings", "Manage your account and preferences"],
};

export const sideHighlightItems = [
  {
    id: "chatbot",
    label: "Jojo Chatbot",
    icon: (
      <svg
        width="22"
        height="22"
        fill="currentColor"
        fillRule="evenodd"
        viewBox="0 0 24 24"
      >
        <path d="M5 2h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8l-4.3 3.6A.6.6 0 0 1 2.7 21V5a3 3 0 0 1 2.3-3zM8 9a1.3 1.3 0 1 0 0 2.6A1.3 1.3 0 0 0 8 9zm4 0a1.3 1.3 0 1 0 0 2.6A1.3 1.3 0 0 0 12 9zm4 0a1.3 1.3 0 1 0 0 2.6A1.3 1.3 0 0 0 16 9z" />
      </svg>
    ),
  },
];
