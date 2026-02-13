# 🤾 Grótta Stats

Handball stat tracker built for Grótta coaches. Track player performance in real-time during games, view historical data, compare players, and export reports as PDF.

**Progressive Web App** — works on desktop, installs on iPhone/iPad/Android as a native-like app.

---

## Version

**v1.0.0** — February 2026

---

## Features

### ⚡ Live Game Stat Entry
- Start a new game by entering opponent name and date
- Full grid of all players × stat columns matching the coach's paper sheet
- Tap any cell to increment a stat
- **+/− toggle mode** for easy corrections — green for plus, red for minus
- Goalkeepers displayed in their own section with goalkeeper-specific stats
- Save game to database when finished

### 📋 Game History
- View all past games sorted by date (newest first)
- Tap a game to expand and see the full stat sheet
- Delete games with confirmation
- Export any game as a clean PDF report (📄 button)

### 👥 Player Management
- Add, edit, and deactivate players
- Mark players as field player or goalkeeper (different stat columns)
- Search/filter players by name
- Tap a player to see their full profile:
  - **Total stats** across all games
  - **Per-game averages** (Ø)
  - **Game-by-game breakdown** table
- Export player profile as PDF

### 📊 Statistics Dashboard
- **Stigatafla (Leaderboard)** — pick any stat, see players ranked with bar chart visualization, totals, and per-game averages. Medals (🥇🥈🥉) for top 3.
- **Liðstölur (Team Totals)** — all stats aggregated for the entire team with per-game averages. Field players and goalkeepers separated.
- Dropdown to switch between all available stats (field + goalkeeper)

### ⚖️ Player Comparison
- Pick any two players from the roster
- Side-by-side comparison of all stats (totals + averages)
- Winning stat highlighted in green per row
- Works across player types (field vs goalkeeper shows all relevant stats)

### 📄 PDF Export
- **Game report** — full stat sheet for a single game, clean table format
- **Player report** — summary (totals + averages) and game-by-game table
- Professional layout with Grótta branding and auto-pagination

### 🔐 PIN Authentication
- 4-digit PIN setup on first launch
- PIN required to access the app (SHA-256 hashed, stored locally)
- Change PIN in Settings (requires current PIN)
- Reset PIN option on login screen for recovery

### 📱 Progressive Web App (PWA)
- Installable on iPhone, iPad, Android, desktop
- Standalone mode (no browser chrome)
- Service worker for offline caching
- To install: open in Safari/Chrome → Share → "Add to Home Screen"

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router 6            |
| Build      | Vite 6 + vite-plugin-pwa            |
| Backend    | Supabase (PostgreSQL + REST API)     |
| PDF        | jsPDF + jspdf-autotable              |
| Auth       | 4-digit PIN (client-side, SHA-256)   |
| Styling    | Custom CSS, CSS variables, dark theme|

---

## Tracked Stats

### Field Players (Útileikmenn)
| Stat | Icelandic |
|------|-----------|
| Shots / Goals | Skot / mörk |
| Assists | Stoðsending |
| Turnovers | Tapaður bolti |
| Penalties Won | Fiskað víti |
| Blocks | Hávörn |
| Free Throws | Fríkast |
| Steals | Stolinn bolti |
| Breakthrough + | Ruðningur + |
| Breakthrough - | Ruðningur - |
| Fast Break | Hraðaupphl. |

### Goalkeepers (Markvörðir)
| Stat | Icelandic |
|------|-----------|
| Saved Shots | Varin skot |
| First Half | Fyrri hálfleikur |
| Second Half | Seinni hálfleikur |
| Passes ++ | Sendingar ++ |
| Passes -- | Sendingar -- |

---

## Database Schema (Supabase)

```
players
├── id (uuid, PK)
├── name (text)
├── is_goalkeeper (boolean)
├── active (boolean)
├── sort_order (int)
└── created_at (timestamptz)

games
├── id (uuid, PK)
├── opponent (text)
├── game_date (date)
├── notes (text)
└── created_at (timestamptz)

game_stats
├── id (uuid, PK)
├── game_id (FK → games)
├── player_id (FK → players)
├── skot_mork (int)
├── stodsending (int)
├── tapadur_bolti (int)
├── fiskad_viti (int)
├── havorn (int)
├── frikast (int)
├── stolinn_bolti (int)
├── rudningur_plus (int)
├── rudningur_minus (int)
└── hradaupphlaup (int)

goalkeeper_stats
├── id (uuid, PK)
├── game_id (FK → games)
├── player_id (FK → players)
├── varin_skot (int)
├── fyrri_halfleikur (int)
├── seinni_halfleikur (int)
├── sendingar_plus (int)
└── sendingar_minus (int)
```

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd grotta-stats
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the SQL Editor and run the schema SQL (see `schema.sql` or the migration in this repo)
3. Go to **Settings → API** and copy your project URL and anon key

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run

```bash
npm run dev
```

Open `http://localhost:5173` — set your 4-digit PIN and you're in.

### 5. Build for production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host.

### 6. Install as app

On your phone, open the deployed URL in Safari (iOS) or Chrome (Android):
- **iOS**: Tap Share → "Add to Home Screen"
- **Android**: Tap menu → "Install app" or "Add to Home Screen"

---

## Project Structure

```
grotta-stats/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── components/
    │   ├── Layout.jsx / Layout.css
    │   └── PinScreen.jsx / PinScreen.css
    ├── pages/
    │   ├── HomePage.jsx / HomePage.css
    │   ├── GamesPage.jsx / GamesPage.css
    │   ├── PlayersPage.jsx / PlayersPage.css
    │   ├── StatsPage.jsx / StatsPage.css
    │   ├── ComparePage.jsx / ComparePage.css
    │   ├── SettingsPage.jsx / SettingsPage.css
    │   └── PageStyles.css
    ├── lib/
    │   ├── stats.js
    │   ├── supabase.js
    │   └── exportPdf.js
    └── styles/
        └── global.css
```

---

## License

Private — built for Grótta handball club.
