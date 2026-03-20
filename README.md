<div align="center">

# 🫁 BreatheSync

### *Your AI-powered companion for managing asthma, tracking lung health, and breathing easier every day.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-blue?style=for-the-badge&logo=vercel)](https://github.com/Shashwatology/BreatheSync)
[![Backend API](https://img.shields.io/badge/Backend%20API-Hugging%20Face-orange?style=for-the-badge&logo=huggingface)](https://github.com/Shashwatology/BreatheSync)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Made with FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)

</div>

---

## 📸 App Showcase

<table>
  <tr>
    <td align="center"><b>🏠 Home / Landing</b></td>
    <td align="center"><b>📊 Health Dashboard</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_home.png" alt="Home Page" width="100%"/></td>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_dashboard.png" alt="Dashboard" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>🎙️ AI Voice Check</b></td>
    <td align="center"><b>🗺️ Environmental AQI Map</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_voice.png" alt="Voice Check" width="100%"/></td>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_environment.png" alt="Environment Map" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>🏋️ Lung Gym</b></td>
    <td align="center"><b>🌙 Sleep Mode (Acoustic Radar)</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_lung_gym.png" alt="Lung Gym" width="100%"/></td>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_sleep.png" alt="Sleep Mode" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>🥗 Gut Health Intelligence</b></td>
    <td align="center"><b>🔐 Secure Login</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_gut_health.png" alt="Gut Health" width="100%"/></td>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_login.png" alt="Login" width="100%"/></td>
  </tr>
</table>

---

## ✨ Features

### 🎙️ AI-Powered Vocal Biomarker Analysis
Record a sustained vowel sound ("Ahhh") for 6 seconds. BreatheSync's ML engine extracts acoustic features using **Librosa** (MFCC, Jitter, Shimmer, ZCR, HNR) and runs them through a trained **Scikit-learn** classifier to produce a **Lung Voice Score** out of 100 — a non-invasive, clinically-inspired respiratory health metric.

### 📊 Predictive Health Dashboard
A comprehensive at-a-glance view of your respiratory health ecosystem:
- **🫁 Live Lung Voice Score** with trend tracking (↑ +5 from yesterday)
- **⚠️ Digital Twin Forecast** — AI risk prediction engine (e.g., "88% Attack Risk")
- **🌬️ Live Sensor Cards** — Breathing sessions, medication adherence, risk level, gut health
- **Weekly consistency tracker** and quick-action shortcuts

### 🗺️ Hyper-Local Environmental Intelligence (Trigger Map)
- Real-time **AQI (Air Quality Index)** data from the AQICN global network
- **Interactive Leaflet.js map** with color-coded risk zones (Good / Moderate / Unhealthy)
- **AI Health Prediction** per location — auto-correlated with your respiratory history
- Drill-down city list with per-location AQI badges

### 🏋️ Lung Gym — Therapeutic Breathing Trainer
- **Guided Breathing**: 4-7-8 technique for deep relaxation (timed, animated)
- **Dragon Breather**: Gamified breathing exercise using your microphone — blow to fly!
- **Streak tracking**, badge system, and session history with scores

### 🌙 Sleep Mode — Acoustic Radar
- On-device **Edge AI** monitoring for nocturnal coughing and wheezing
- Completely **private** — no audio is ever recorded or uploaded, only event frequency metadata
- Predicts next-day asthma risk from overnight acoustic patterns

### 🥗 Gut Health Intelligence
- **Gut-Lung Axis** — food recommendations to reduce systemic inflammation
- Anti-inflammatory food list (Turmeric, Ginger Tea, Flaxseeds)
- Probiotics guide (Yogurt / Dahi, Kimchi)
- Foods-to-avoid warnings (Dairy excess, Fried foods)
- **Food Log** and **Gut-Lung Correlation** tabs

### 🔐 Secure Auth & User Management
- **Supabase Auth** with email/password and Google OAuth
- Demo Mode for unauthenticated exploration
- Role-based access control

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BreatheSync Platform                 │
│                                                          │
│  ┌───────────────────┐        ┌───────────────────────┐ │
│  │   React Frontend  │◄──────►│  FastAPI Backend       │ │
│  │   (Vite + TS)     │        │  (Python 3.11)        │ │
│  │                   │        │                       │ │
│  │  • Dashboard      │        │  • /voice/analyze     │ │
│  │  • Voice Check    │        │  • /environment/aqi   │ │
│  │  • Trigger Map    │        │  • /chat              │ │
│  │  • Lung Gym       │        │  • /health            │ │
│  │  • Sleep Mode     │        │                       │ │
│  │  • Gut Health     │        │  ML Engine:           │ │
│  └────────┬──────────┘        │  • Librosa (Audio)    │ │
│           │                   │  • Scikit-learn (ML)  │ │
│           │                   └──────────┬────────────┘ │
│           │                              │              │
│  ┌────────▼──────────┐        ┌──────────▼────────────┐ │
│  │  Supabase         │        │  External APIs        │ │
│  │  (Auth + DB)      │        │  • AQICN (Global AQI) │ │
│  │  PostgreSQL       │        │  • OpenWeatherMap     │ │
│  └───────────────────┘        └───────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Shadcn/UI, Framer Motion |
| **Maps** | Leaflet.js |
| **Data Visualization** | Recharts |
| **Backend** | FastAPI, Python 3.11, Uvicorn |
| **Machine Learning** | Scikit-learn, Librosa, NumPy, SciPy |
| **Database & Auth** | Supabase (PostgreSQL + GoTrue) |
| **Containerization** | Docker |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Hugging Face Spaces |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+
- A **Supabase** project with Auth enabled
- API keys for **AQICN** and **OpenWeatherMap**

### 1. Clone the Repository

```bash
git clone https://github.com/Shashwatology/BreatheSync.git
cd BreatheSync
```

### 2. Setup the Backend

```bash
cd backend/breathesync-backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

**`.env` file:**
```env
AQICN_API_TOKEN=your_aqicn_token_here
OPENWEATHERMAP_API_KEY=your_owm_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
```

```bash
# Start the backend server
python main.py
# API available at: http://localhost:8000
# Docs available at: http://localhost:8000/docs
```

### 3. Setup the Frontend

```bash
cd frontend/breathe-better-app

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
```

```bash
# Start the frontend dev server
npm run dev
# App available at: http://localhost:5173
```

---

## ☁️ Deployment (100% Free)

| Service | Platform | Cost |
|---|---|---|
| Frontend | Vercel | Free (Hobby) |
| Backend | Hugging Face Spaces (Docker) | Free |
| Database & Auth | Supabase | Free Tier |

### Deploy to Vercel (Frontend)
1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import this repo
2. Set **Root Directory** to `frontend/breathe-better-app`
3. Add your environment variables in Vercel settings
4. Deploy ✅

### Deploy to Hugging Face Spaces (Backend)
1. Create a new **Docker Space** at [huggingface.co/new-space](https://huggingface.co/new-space)
2. Push the `backend/breathesync-backend` folder to the Space's Git repo
3. Add your `.env` variables in **Space Settings → Secrets**
4. The Space auto-builds from the Dockerfile and exposes port `7860` ✅

---

## 📁 Project Structure

```
BreatheSync/
├── backend/
│   └── breathesync-backend/
│       ├── main.py               # FastAPI application entry point
│       ├── requirements.txt      # Python dependencies
│       ├── Dockerfile            # Docker config for Hugging Face Spaces
│       ├── routes/
│       │   ├── voice.py          # Voice analysis endpoints
│       │   ├── environment.py    # AQI & weather endpoints
│       │   ├── chat.py           # AI chat (Travel Safe) endpoints
│       │   └── health.py         # Health check endpoint
│       ├── services/
│       │   └── audio_processor.py # ML audio feature extraction
│       └── models/               # Trained ML model artifacts
└── frontend/
    └── breathe-better-app/
        ├── src/
        │   ├── pages/            # Route-level page components
        │   ├── components/       # Reusable UI components
        │   └── ...
        ├── vercel.json           # Vercel SPA routing config
        └── supabase/             # DB migrations & edge functions
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

*Breathe Better. Live Better.* 🫁

**Made with ❤️ by [Shashwat Upadhyay](https://github.com/Shashwatology)**

</div>
