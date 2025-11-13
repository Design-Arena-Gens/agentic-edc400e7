import { differenceInCalendarDays, format } from "date-fns";

export type StudentTask = {
  id: string;
  course: string;
  title: string;
  due: string;
  effort: "light" | "moderate" | "intensive";
  estimatedMinutes: number;
};

export type WeeklyPlan = {
  day: string;
  focusAreas: string[];
  energyTip: string;
};

export type AssistantContext = {
  tasks: StudentTask[];
  profile: {
    name: string;
    semesterWeek: number;
    goals: string[];
    strengths: string[];
  };
  plan: WeeklyPlan[];
};

export type AssistantResponse = {
  reply: string;
  updatedPlan?: WeeklyPlan[];
  recommendedTasks?: StudentTask[];
  followUpPrompts?: string[];
};

const motivationalSnippets = [
  "You've already proven you can handle tough courses—let's re-use the focus systems that worked before.",
  "Small, consistent study blocks beat last-minute marathons. You're building long-term gains.",
  "Each assignment you close today frees up more time for deep work later this week.",
  "Momentum matters. Shine on one task, then use that confidence to tackle the next.",
  "Remember to log quick reflections after study blocks; it locks in growth for the next session.",
];

const focusPrompts = [
  "Draft me a 30-minute focus plan for algorithms.",
  "Turn my discrete math notes into a 3-question self-quiz.",
  "Suggest active recall prompts for the psychology chapter on memory.",
  "Split tonight's reading into micro-goals with break suggestions.",
  "Help me prepare for a peer study session tomorrow.",
];

const wellbeingTips = [
  "Take a 90-second breathing reset between context switches.",
  "Stretch your shoulders and wrists, then grab water—hydration keeps the brain engaged.",
  "A 5-minute mind dump clears mental clutter before deep work.",
  "Batch quick replies after focus blocks so they don't break your flow.",
];

function formatTaskList(tasks: StudentTask[]) {
  return tasks
    .map((task, index) => {
      const dueDate = format(new Date(task.due), "EEE, MMM d");
      const daysAway = differenceInCalendarDays(new Date(task.due), new Date());
      const urgency =
        daysAway < 0
          ? "⚠ overdue"
          : daysAway === 0
            ? "due today"
            : daysAway === 1
              ? "due tomorrow"
              : `due in ${daysAway} days`;

      return `${index + 1}. ${task.title} (${task.course}) — ${dueDate}, ${urgency}, ~${task.estimatedMinutes} mins (${task.effort} effort)`;
    })
    .join("\n");
}

export function buildWeeklyPlan(tasks: StudentTask[]): WeeklyPlan[] {
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const sorted = [...tasks].sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
  );

  return weekdays.map((day, index) => {
    const focusAreas = sorted
      .filter((_, taskIndex) => taskIndex % 7 === index % 7)
      .slice(0, 2)
      .map((task) => `${task.course}: ${task.title}`);

    const energyTip = wellbeingTips[(index + focusAreas.length) % wellbeingTips.length];

    return {
      day,
      focusAreas: focusAreas.length
        ? focusAreas
        : ["Create reflections or review concept summaries to stay warm."],
      energyTip,
    };
  });
}

