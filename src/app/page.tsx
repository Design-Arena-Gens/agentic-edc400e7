"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Beaker,
  Bolt,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Library,
  ListChecks,
  Pause,
  PenTool,
  Play,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { format } from "date-fns";
import {
  AssistantResponse,
  StudentTask,
  WeeklyPlan,
  buildWeeklyPlan,
  defaultFollowUps,
  generateAssistantResponse,
} from "@/lib/assistant";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
};

type TimerMode = "focus" | "break" | "deep";

type FocusTimerState = {
  mode: TimerMode;
  secondsLeft: number;
  isRunning: boolean;
  cyclesCompleted: number;
};

const studentProfile = {
  name: "Jordan",
  semesterWeek: 6,
  goals: ["Maintain A- average", "Secure summer internship", "Build stronger debug strategies"],
  strengths: ["Pattern recognition", "Visual note taking", "Team facilitation"],
};

const toISODate = (offset: number) => {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString();
};

const initialTasks: StudentTask[] = [
  {
    id: "algorithms-problem-set",
    course: "Algorithms II",
    title: "Dynamic programming practice set",
    due: toISODate(1),
    effort: "intensive",
    estimatedMinutes: 110,
  },
  {
    id: "psych-reflection",
    course: "Cognitive Psychology",
    title: "Reflection journal on memory case study",
    due: toISODate(2),
    effort: "moderate",
    estimatedMinutes: 55,
  },
  {
    id: "systems-lab",
    course: "Systems Programming Lab",
    title: "Threading bug hunt recap",
    due: toISODate(0),
    effort: "moderate",
    estimatedMinutes: 80,
  },
  {
    id: "calc-quiz",
    course: "Applied Calculus",
    title: "Quiz prep: multivariate optimization",
    due: toISODate(3),
    effort: "light",
    estimatedMinutes: 40,
  },
  {
    id: "capstone-outline",
    course: "Capstone Studio",
    title: "Storyboard outline for midterm showcase",
    due: toISODate(5),
    effort: "intensive",
    estimatedMinutes: 120,
  },
];

const initialPlan = buildWeeklyPlan(initialTasks);

const quickPrompts = [
  "Map a 45-minute focus sprint for Algorithms.",
  "Break systems lab debugging into checkpoints.",
  "Help me prep cognitive psych flashcards.",
  "Suggest reflection prompts for today's study.",
  "Design a balanced study day around class times.",
];

const resourceDeck = [
  {
    title: "Active Recall Sprint Template",
    description: "3-step method to convert lecture notes into fast recall reps.",
    icon: Sparkles,
    url: "https://collegeinfogeek.com/spaced-repetition-memory-techniques/",
    tag: "Focus Strategy",
  },
  {
    title: "Algorithms Visual Playground",
    description: "Animate graphs, DP tables, and recursion trees for intuition boosts.",
    icon: Beaker,
    url: "https://visualgo.net/en",
    tag: "Interactive",
  },
  {
    title: "Systems Debug Playbook",
    description: "Structured checklist for isolating threading issues quickly.",
    icon: Bolt,
    url: "https://github.com/mr-mig/every-programmer-should-know",
    tag: "Tooling",
  },
  {
    title: "Reflective Journal Prompts",
    description: "Guided prompts that reinforce metacognition after study blocks.",
    icon: PenTool,
    url: "https://www.reflection.app/",
    tag: "Wellbeing",
  },
];

const achievements = [
  {
    title: "Consistent streak",
    detail: "5 focus sessions logged this week",
    icon: CheckCircle2,
  },
  {
    title: "Deep work wins",
    detail: "Completed 3/4 priority tasks on time",
    icon: Brain,
  },
  {
    title: "Course balance",
    detail: "Allocated time to every class this week",
    icon: ListChecks,
  },
];

