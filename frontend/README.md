# ChaosGuard AI (React + Vite + TypeScript + Tailwind)
Run: npm install, then npm run dev. Run FastAPI on :8000 (dev proxy at /api) or set the URL in Settings or VITE_API_URL.
Assumed backend paths (edit src/api.ts): GET /features, POST /predict, GET /model-info, GET /health.
Anything not coming from the backend is labelled Demo data, Simulated or Sample. Auth pages are a demo only.
Failure drills run against an in-browser mock; swap in isolated test endpoints in src/pages/Chaos.tsx.
