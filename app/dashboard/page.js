'use client'

import { useState } from 'react'

// ── Data ──────────────────────────────────────────────────────────────────────

const children = [
  {
    id: 'emma',
    initials: 'EJ',
    name: 'Emma Johnson',
    age: 14,
    mood: 'Positive',
    riskScore: 2,
    riskMax: 5,
    screenTime: '2h 15m',
    topApp: 'YouTube',
    lastActive: '2 min ago',
    modulesDone: 3,
    modulesTotal: 4,
    wellbeing: 82,
    borderAlert: false,
  },
  {
    id: 'liam',
    initials: 'LJ',
    name: 'Liam Johnson',
    age: 11,
    mood: 'Neutral',
    riskScore: 1,
    riskMax: 5,
    screenTime: '1h 45m',
    topApp: 'Minecraft',
    lastActive: '45 min ago',
    modulesDone: 1,
    modulesTotal: 2,
    wellbeing: 74,
    borderAlert: false,
  },
  {
    id: 'sophia',
    initials: 'SJ',
    name: 'Sophia Johnson',
    age: 16,
    mood: 'Alert',
    riskScore: 3,
    riskMax: 5,
    screenTime: '3h 20m',
    topApp: 'Instagram',
    lastActive: 'Just now',
    modulesDone: 2,
    modulesTotal: 3,
    wellbeing: 61,
    borderAlert: true,
  },
]

const weeklyScreenTime = [
  { day: 'Mon', emma: 1.5, liam: 1.2, sophia: 2.8 },
  { day: 'Tue', emma: 2.0, liam: 1.8, sophia: 3.1 },
  { day: 'Wed', emma: 1.8, liam: 1.0, sophia: 2.5 },
  { day: 'Thu', emma: 2.5, liam: 2.2, sophia: 3.8 },
  { day: 'Fri', emma: 2.25, liam: 1.75, sophia: 3.33 },
  { day: 'Sat', emma: 3.0, liam: 2.5, sophia: 4.0 },
  { day: 'Sun', emma: 1.5, liam: 1.0, sophia: 2.0 },
]

const alerts = [
  { id: 1, type: 'Unusual activity detected', child: 'Sophia Johnson', time: '2 hours ago', severity: 'medium' },
  { id: 2, type: 'Extended screen time', child: 'Liam Johnson', time: '5 hours ago', severity: 'low' },
  { id: 3, type: 'New message received', child: 'Emma Johnson', time: 'Yesterday', severity: 'low' },
]

const messages = {
  sophia: [
    { id: 1, from: 'child', text: 'hey mom can I stay out until 10?', time: '3:42 PM' },
    { id: 2, from: 'parent', text: 'Home by 9:30, ok?', time: '3:45 PM' },
    { id: 3, from: 'child', text: 'fine 😒 can you pick me up?', time: '3:46 PM' },
  ],
  emma: [
    { id: 1, from: 'child', text: 'Mom I finished my homework!', time: '2:10 PM' },
    { id: 2, from: 'parent', text: 'Great job Emma! 🎉', time: '2:15 PM' },
  ],
  liam: [
    { id: 1, from: 'child', text: 'Can I play Minecraft after dinner?', time: '5:00 PM' },
    { id: 2, from: 'parent', text: 'Yes, 1 hour max 🕐', time: '5:03 PM' },
  ],
}

const modules = [
  { id: 1, name: 'Digital Safety', child: 'Emma', lessons: 4, status: 'done' },
  { id: 2, name: 'Emotional Resilience', child: 'Sophia', lessons: 5, status: 'progress', pct: 50 },
  { id: 3, name: 'Screen Time Balance', child: 'Liam', lessons: 3, status: 'progress', pct: 33 },
  { id: 4, name: 'Online Friendships', child: 'All', lessons: 6, status: 'new' },
]

const emergencyContacts = [
  { initials: 'RK', name: 'Dr. Rachel Kim', role: 'School Counselor', danger: false },
  { initials: 'PD', name: 'Police Dept.', role: 'Emergency Services', danger: false },
  { initials: 'GJ', name: 'Grandma June', role: 'Family', danger: false },
  { initials: 'CR', name: 'Crisis Line · 988', role: 'Mental Health Support', danger: true },
]

const topApps = [
  { name: 'Instagram', pct: 72, hours: '2.1h' },
  { name: 'YouTube', pct: 55, hours: '1.6h' },
  { name: 'Minecraft', pct: 38, hours: '1.1h' },
  { name: 'TikTok', pct: 28, hours: '0.8h' },
]

