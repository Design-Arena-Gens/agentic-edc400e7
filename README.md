## Aurora – Personal Student AI Assistant

A web-based companion that helps students plan study weeks, design focus sprints, and surface curated resources without juggling multiple tools. Aurora combines a conversational assistant with contextual dashboards tailored for coursework momentum.

### Highlights
- **Adaptive conversation loop** – Chat with Aurora to refresh study plans, request resources, and get wellbeing nudges backed by your current tasks (`src/app/page.tsx#L214`).
- **Living weekly roadmap** – Generates a seven-day focus map that adjusts when the assistant replans (`src/lib/assistant.ts#L78`).
- **Assignment radar** – Prioritised assignment tracker with effort tags and time estimates surfaced in the left column (`src/app/page.tsx#L274`).
- **Focus timer & momentum tracker** – Built-in Pomodoro presets, streak tracking, and daily win targets to reinforce healthy study habits (`src/app/page.tsx#L420`).
- **Curated resource deck** – Quick access to active recall templates, debugging checklists, and reflection prompts tailored to the profile (`src/app/page.tsx#L463`).

### Tech Stack
- [Next.js 16 (App Router)](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) with native `@tailwindcss/postcss`
- [lucide-react](https://lucide.dev/) iconography
- [date-fns](https://date-fns.org/) for scheduling helpers

### Local Development
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` to interact with Aurora locally.

### Quality Checks
- `npm run lint` – Static analysis (ESLint with TypeScript rules)
- `npm run build` – Production build verification

### Deployment
The app is production-ready for Vercel:
```bash
vercel deploy --prod --token $VERCEL_TOKEN --name agentic-edc400e7
```

Live environment: https://agentic-edc400e7.vercel.app  
Verification command: `curl https://agentic-edc400e7.vercel.app`

### Project Structure
```
src/
  app/
    page.tsx      # UI, conversation loop, dashboards
    layout.tsx    # Metadata + root styles
    globals.css   # Tailwind + global polish
  lib/
    assistant.ts  # Study plan heuristics & response builder
```

Aurora currently runs with a profile seeded for “Jordan” — tweak the sample data in `src/app/page.tsx#L46` to match your own courses and study goals.
