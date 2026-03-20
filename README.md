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
    <td align="center"><b>📊 Health Dashboard</b></td>
    <td align="center"><b>🎙️ AI Voice Check</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_dashboard.png" alt="Dashboard" width="100%"/></td>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_voice.png" alt="Voice Check" width="100%"/></td>
  </tr>
  <tr>
    <td align="center"><b>🗺️ Environmental AQI Map</b></td>
    <td align="center"><b>🏋️ Lung Gym</b></td>
  </tr>
  <tr>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_environment.png" alt="Environment Map" width="100%"/></td>
    <td><img src="https://raw.githubusercontent.com/Shashwatology/BreatheSync/main/docs/screenshot_lung_gym.png" alt="Lung Gym" width="100%"/></td>
  </tr>
</table>

---

## ✨ Core Features

### 🎙️ AI-Powered Vocal Biomarker Analysis
Record a 6-second vowel sound to receive a **Lung Voice Score** — a non-invasive respiratory health metric powered by machine learning (Librosa + Scikit-learn).

### 📊 Predictive Health Dashboard
A real-time overview of your respiratory health, featuring an AI-driven **Digital Twin Forecast** that predicts attack risks based on your history and environment.

### 🗺️ Hyper-Local Environmental Intelligence
Interactive maps providing real-time **AQI (Air Quality Index)** data and personalized health predictions correlated with your local triggers.

### 🏋️ Lung Gym — Therapeutic Breathing Trainer
Guided breathing exercises and the microphone-controlled **Dragon Breather** game to help improve lung capacity and adherence to breathing techniques.

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