// Module card gradient palette — one entry per module card, cycled by index
const moduleColors = [
  { bg: 'linear-gradient(135deg, hsl(214,80%,58%), hsl(214,80%,42%))', badge: 'rgba(0,0,0,0.18)' },
  { bg: 'linear-gradient(135deg, hsl(280,60%,62%), hsl(280,60%,46%))', badge: 'rgba(0,0,0,0.18)' },
  { bg: 'linear-gradient(135deg, hsl(160,55%,48%), hsl(160,55%,34%))', badge: 'rgba(0,0,0,0.18)' },
  { bg: 'linear-gradient(135deg, hsl(20,85%,60%), hsl(20,85%,46%))',   badge: 'rgba(0,0,0,0.18)' },
]

const quickActions = [
  {
    label: 'Add Child',
    icon: (
      <svg width="26" height="26" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
      </svg>
    ),
  },
  {
    label: 'Reports',
    icon: (
      <svg width="26" height="26" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    label: 'Messages',
    icon: (
      <svg width="26" height="26" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Emergency',
    icon: (
      <svg width="26" height="26" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
]

// ── Nav items ─────────────────────────────────────────────────────────────────

const sideNavItems = [
  {
    id: 'overview',
    label: 'Home',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    id: 'learning',
    label: 'Learning Hub',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    id: 'modules',
    label: 'Module Assignments',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>
      </svg>
    ),
  },
  {
    id: 'access',
    label: 'Access Requests',
    badge: 1,
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
        <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
      </svg>
    ),
  },
  {
    id: 'chatbot',
    label: 'Jojo Chatbot',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <path d="M8 10h.01M12 10h.01M16 10h.01"/>
      </svg>
    ),
  },
  {
    id: 'emergency',
    label: 'Emergency',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

// ── iOS-style Sidebar ─────────────────────────────────────────────────────────

function Sidebar({ activeNav, setActiveNav, selectedChild, setSelectedChild }) {
  return (
    <aside className="flex flex-col w-[280px] flex-shrink-0 bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden">

      {/* My Children */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--muted)] mb-2.5 px-1">My Children</p>
        <div className="flex flex-col gap-1.5">
          {children.map((child) => {
            const isSelected = selectedChild === child.id
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-[var(--accent-bg)] border border-[var(--accent-border)]'
                    : 'bg-transparent border border-transparent hover:bg-[var(--surface-muted)]'
                }`}
              >
                {/* Avatar circle */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0 border-2 ${
                  isSelected
                    ? 'bg-[var(--surface)] border-[var(--accent-border)] text-[var(--accent)]'
                    : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--muted)]'
                }`}>
                  {child.initials}
                </div>
                <span className={`flex-1 text-[14px] font-medium leading-tight ${
                  isSelected ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'
                }`}>
                  {child.name.split(' ')[0]}
                </span>
                {isSelected && (
                  <>
                    {/* Check circle */}
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    {/* QR icon */}
                    <svg width="16" height="16" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="flex-shrink-0">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                      <path d="M14 14h3v3M17 20h3M20 17v3"/>
                    </svg>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mx-4 my-3 h-px bg-[var(--border)]" />

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {sideNavItems.map((item) => {
          const isActive = activeNav === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`relative flex items-center gap-3.5 w-full px-3 py-3 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-[var(--accent-bg)]'
                  : 'hover:bg-[var(--surface-muted)]'
              }`}
            >
              {/* Active bar on right */}
              {isActive && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-[var(--accent)]" />
              )}

              <span className={`flex-shrink-0 transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'
              }`}>
                {item.icon}
              </span>

              <span className={`flex-1 text-[14px] font-medium leading-tight ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'
              }`}>
                {item.label}
              </span>

              {item.badge && (
                <span className="flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[8px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ selectedChild }) {
  const child = children.find(c => c.id === selectedChild) || children[0]
  const [msgChild, setMsgChild] = useState('sophia')
  const thread = messages[msgChild] || []

  const stats = [
    { label: 'Children monitored', value: '3',   sub: 'All active today',  danger: false },
    { label: 'Active alerts',      value: '1',   sub: 'Needs review',      danger: true  },
    { label: 'Avg wellbeing',      value: '72%', sub: '↑ 4% this week',    danger: false },
    { label: 'Modules done',       value: '7',   sub: '2 in progress',     danger: false },
  ]
 
  return (
    <div className="space-y-7">
 
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Hello Sarah,</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">Your family's digital wellbeing recap</p>
        </div>
      </div>

       {/* Jojo chatbot banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--accent-bg)] px-4 py-3.5">
        {/* BLUE: Jojo avatar circle — solid blue var(--accent) to match dashboard palette */}
        <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[var(--foreground)]">Hello, I'm Jojo your AI assistant.</p>
          <p className="text-[12px] text-[var(--muted)]">Come talk to me!</p>
        </div>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{s.label}</p>
            {/* BLUE: stat card value (non-danger) — text var(--accent) */}
            <p className={`mt-2 text-3xl font-semibold leading-none tracking-tight ${s.danger ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>{s.value}</p>
            <p className="mt-1.5 text-[10px] text-[var(--muted)]">{s.sub}</p>
          </div>
        ))}
      </div>
 
      {/* Jojo + Today's Mood */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        
        {/* Today's Mood */}
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
            <svg width="18" height="18" style={{ fill: 'var(--accent)' }} viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[var(--foreground)]">Today's Mood</h2>
        </div>
          <div className="flex-1 rounded-2xl bg-[var(--surface-muted)] flex flex-col items-center justify-center py-6 gap-2">
            <svg width="32" height="32" fill="none" style={{ stroke: 'var(--muted)' }} strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round"/>
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round"/>
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-[13px] text-[var(--muted)] font-medium">No Data</span>
          </div>
          <button className="w-full rounded-xl bg-[var(--accent-bg)] py-2.5 text-[13px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-bg-hover)] transition-colors">
            Full Report
          </button>
        </div>
        {/* Quick Actions */}
      <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5'>
        <div className="flex items-center gap-3 mb-4 ">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
            <svg width="18" height="18" style={{ fill: 'var(--accent)' }} viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[var(--foreground)]">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickActions.map((qa) => (
            <button key={qa.label} className="flex flex-col items-center gap-2.5 group">
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent-bg)] flex items-center justify-center group-hover:bg-[var(--accent-bg-hover)] transition-colors">
                {qa.icon}
              </div>
              <span className="text-[12px] font-medium text-[var(--foreground)] text-center leading-tight">{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Learning Modules */}
      <div>
        <div className="flex items-center gap-3 mb-4 ">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
            <svg width="18" height="18" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[var(--foreground)]">Learning Modules</h2>
          <button className="ml-auto text-[13px] font-semibold text-[var(--accent)] bg-[var(--accent-bg)] px-3 py-1 rounded-lg hover:bg-[var(--accent-bg-hover)] transition-colors">
            View All
          </button>
        </div>
 
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {modules.map((mod, i) => {
            const color = moduleColors[i % moduleColors.length]
            return (
              <div
                key={mod.id}
                className="flex-shrink-0 w-[200px] rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: color.bg }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full" style={{ background: color.badge }}>Custom</span>
                    <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full" style={{ background: color.badge }}>Parent</span>
                  </div>
                </div>
 
                {/* Title */}
                <div>
                  <p className="text-[17px] font-bold text-white leading-tight">{mod.name}</p>
                  <p className="text-[12px] text-white opacity-80 mt-0.5">{mod.child}</p>
                </div>
 
                {/* Bottom row */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map(d => (
                      <div key={d} className="w-1.5 h-1.5 rounded-full" style={{ background: d === 0 ? 'white' : 'rgba(255,255,255,0.35)' }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg width="13" height="13" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    </svg>
                    <span className="text-[12px] font-semibold text-white">{mod.lessons}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
            <svg width="18" height="18" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[var(--foreground)]">Recent Activity</h2>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--border)] flex items-center justify-center">
            <svg width="20" height="20" fill="none" style={{ stroke: 'var(--muted)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-[14px] text-[var(--muted)]">No recent alerts</p>
        </div>
      </div>
    </div>
  )
}
 

// ── Placeholder tabs ──────────────────────────────────────────────────────────

function PlaceholderTab({ title, subtitle, icon }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
      <div className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-[var(--surface-muted)]">
          {icon}
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">{title} coming soon</p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">This section is under development.</p>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState('overview')
  const [selectedChild, setSelectedChild] = useState('sophia')

  const renderContent = () => {
    if (activeNav === 'overview') return <OverviewTab selectedChild={selectedChild} />
    const labels = {
      learning: ['Learning Hub', 'Browse educational modules'],
      modules: ['Module Assignments', 'Track your children\'s progress'],
      access: ['Access Requests', 'Review pending requests'],
      chatbot: ['Jojo Chatbot', 'AI-powered support for your family'],
      emergency: ['Emergency', 'Quick access to emergency contacts'],
      settings: ['Settings', 'Manage your account and preferences'],
    }
    const [title, subtitle] = labels[activeNav] || ['Page', '']
    return (
      <PlaceholderTab
        title={title}
        subtitle={subtitle}
        icon={
          <svg width="20" height="20" fill="none" style={{ stroke: 'var(--muted)' }} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        }
      />
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)]">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          selectedChild={selectedChild}
          setSelectedChild={setSelectedChild}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}