const timerPresets: Record<TimerMode, { label: string; minutes: number; description: string }> = {
  focus: {
    label: "Focus Sprint",
    minutes: 25,
    description: "Classic Pomodoro deep work block.",
  },
  break: {
    label: "Micro Break",
    minutes: 5,
    description: "Reset, move, hydrate.",
  },
  deep: {
    label: "Deep Dive",
    minutes: 50,
    description: "Extended flow session with strong commit.",
  },
};

const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const MessageBubble = ({ message }: { message: Message }) => {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={`flex w-full gap-3 ${isAssistant ? "justify-start" : "justify-end"} text-sm`}
    >
      <div
        className={`max-w-[88%] rounded-2xl border px-4 py-3 leading-relaxed shadow-sm ${
          isAssistant
            ? "border-slate-800/80 bg-slate-900/70"
            : "border-emerald-500/30 bg-emerald-500/20 text-emerald-100"
        }`}
      >
        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
          {isAssistant ? "Aurora" : "You"}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
          {format(new Date(message.timestamp), "EEE, p")}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey Jordan, Aurora here. I pulled the tasks you pinned and lined them up by urgency. Ready for a focus block or should we refresh the weekly map?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [tasks] = useState<StudentTask[]>(initialTasks);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan[]>(initialPlan);
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>(defaultFollowUps);
  const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null);
  const [timer, setTimer] = useState<FocusTimerState>({
    mode: "focus",
    secondsLeft: timerPresets.focus.minutes * 60,
    isRunning: false,
    cyclesCompleted: 0,
  });

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const messageCounterRef = useRef(1);

  const makeMessageId = (prefix: "user" | "assistant") => {
    const value = messageCounterRef.current;
    messageCounterRef.current += 1;
    return `${prefix}-${value}`;
  };

  useEffect(() => {
    if (!timer.isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev.secondsLeft <= 1) {
          return {
            ...prev,
            secondsLeft: 0,
            isRunning: false,
            cyclesCompleted: prev.mode === "focus" ? prev.cyclesCompleted + 1 : prev.cyclesCompleted,
          };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const upcomingByDueDate = useMemo(
    () =>
      [...tasks].sort(
        (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
      ),
    [tasks],
  );

  const nextDueToday = useMemo(
    () =>
      upcomingByDueDate.filter((task) => {
        const today = new Date();
        const due = new Date(task.due);
        return (
          due.getFullYear() === today.getFullYear() &&
          due.getMonth() === today.getMonth() &&
          due.getDate() === today.getDate()
        );
      }),
    [upcomingByDueDate],
  );

  const handleSend = (prompt?: string) => {
    const trimmed = prompt ?? input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: makeMessageId("user"),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const assistantPayload = generateAssistantResponse(trimmed, {
      tasks,
      profile: studentProfile,
      plan: weeklyPlan,
    });

    const assistantMessage: Message = {
      id: makeMessageId("assistant"),
      role: "assistant",
      content: assistantPayload.reply,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setLastResponse(assistantPayload);

    if (assistantPayload.updatedPlan) {
      setWeeklyPlan(assistantPayload.updatedPlan);
    }

    if (assistantPayload.followUpPrompts?.length) {
      setFollowUpPrompts(assistantPayload.followUpPrompts);
    }
  };

  const applyPreset = (mode: TimerMode) => {
    const preset = timerPresets[mode];
    setTimer((prev) => ({
      mode,
      secondsLeft: preset.minutes * 60,
      isRunning: mode === prev.mode ? !prev.isRunning : true,
      cyclesCompleted: prev.cyclesCompleted,
    }));
  };

  const toggleTimer = () => {
    setTimer((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    const preset = timerPresets[timer.mode];
    setTimer((prev) => ({
      ...prev,
      secondsLeft: preset.minutes * 60,
      isRunning: false,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12 lg:gap-10 lg:px-10">
        <header className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-8 shadow-[0_40px_120px_-50px_rgba(20,20,60,0.7)] backdrop-blur-xl">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),transparent_45%),_radial-gradient(circle_at_bottom,_rgba(56,228,158,0.12),transparent_40%)]" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-950/60 px-4 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                <Sparkles className="size-3 text-emerald-400" />
                Student AI Assistant
              </div>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl">
                Aurora keeps your semester humming—study plans, focus sprints, and wellbeing nudges
                tuned to your rhythm.
              </h1>
              <p className="text-base text-slate-300 md:text-lg">
                Track assignments, design deep-work blocks, and surface curated resources without
                losing momentum. Drop a message and Aurora adapts instantly.
              </p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4 text-sm text-slate-200 md:grid-cols-2 md:text-base lg:w-[320px]">
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-900/70 p-3">
                <CalendarCheck className="size-10 rounded-lg bg-emerald-500/10 p-2 text-emerald-300" />
                <div>
                  <div className="text-xs uppercase text-slate-400">Week</div>
                  <div className="text-lg font-semibold">#{studentProfile.semesterWeek}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-900/70 p-3">
                <Clock className="size-10 rounded-lg bg-sky-500/10 p-2 text-sky-300" />
                <div>
                  <div className="text-xs uppercase text-slate-400">Next deadline</div>
                  <div className="text-lg font-semibold">
                    {format(new Date(upcomingByDueDate[0].due), "EEE")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-900/70 p-3 md:col-span-2">
                <Brain className="size-10 rounded-lg bg-indigo-500/10 p-2 text-indigo-300" />
                <div>
                  <div className="text-xs uppercase text-slate-400">This week&apos;s focus</div>
                  <div className="text-sm">
                    {studentProfile.goals[0]} • {studentProfile.goals[1]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[0.95fr_1.2fr] xl:grid-cols-[0.95fr_1.3fr_0.85fr]">
          <section className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 shadow-[0_30px_80px_-40px_rgba(14,116,144,0.5)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Weekly focus map</h2>
                  <p className="text-sm text-slate-400">
                    The roadmap updates whenever you request plan adjustments.
                  </p>
                </div>
                <Library className="size-10 text-slate-500" />
              </div>
              <div className="mt-5 space-y-4">
                {weeklyPlan.slice(0, 5).map((entry) => (
                  <div
                    key={entry.day}
                    className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold uppercase tracking-widest text-slate-300">
                        {entry.day}
                      </div>
                      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[12px] uppercase tracking-wide text-emerald-300">
                        Focus
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-slate-200">
                      {entry.focusAreas.map((focus) => (
                        <li key={focus} className="flex items-start gap-2">
                          <span className="mt-1 size-1.5 rounded-full bg-emerald-400" />
                          <span>{focus}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 rounded-xl bg-slate-950/60 p-3 text-xs text-slate-400">
                      {entry.energyTip}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Assignments on radar</h2>
                  <p className="text-sm text-slate-400">From most to least urgent.</p>
                </div>
                <ArrowUpRight className="size-5 text-slate-500" />
              </div>
              <div className="mt-5 space-y-4">
                {upcomingByDueDate.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span className="font-semibold">{task.title}</span>
                      <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] uppercase tracking-widest text-sky-200">
                        {task.effort}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{task.course}</span>
                      <span>{format(new Date(task.due), "eee • MMM d")}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Estimated time: {task.estimatedMinutes} mins
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Quick prompts</h2>
              <p className="text-sm text-slate-400">
                Tap a prompt to instantly brief Aurora.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {followUpPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/20"
                  >
                    {prompt}
                  </button>
                ))}
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-200 transition hover:border-slate-500/80 hover:bg-slate-900"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70">
              <div className="border-b border-slate-800/60 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">Conversation</h2>
                    <p className="text-sm text-slate-400">
                      Aurora adapts using your current tasks and goals.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-full border border-slate-800/70 bg-slate-900/70 px-4 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                    <Sparkles className="size-4 text-emerald-300" /> Real-time planning
                  </div>
                </div>
              </div>
              <div
                ref={chatContainerRef}
                className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6"
              >
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
              <div className="border-t border-slate-800/60 bg-slate-950/80 p-5">
                <div className="flex flex-col gap-3">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Tell Aurora what you need next…"
                    className="h-24 w-full resize-none rounded-2xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/70"
                  />
                  <button
                    onClick={() => handleSend()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-950 transition hover:bg-emerald-400"
                  >
                    <Sparkles className="size-4" />
                    Send to Aurora
                  </button>
                </div>
              </div>
            </div>
            {lastResponse?.recommendedTasks?.length ? (
              <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-200">
                      Aurora&apos;s priority picks
                    </h2>
                    <p className="text-sm text-emerald-200/80">
                      Tackling these keeps your momentum strong.
                    </p>
                  </div>
                  <Bolt className="size-8 text-emerald-300" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {lastResponse.recommendedTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-emerald-400/40 p-4">
                      <div className="text-xs uppercase tracking-widest text-emerald-200/70">
                        {task.course}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-emerald-50">
                        {task.title}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-emerald-200/80">
                        <span>{format(new Date(task.due), "eee, MMM d")}</span>
                        <span>{task.estimatedMinutes} mins</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Focus timer</h2>
                  <p className="text-sm text-slate-400">
                    Set intentional sprints. Aurora nudges you on completion.
                  </p>
                </div>
                <CalendarCheck className="size-10 text-slate-500" />
              </div>

              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-900/80 text-3xl font-semibold text-slate-100 shadow-inner">
                  {formatClock(timer.secondsLeft)}
                </div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {timerPresets[timer.mode].label}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={toggleTimer}
                    className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400/50"
                  >
                    {timer.isRunning ? (
                      <>
                        <Pause className="size-4" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-4" /> Start
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
                  >
                    <TimerReset className="size-4" />
                    Reset
                  </button>
                </div>
                <div className="flex gap-2">
                  {(
                    Object.keys(timerPresets) as Array<keyof typeof timerPresets>
                  ).map((modeOption) => (
                    <button
                      key={modeOption}
                      onClick={() => applyPreset(modeOption)}
                      className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider transition ${
                        timer.mode === modeOption
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-200"
                          : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {timerPresets[modeOption].label}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  Completed focus blocks this session: {timer.cyclesCompleted}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Resource drop</h2>
              <p className="text-sm text-slate-400">
                Curated for your courses and study style.
              </p>
              <div className="mt-5 space-y-4">
                {resourceDeck.map((resource) => (
                  <a
                    key={resource.title}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 transition hover:border-slate-600 hover:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <resource.icon className="size-10 rounded-xl bg-slate-950/60 p-2 text-slate-300" />
                      <div>
                        <div className="text-xs uppercase tracking-widest text-slate-400">
                          {resource.tag}
                        </div>
                        <div className="text-sm font-semibold text-slate-100">
                          {resource.title}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">{resource.description}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Momentum tracker</h2>
              <p className="text-sm text-slate-400">
                Celebrate daily wins and keep energy intentional.
              </p>
              <div className="mt-5 space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.title}
                    className="flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4"
                  >
                    <achievement.icon className="size-10 rounded-lg bg-slate-950/60 p-2 text-slate-200" />
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        {achievement.title}
                      </div>
                      <div className="text-xs text-slate-400">{achievement.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              {nextDueToday.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                  <div className="font-semibold uppercase tracking-[0.3em] text-emerald-300">
                    Today&apos;s win target
                  </div>
                  <ul className="mt-3 space-y-2 text-emerald-100">
                    {nextDueToday.map((task) => (
                      <li key={task.id} className="flex justify-between">
                        <span>{task.title}</span>
                        <span>{task.estimatedMinutes} mins</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 text-xs text-slate-400">
                  No same-day deadlines—perfect slot for concept reviews or skill drills.
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