export function generateAssistantResponse(
  rawMessage: string,
  context: AssistantContext,
): AssistantResponse {
  const message = rawMessage.toLowerCase();
  const replySegments: string[] = [];
  const followUps = new Set<string>();
  let shouldUpdatePlan = false;
  let recommendedTasks: StudentTask[] | undefined;

  const upcoming = [...context.tasks].sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
  );
  const urgent = upcoming.filter(
    (task) => differenceInCalendarDays(new Date(task.due), new Date()) <= 2,
  );

  if (message.includes("schedule") || message.includes("plan")) {
    shouldUpdatePlan = true;
    replySegments.push(
      "Here's a refreshed game plan so you always know what's next:",
      "• Anchor two deep-focus blocks early in the day (before 1pm) when your energy is most stable.",
      "• Stack lighter review or discussion prep for evenings, ideally right after dinner while motivation is still high.",
      "• Close each block by logging a one-sentence reflection—this locks in retention and surfaces gaps for tomorrow.",
    );
    followUps.add("Can you tighten the schedule around work or club commitments?");
    followUps.add("Suggest small checkpoints for the longest task.");
  }

  if (message.includes("exam") || message.includes("quiz") || message.includes("test")) {
    shouldUpdatePlan = true;
    const examTasks = upcoming.filter((task) => task.effort !== "light").slice(0, 3);
    recommendedTasks = examTasks.length ? examTasks : upcoming.slice(0, 3);
    replySegments.push(
      "Let's activate exam mode:",
      "• Start with a 20-question active recall burst—fast reps identify weak spots instantly.",
      "• Convert tricky problems into spaced flashcards and schedule a second review within 48 hours.",
      "• Finish with a short teach-back recap; explaining the concept out loud locks the neural pathways.",
    );
    followUps.add("Build spaced recall prompts for the exam topics.");
  }

  if (message.includes("overwhelm") || message.includes("stress") || message.includes("burn out") || message.includes("burnout") || message.includes("tired")) {
    replySegments.push(
      "Overwhelm acknowledged—we pivot into a calmer cadence:",
      "• Swap in a 25 minute focus sprint followed by a 5 minute decompression walk.",
      "• Park all future worries in a quick brain dump; you can triage them after the next block.",
      "• Close the day with a gentle win: finish a micro-task that takes <15 minutes to rebuild confidence.",
    );
    followUps.add("Guide me through a grounded breathing exercise.");
  }

  if (message.includes("break")) {
    replySegments.push(
      "Break strategy coming right up:",
      "• Step away from the screen and hydrate; water plus movement resets neural fatigue.",
      "• Do a 90-second box breathing cycle (inhale for 4, hold for 4, exhale for 4, hold for 4).",
      "• When you sit back down, jot the next micro-step so re-entry feels frictionless.",
    );
  }

  if (message.includes("motivate") || message.includes("motivation")) {
    const snippet = motivationalSnippets[Math.floor(Math.random() * motivationalSnippets.length)];
    replySegments.push("Motivation boost:", snippet);
  }

  if (message.includes("resources") || message.includes("help") || message.includes("how to")) {
    replySegments.push(
      "Hand-picked resources that match your learning style:",
      "• Crash Course CS playlists—fast visual refreshers before deeper dives.",
      "• MIT OpenCourseWare practice sets for spaced repetition reps.",
      "• Cornell note templates: structure note-taking so future reviews are a breeze.",
      "• Use the Labs cheatsheet in the Resources panel to quickly locate debugger and tooling tips.",
    );
    followUps.add("Share more bite-sized video explainers.");
  }

  if (message.includes("reflect") || message.includes("journal")) {
    replySegments.push(
      "Reflection prompts so you capture the learning:",
      "1. What unlocked clarity today?",
      "2. Where did you feel friction, and what will you try next time?",
      "3. Which concept should future-you revisit this week?",
    );
  }

  if (replySegments.length === 0) {
    const defaultSnippet =
      motivationalSnippets[Math.floor(Math.random() * motivationalSnippets.length)];
    const urgentBlock = urgent.length
      ? `Your most time-sensitive tasks:\n${formatTaskList(urgent.slice(0, 3))}`
      : "You're slightly ahead—perfect moment to bank progress on conceptual reviews.";

    replySegments.push(
      `Got it, ${context.profile.name}. ${defaultSnippet}`,
      urgentBlock,
      "If you give me course details or time blocks, I can route them into the weekly planner instantly.",
    );

    followUps.add("Draft a 45-minute focus menu.");
    followUps.add("Which concept should I teach back to reinforce it?");
  }

  const updatedPlan = shouldUpdatePlan ? buildWeeklyPlan(context.tasks) : undefined;

  if (!recommendedTasks && replySegments.length > 0) {
    recommendedTasks = urgent.length ? urgent.slice(0, 3) : upcoming.slice(0, 3);
  }

  return {
    reply: replySegments.join("\n\n"),
    updatedPlan,
    recommendedTasks,
    followUpPrompts: followUps.size ? [...followUps] : focusPrompts.slice(0, 3),
  };
}

export const defaultFollowUps = focusPrompts;
