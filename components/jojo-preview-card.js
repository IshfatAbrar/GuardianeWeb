"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Bell,
  BookOpen,
  Brain,
  GraduationCap,
  HeartHandshake,
  Home as HomeIcon,
  Lock,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const tiles = [
  {
    title: "Intelligent Monitoring",
    desc: "Real-time detection of digital safety and emotional risk signals",
    icon: Brain,
  },
  {
    title: "Dynamic Education",
    desc: "Developmentally appropriate content for children and teens",
    icon: BookOpen,
  },
  {
    title: "Parental Guidance",
    desc: "Personalized, practical tools tailored to every family",
    icon: Users,
  },
  {
    title: "Counselor Networks",
    desc: "Seamless access to vetted mental health professionals",
    icon: HeartHandshake,
  },
];

/**
 * Detail cards surfaced as notifications on hover — same facts as the "Why
 * Our Work Matters" section. Each one has a fixed spot around the card so a
 * given feature always pops up in the same place; which ones fire (and when)
 * is randomized.
 */
const notifyFeatures = [
  {
    title: "Real-time support",
    desc: "Early awareness of potential digital safety and emotional risks",
    icon: ShieldCheck,
    slot: "-top-6 left-6 sm:left-10",
  },
  {
    title: "Parent-centered guidance",
    desc: "Practical tools tailored to individual family needs",
    icon: Users,
    slot: "top-1/4 -left-8 sm:-left-14",
  },
  {
    title: "Educational empowerment",
    desc: "Digital safety, resilience, and life-skills learning resources",
    icon: GraduationCap,
    slot: "bottom-1/4 -left-8 sm:-left-14",
  },
  {
    title: "Mental wellness support",
    desc: "Seamless pathways to trusted counselor networks",
    icon: HeartHandshake,
    slot: "top-1/4 -right-8 sm:-right-14",
  },
  {
    title: "Privacy-conscious design",
    desc: "Responsible AI development built on family trust",
    icon: Lock,
    slot: "bottom-1/4 -right-8 sm:-right-14",
  },
  {
    title: "Integrated ecosystem",
    desc: "Technology, education, and care unified in one platform",
    icon: Sparkles,
    slot: "-bottom-6 right-6 sm:right-10",
  },
];

const MAX_VISIBLE = 3;
const SPAWN_INTERVAL_MS = 900;
const SPAWN_CHANCE = 0.6;
const LIFETIME_MS = 4200;
const EXIT_MS = 300;

export function JojoPreviewCard() {
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef([]);
  const idRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leaving: true } : n)),
    );
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, EXIT_MS);
  };

  const spawn = () => {
    if (Math.random() > SPAWN_CHANCE) return;

    const active = notificationsRef.current.filter((n) => !n.leaving);
    if (active.length >= MAX_VISIBLE) return;

    const activeTitles = new Set(active.map((n) => n.feature.title));
    const candidates = notifyFeatures.filter((f) => !activeTitles.has(f.title));
    if (candidates.length === 0) return;

    const feature = candidates[Math.floor(Math.random() * candidates.length)];
    const id = ++idRef.current;

    setNotifications((prev) => [...prev, { id, feature, leaving: false }]);
    setTimeout(() => removeNotification(id), LIFETIME_MS);
  };

  const handleMouseEnter = () => {
    spawn();
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(spawn, SPAWN_INTERVAL_MS);
  };

  const handleMouseLeave = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="relative mx-auto max-w-8xl">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]"
      >
        <div className="flex">
          {/* icon rail */}
          <div className="hidden w-16 flex-shrink-0 flex-col items-center gap-5 border-r border-[var(--border)] bg-[var(--surface-muted)] py-8 sm:flex">
            {[HomeIcon, MessageCircle, Bell, ShieldCheck, Settings].map(
              (Icon, i) => (
                <span
                  key={i}
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-lg " +
                    (i === 0
                      ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                      : "text-[var(--muted)]")
                  }
                >
                  <Icon size={17} strokeWidth={2} />
                </span>
              ),
            )}
          </div>

          {/* main panel */}
          <div className="min-w-0 flex-1 p-8 sm:p-10">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-[var(--border)]">
                <Image src="/jojo.png" alt="JoJo" fill className="object-cover" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-[var(--foreground)]">
                  Hi, I&apos;m JoJo
                </p>
                <p className="truncate text-sm text-[var(--muted)]">
                  How can I help your family today?
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {tiles.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent)]">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <p className="mt-3 text-[0.9rem] font-semibold text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[0.78rem] leading-relaxed text-[var(--muted)]">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3">
              <MessageCircle
                size={15}
                className="flex-shrink-0 text-[var(--muted)]"
                strokeWidth={2}
              />
              <span className="truncate text-[0.82rem] text-[var(--muted)]">
                Ask JoJo anything…
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* notifications float around the card, each in its own fixed spot */}
      {notifications.map(({ id, feature, leaving }) => {
        const Icon = feature.icon;
        return (
          <div
            key={id}
            className={
              "pointer-events-none absolute z-20 hidden w-64 items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-elevated)] transition-all duration-300 sm:flex " +
              feature.slot +
              " " +
              (leaving
                ? "translate-y-1 opacity-0"
                : "toast-pop translate-y-0 opacity-100")
            }
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent)]">
              <Icon size={16} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.82rem] font-semibold text-[var(--foreground)]">
                {feature.title}
              </p>
              <p className="mt-0.5 text-[0.72rem] leading-relaxed text-[var(--muted)]">
                {feature.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
