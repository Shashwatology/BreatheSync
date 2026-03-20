# BreatheSync — Breathe Better. Live Better.

BreatheSync is an AI-powered asthma management and respiratory health tracking application.

## Features

- **AQI Monitoring**: Real-time air quality data for your location.
- **AI Health Prediction**: Personalized risk scores based on environmental factors.
- **Voice Check**: AI-powered lung health screening using voice clips.
- **Trigger Map**: Localized visualization of environmental triggers.
- **Breathing Exercises**: Personalized exercises to improve respiratory capacity.

## Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion.
- **Backend**: FastAPI (Python), Librosa (Audio analysis), Scikit-learn.
- **Database/Auth**: Supabase.

## Getting Started

### Backend Setup
1. Navigate to the `breathesync-backend` directory.
2. Initialize and activate a virtual environment.
3. Install dependencies: `pip install -r requirements.txt`.
4. Run the server: `python main.py`.

### Frontend Setup
1. Navigate to the `breathe-better-app` directory.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

## Local Development (Demo Mode)

For local development where cloud authentication (Google OAuth) is not configured, use the **"Try Demo Mode"** button on the login screen to bypass authentication and access all application features.
