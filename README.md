# 💃 DanceJudge Pro | Competition Scoring Platform

A modern, high-performance web application designed for dance competitions. Judges evaluate performances seamlessly on their own phones or laptops through secure, passwordless private links, with instant video playback, reactive real-time scoring, blind judging enforcement, and comprehensive Excel audit reporting.

Built with **React**, **Vite**, **Tailwind CSS**, and **Firebase (Cloud Firestore)**.

---

## 🌟 Key Highlights

- **Sleek Crimson & Noir Glassmorphism**: Near-black (`#0a0a0a`) background with deep-red radial glow, 3 layers of translucent glass depth (`backdrop-blur-xl`), soft red shadows, and bold typography (**Bebas Neue / Oswald** + **Inter**).
- **Private Judge Links**: No accounts or passwords required for judges. Each judge receives a unique URL (`/?judge=<token>`) with 1-click WhatsApp deep-link sharing.
- **Score Sliders (1.0 to 10.0)**: Smooth custom red sliders with 0.5 increments, micro-step stepper buttons for mobile precision, large confident numerals, and live running totals.
- **Embedded Video Hub**: Automatically converts Google Drive `/view` links to `/preview` iframes. Supports YouTube, Vimeo, direct MP4s, and a fallback "Open Video" button.
- **Offline & Autosave Resilience**: Debounced local draft saving protects against unstable event venue Wi-Fi, with an amber offline indicator banner and automatic synchronization upon reconnection.
- **Automated Spreadsheet Importer**: SheetJS parser for Google Form exported `.xlsx` files:
  - Cleans whitespace and uppercases names.
  - Auto-deduplicates by `(registration number + category)`, keeping the **latest** submission.
  - Validates registration format (e.g. `26BEE1040`: 2 digits + 3 letters + 4 digits).
  - Flags junk names (e.g. `afkn`, `.`, `sdgsd`) and missing videos for review.
  - Converts phone numbers to clean text (preventing scientific notation).
  - Assigns sequential anonymous IDs (`S-01`, `D-01`, `T-01`) for **blind judging**.
- **Real-Time Leaderboard & Audit**:
  - Live ranking by average score across judges.
  - Top 3 highlighted podium cards with celebratory gold & red confetti.
  - **Outlier Detection**: Warns if any judge deviates by > 20% from peer averages.
  - **Configurable Tie-Breakers**: Higher *Technique & Execution* average, then higher *Creative Choreography* average, or manual decision flag.
- **Comprehensive Excel Export**: Exports official `.xlsx` with separate ranking sheets for Solo, Duo, and Trio, plus a raw sheet containing all individual judge scores and timestamped comments.
- **Zero-Config Instant Demo**: Automatically loads 6 realistic sample entries (2 Solo, 2 Duo, 2 Trio) and 3 celebrity judges on first run so you can evaluate the complete app right away!

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite 8 |
| **Styling** | Tailwind CSS v4 with custom glassmorphism & red neon design tokens |
| **Database** | Firebase Cloud Firestore (real-time listeners) with automatic local reactive fallback |
| **Spreadsheet Engine** | SheetJS (`xlsx`) for Google Form imports and multi-sheet exports |
| **Icons** | Lucide React |
| **Fonts** | Google Fonts: *Bebas Neue*, *Oswald*, and *Inter* |
| **Deployment Targets** | Vercel (`vercel.json`) or Netlify (`netlify.toml`) |

---

## 🚀 Quick Start (Instant Local Demo Mode)

DanceJudge Pro includes an integrated local reactive database fallback. You can run and test the complete app locally **even before configuring Firebase keys**.

### 1. Clone & Enter Directory
```bash
cd dance-judging-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open your browser at `http://localhost:5173`. The app will initialize with pre-seeded demo data:
- **Solo Entries**: `S-01`, `S-02`
- **Duo Entries**: `D-01`, `D-02`
- **Trio Entries**: `T-01`, `T-02`
- **Judges**: Remo D'Souza, Terence Lewis, Geeta Kapur
- **Admin Coordinator PIN**: `2026`

---

## ⚙️ Step-by-Step Firebase Setup

To connect live Cloud Firestore for multi-device real-time sync during the live competition:

### Step 1: Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g., `dance-competition-2026`).
4. (Optional) Disable Google Analytics for simplicity, then click **Create project**.

### Step 2: Enable Cloud Firestore
1. In the Firebase console left sidebar, navigate to **Build** → **Firestore Database**.
2. Click **Create database**.
3. Choose a Firestore location close to your venue (e.g. `asia-south1` for India or `us-central1`).
4. Select **Start in test mode** for initial setup, then click **Create**.

