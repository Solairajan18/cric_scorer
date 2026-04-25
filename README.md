# Weekend Cric Scorer

Lightweight cricket scoring app built with `Next.js`, `Tailwind CSS`, and optional `Firebase Realtime Database` for free live sync.

## Features

- Match creation with team names, players, toss, and overs
- Ball-by-ball scoring with runs, wicket, wides, no-balls, byes, and leg byes
- Player tracking for striker, non-striker, and bowler
- Automatic innings progression and final result summary
- Shareable live match URL and final report
- Local-first persistence with optional Firebase sync

## Project structure

```txt
src/
  app/
    page.tsx
    m/[matchId]/page.tsx
    m/[matchId]/report/page.tsx
  components/
    CreateMatchForm.tsx
    Scoreboard.tsx
    BallInputPad.tsx
    PlayerPanel.tsx
    OverTimeline.tsx
    InningsBreakCard.tsx
    ReportSummary.tsx
  hooks/
    useMatch.ts
  lib/
    match-engine.ts
    match-sync.ts
    firebase.ts
  types/
    match.ts
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Optional Firebase setup for free live sync

Copy `.env.example` to `.env.local` and fill it with:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Recommended Realtime Database rules for a casual no-auth MVP:

```json
{
  "rules": {
    "matches": {
      "$matchId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

## Deploy on Vercel

1. Push the repo to GitHub.
2. Import the repository into Vercel.
3. Add the Firebase env vars in the Vercel project settings if you want multi-device live sync.
4. Deploy.

## Notes

- Free mode without Firebase: local scoring works on the scorer device.
- Free mode with Firebase Spark: live spectators can open the same match URL on their phones and receive updates.

Without Firebase, the app still works free on the scorer device using `localStorage`.
