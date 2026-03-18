"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {CheckCircle2, Circle, X, Sparkles, ArrowRight, ScanSearch, Plug, BarChart3, Zap, ChevronDown, ChevronUp} from "lucide-react";
import {cn} from "@/lib/utils";

interface Step {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  ticketCount: number;
  hasIntegration: boolean;
  userName: string;
}

const STORAGE_KEY = "sp_onboarding_dismissed";

export default function OnboardingChecklist({ticketCount, hasIntegration, userName}: OnboardingChecklistProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  // Check if user already dismissed this
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setDismissed(true);
    }
  }, []);

  const steps: Step[] = [
    {
      id: "analyze",
      icon: <ScanSearch className="w-5 h-5" />,
      title: "Analyze your first ticket",
      description: "Paste any customer message and see the AI break it down — category, urgency, sentiment, and a suggested reply.",
      href: "/analyze-ticket",
      cta: "Analyze a ticket",
      completed: ticketCount > 0,
    },
    {
      id: "integrate",
      icon: <Plug className="w-5 h-5" />,
      title: "Connect your support platform",
      description: "Link Zendesk, Intercom, or Freshdesk so tickets flow in automatically. Or use the custom webhook.",
      href: "/integrations",
      cta: "Connect a platform",
      completed: hasIntegration,
    },
    {
      id: "insights",
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Check your insights",
      description: "After a few tickets, the Insights page shows patterns, top issues, and missing help articles.",
      href: "/insights",
      cta: "View insights",
      completed: ticketCount >= 3,
    },
    {
      id: "notifications",
      icon: <Zap className="w-5 h-5" />,
      title: "Set up urgent alerts",
      description: "Get an email the moment an urgent ticket comes in so your team can respond in minutes, not hours.",
      href: "/settings",
      cta: "Configure alerts",
      completed: false, // Always encourage, user can dismiss
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;
  const pct = Math.round((completedCount / steps.length) * 100);

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  function handleStepClick(step: Step) {
    setCompleting(step.id);
    setTimeout(() => {
      router.push(step.href);
      setCompleting(null);
    }, 200);
  }

  // Don't show if dismissed or all steps complete
  if (dismissed) return null;
  if (allDone) return null;

  return (
    <>
      {/* ── Full-screen welcome overlay — shown once on first visit ── */}
      <WelcomeOverlay userName={userName} onStart={() => router.push("/analyze-ticket")} onSkip={() => setDismissed(true)} ticketCount={ticketCount} />

      {/* ── Persistent checklist card at top of dashboard ── */}
      <div className="card mb-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 cursor-pointer select-none" onClick={() => setMinimized(!minimized)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Get started with Replify</p>
              <p className="text-xs text-gray-400">
                {completedCount} of {steps.length} steps completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress pill */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{width: `${pct}%`}} />
              </div>
              <span className="text-xs font-semibold text-gray-500">{pct}%</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            {minimized ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {/* Steps */}
        {!minimized && (
          <div className="border-t border-gray-100 divide-y divide-gray-100">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={cn("flex items-start gap-4 px-6 py-4 transition-colors", step.completed ? "bg-gray-50/60" : "hover:bg-blue-50/30 cursor-pointer group")}
                onClick={() => !step.completed && handleStepClick(step)}
              >
                {/* Step number / check */}
                <div className="shrink-0 mt-0.5">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-500">{i + 1}</span>
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    step.completed ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                  )}
                >
                  <div className="w-4 h-4">{step.icon}</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold mb-0.5", step.completed ? "text-gray-400 line-through" : "text-gray-900")}>{step.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                </div>

                {/* CTA */}
                {!step.completed && (
                  <button
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                      completing === step.id ? "bg-blue-600 text-white" : "text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white",
                    )}
                  >
                    {completing === step.id ? (
                      <div className="spinner !w-3 !h-3" />
                    ) : (
                      <>
                        {step.cta}
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Welcome overlay — shown only on very first visit ─────────────
function WelcomeOverlay({userName, onStart, onSkip, ticketCount}: {userName: string; onStart: () => void; onSkip: () => void; ticketCount: number}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if first ever visit AND no tickets yet
    const seen = localStorage.getItem("sp_welcome_seen");
    if (!seen && ticketCount === 0) {
      // Small delay so dashboard renders first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [ticketCount]);

  function handleStart() {
    localStorage.setItem("sp_welcome_seen", "true");
    setVisible(false);
    onStart();
  }

  function handleSkip() {
    localStorage.setItem("sp_welcome_seen", "true");
    setVisible(false);
    onSkip();
  }

  if (!visible) return null;

  const firstName = userName.split(" ")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", height: "100vh"}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Top gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />

        <div className="p-8">
          {/* Emoji + heading */}
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome{firstName ? `, ${firstName}` : ""}!</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">Replify is ready to help your team respond to support tickets faster. Let's get you set up in under 2 minutes.</p>

          {/* 3 quick steps preview */}
          <div className="space-y-3 mb-8">
            {[
              {num: "1", color: "bg-blue-600", text: "Paste your first ticket — see the AI reply instantly"},
              {num: "2", color: "bg-purple-600", text: "Connect Zendesk, Intercom, or any platform"},
              {num: "3", color: "bg-emerald-600", text: "Get insights on what's causing the most tickets"},
            ].map((step) => (
              <div key={`step-${step.num}`} className="flex items-center gap-3">
                <div className={`w-6 h-6 ${step.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{step.num}</div>
                <p className="text-sm text-gray-700">{step.text}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3">
            <button onClick={handleStart} className="btn-primary w-full justify-center !py-3 !text-sm">
              <Sparkles className="w-4 h-4" />
              Analyze my first ticket
            </button>
            <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">
              Skip for now, I'll explore on my own
            </button>
          </div>
        </div>

        {/* Trial reminder */}
        <div className="bg-blue-50 border-t border-blue-100 px-8 py-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">
            You're on a <span className="font-semibold">7-day free trial</span> — no credit card needed
          </p>
        </div>
      </div>
    </div>
  );
}