### Step 3: Register Web App & Get API Keys
1. In project overview, click the **Web icon (`</>`)** to add a web app.
2. Enter an app nickname (e.g. `DanceJudge Web`) and click **Register app**.
3. Copy the `firebaseConfig` keys from the snippet.

### Step 4: Configure `.env`
In the project root directory, edit `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...your_actual_key
VITE_FIREBASE_AUTH_DOMAIN=dance-competition-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dance-competition-2026
VITE_FIREBASE_STORAGE_BUCKET=dance-competition-2026.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Step 5: Deploy Firestore Security Rules
Go to **Firestore Database** → **Rules** tab, and paste the contents of `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /entries/{entryId} {
      allow read: if true;
      allow write: if true; // Restrict to admin in production
    }
    match /judges/{judgeId} {
      allow read: if true;
      allow write: if true;
    }
    match /scores/{scoreId} {
      allow read: if true;
      allow write: if request.resource.data.total >= 0 
                    && request.resource.data.total <= 60;
    }
    match /settings/{settingId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```
Click **Publish**.

---

## 📋 Data Import & Google Form Format

Admins can upload the `.xlsx` export from a Google Form. The importer automatically maps columns regardless of slight naming differences:

| Expected Column | Notes |
|---|---|
| `Timestamp` | Submission date and time |
| `NAME` | Performer 1 full name (trimmed and uppercased) |
| `REGISTRATION NUMBER` | Checked against `^\d{2}[A-Za-z]{3}\d{4}$` (e.g. `26BEE1040`) |
| `PHONE NUMBER` | Stored as text to prevent scientific notation |
| `COLLEGE MAIL` | Contact email |
| `CATEGORY` | `SOLO`, `DUO`, or `TRIO` |
| `VIDEO LINK` | Primary video URL (Google Drive, YouTube, Vimeo, MP4) |
| `Performer 2 Name` | Partner 2 for DUO/TRIO |
| `Performer 2 Reg` | Partner 2 registration number |
| `Performer 2 Phone` | Partner 2 contact |
| `Performer 2 Mail` | Partner 2 email |
| `VIDEO LINK 2` | Optional second camera angle or backup link |
| `Performer 3 Name` | Partner 3 for TRIO |
| `Performer 3 Reg` | Partner 3 registration number |
| `Performer 3 Phone` | Partner 3 contact |
| `Performer 3 Mail` | Partner 3 email |
| `VIDEO LINK 3` | Optional third camera angle |

### Pre-Import Review Panel:
Before committing data to Firestore, an interactive review dialog presents:
- **Valid Entries**: Ready for immediate import.
- **Flagged Entries**: Displays exact reason (e.g. *Invalid Reg No format*, *Missing video link*, *Junk name*).
- **Duplicates**: Automatically identifies repeat submissions with matching `(Reg No + Category)`, superseding older rows with the newest submission.
- **Restore / Delete**: Admins can override exclusions or delete rows with 1 click.

---

## 🎯 Judging Criteria Configuration

Located in `src/config/criteria.js`. Edit criteria, descriptions, score steps, or tie-breakers in one place:

```javascript
export const JUDGING_CONFIG = {
  minScore: 1.0,
  maxScore: 10.0,
  scoreStep: 0.5,
  defaultScore: 5.0,
  outlierThreshold: 0.20, // 20% variance warning

  criteria: [
    { id: 'expression_energy', name: 'Expression & Energy', categories: ['SOLO', 'DUO', 'TRIO'] },
    { id: 'choreography', name: 'Creative Choreography', categories: ['SOLO', 'DUO', 'TRIO'] },
    { id: 'precision_timing', name: 'Precision & Timing', categories: ['SOLO', 'DUO', 'TRIO'] },
    { id: 'technique_execution', name: 'Technique & Execution', categories: ['SOLO', 'DUO', 'TRIO'] },
    { id: 'overall_impact', name: 'Overall Impact', categories: ['SOLO', 'DUO', 'TRIO'] },
    { id: 'synchronization_chemistry', name: 'Synchronization & Chemistry', categories: ['DUO', 'TRIO'] }, // Duo/Trio only
  ],
  categoryMaxScores: {
    SOLO: 50,  // 5 criteria * 10
    DUO: 60,   // 6 criteria * 10
    TRIO: 60,  // 6 criteria * 10
  },
};
```

---

## 📱 Judge Flow

1. **Accessing the Portal**:
   The judge opens their private link (`https://your-domain.com/?judge=judge-remo-789a2b`).
2. **Category Selection & Grid**:
   The judge selects Solo, Duo, or Trio tabs, viewing overall category progress (e.g. `7 of 15 scored`) and anonymous cards (`S-01`, `S-02`).
3. **Scoring Performance**:
   - The participant's video plays at the top (with multi-angle switcher if submitted).
   - The judge slides or steps criteria from **1.0 to 10.0** in 0.5 increments.
   - Live total updates in real time.
   - An optional feedback comment box is available.
4. **Saving & Navigating**:
   - Sticky bottom bar displays **Prev**, **Running Total**, **Save**, and **Save & Next**.
   - Warns if any criterion was left unassigned.
   - Shows **Saved ✓** with checkmark animation.

---

## 🛡️ Admin Dashboard Features

- **Access Protection**: Protected by Admin PIN (Default: `2026`, customizable in Settings).
- **Judge Link Generator**: Add judge by name, generate randomized tokens, copy link, or click **WhatsApp** to send an invite directly.
- **Category Round Locking**: Freeze scoring per category once a round ends to prevent post-deadline edits.
- **Blind Judging Toggle**: Toggle performer name visibility on the leaderboard without modifying the underlying database.
- **Audit & Outlier Alerts**: Automatically flags if any judge's score differs from the peer judge average by more than 20%.
- **Export to Excel**: Generates a multi-sheet `.xlsx` workbook containing final category rankings, criterion averages, judge breakdown, and all raw judge notes.

---

## 🌐 Deploy to Vercel or Netlify

### Option A: Deploy to Vercel (Recommended)
1. Push your code to GitHub / GitLab / Bitbucket.
2. Go to [Vercel](https://vercel.com/) and click **Add New** → **Project**.
3. Import your repository.
4. In **Environment Variables**, add the `VITE_FIREBASE_*` variables from your `.env`.
5. Click **Deploy**.
*(Note: `vercel.json` is already included to handle SPA URL rewrites).*

### Option B: Deploy to Netlify
1. Go to [Netlify](https://www.netlify.com/) and click **Add new site** → **Import an existing project**.
2. Select your repository.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. In **Environment Variables**, add your `VITE_FIREBASE_*` keys.
6. Click **Deploy site**.
*(Note: `netlify.toml` is already included to handle SPA redirects).*

---

## 📂 Project Structure

```
dance-judging-app/
├── public/                     # Static assets & icons
├── src/
│   ├── config/
│   │   └── criteria.js         # Central judging criteria, weights & tie-break config
│   ├── components/
│   │   ├── Navbar.jsx          # Header with logo, judge pill, offline & live indicators
│   │   ├── ScoreSlider.jsx     # 1-10 range slider with 0.5 steps & bold numerals
│   │   ├── VideoPlayer.jsx     # Drive/YouTube/Vimeo embedder with tab fallback
│   │   ├── EntryReviewModal.jsx# Pre-import inspection dialog (flagged/duplicates)
│   │   └── Confetti.jsx        # Lightweight crimson & gold particle celebration
│   ├── lib/
│   │   └── firebase.js         # Cloud Firestore client + reactive local storage fallback
│   ├── utils/
│   │   ├── importer.js         # SheetJS Google Form parser, deduplicator & cleaner
│   │   ├── exporter.js         # Multi-sheet Excel export generator
│   │   ├── leaderboard.js      # Cross-judge average, tie-breaking & 20% outlier audit
│   │   ├── videoEmbed.js       # Video URL transformer
│   │   └── demoData.js         # Realistic demo entries, judges & sample scores
│   ├── views/
│   │   ├── HomeLanding.jsx     # Welcome portal & demo judge quick-selector
│   │   ├── JudgeHome.jsx       # Category tabs, progress bar & anonymous entry cards
│   │   ├── JudgeScore.jsx      # Video player, criteria sliders & sticky bottom bar
│   │   ├── Leaderboard.jsx     # Live podium, standings table & outlier warnings
│   │   └── AdminDashboard.jsx  # PIN gate, Excel import, judge links & round locks
│   ├── App.jsx                 # Root router and real-time state synchronizer
│   ├── index.css               # Tailwind v4 theme, ambient red glow & glass styling
│   └── main.jsx                # React DOM entry point
├── firestore.rules             # Cloud Firestore security rules
├── sample_dance_submissions.xlsx # Sample Google Form export with valid & flagged rows
├── create-sample-sheet.mjs     # Script to regenerate sample spreadsheet
├── vercel.json                 # Vercel SPA routing rewrite rules
├── netlify.toml                # Netlify SPA redirect rules
├── package.json
└── vite.config.js
```

---

## 📄 License
MIT License &bull; Designed & Built for Dance Competitions.
