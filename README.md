# 🎓 Campus Placement Portal & Recruitment Analytics System

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://share.streamlit.io)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Local%20%2F%20Atlas-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An enterprise-ready, dual-interface **Campus Placement Portal**:
1. **Interactive Streamlit Web Application** (`streamlit_app.py` / `app.py`) — Data-driven placement analytics, candidate talent pool, active campus drive eligibility checker, and AI-powered placement chance & salary predictor. Ready for **1-click deployment on Streamlit Community Cloud**.
2. **Full-Stack MERN Portal** (`client/` & `server/`) — Role-based web portal with separate dashboards for Students, Recruiters/Companies, and College Administrators, with automated email notifications, mock test arena, and resume profile management.

---

## 🌟 Key Features

### 📊 Streamlit Web App (`streamlit_app.py`)
- **Executive Analytics Dashboard:** Placement rate %, average and highest CTC (LPA), department performance charts, and in-demand tech skill trends.
- **AI Placement Probability & Salary Predictor:** Input academic criteria (CGPA, backlogs, internships, projects, DSA proficiency) to get instant percentage odds, CTC tier estimation, and personalized preparation advice.
- **Candidate Talent Pool:** Filterable directory with skills tags, CGPA thresholds, and social profile links.
- **Active Campus Drives & Eligibility Checker:** Real-time eligibility evaluation against minimum CGPA requirements with simulated application submission.
- **Aptitude & Technical Practice Arena:** Interactive mock tests with instant score reports and solution explanations.
- **MongoDB Sync & Demo Mode:** Works seamlessly connected to local/remote MongoDB, with zero-setup fallback dataset for instant cloud demo.

### 🌐 Full-Stack MERN Web Portal
- **Student Dashboard:** Academic profile completion, active drive applications, resume management, and aptitude practice.
- **Recruiter Dashboard:** Post job openings, view student applications, shortlist or select candidates.
- **Admin Dashboard:** Approve registrations, monitor department placement statistics, manage drives.
- **Auto-fallback Database Connection:** Connects to MongoDB Atlas or automatically falls back to local MongoDB (`mongodb://127.0.0.1:27017/placement_portal`).

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB** (Local MongoDB Server or MongoDB Atlas free cluster)

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/abhayraj04/Campus_Placement_Portal.git
cd Campus_Placement_Portal
```

Install Node.js dependencies:
```bash
npm run install:all
```

Install Python dependencies for Streamlit:
```bash
pip install -r requirements.txt
```

### 3. Seed Sample Database
Populate your database with sample students, recruiters, admin, and job drives:
```bash
npm run seed
```

**Default Test Accounts (Password for all: `Password@123`):**
- **Admin:** `admin@placement.edu`
- **Recruiter:** `careers@google.com`
- **Student 1:** `aarav.sharma@placement.edu`
- **Student 2:** `priya.patel@placement.edu`
- **Student 3:** `rohan.gupta@placement.edu`

---

## 🖥️ Running the Applications

### Option A: Run the Streamlit Application (Recommended for instant analytics)
```bash
npm run streamlit
# Or directly:
streamlit run streamlit_app.py
```
Open **[http://localhost:8501](http://localhost:8501)** in your browser.

---

### Option B: Run the Full-Stack MERN Application
```bash
npm run dev
```
This runs both:
- **Backend API Server:** [http://localhost:5000](http://localhost:5000)
- **React Frontend (Vite):** [http://localhost:5173](http://localhost:5173)

Alternatively on Windows, you can double-click `start-app.bat` to launch both servers.

---

## ☁️ Deployment Guide

### 1. Deploying to Streamlit Community Cloud (Free & 1-Click)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Ready for Streamlit Cloud"
   git push origin main
   ```
2. Navigate to **[share.streamlit.io](https://share.streamlit.io)** and log in with GitHub.
3. Click **New app** and configure:
   - **Repository:** `abhayraj04/Campus_Placement_Portal`
   - **Branch:** `main`
   - **Main file path:** `streamlit_app.py` (or `app.py`)
4. *(Optional)* Under **Advanced settings**, set the `MONGO_URI` secret to your MongoDB Atlas connection string.
5. Click **Deploy!** Your placement portal analytics will be live worldwide.

---

### 2. Deploying Frontend to Vercel
1. Import this repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `client` (or leave root with the included `vercel.json`).
3. Set Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://your-backend.onrender.com/api`)
4. Click **Deploy**.

---

### 3. Deploying Backend to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: Random secure string
   - `CLIENT_URL`: Your Vercel frontend URL
   - `ADMIN_CREATION_TOKEN`: Your secret admin token

---

## 📁 Project Structure

```
Campus-Placement-Portal/
├── .streamlit/
│   └── config.toml          # Streamlit dark theme configuration
├── streamlit_app.py         # Main Streamlit web application
├── app.py                   # Streamlit cloud entrypoint alias
├── requirements.txt         # Python dependencies for Streamlit
├── package.json             # Root NPM scripts (start, dev, seed, streamlit)
├── .env.example             # Environment template
├── client/                  # React 19 + Vite frontend
│   ├── src/
│   │   ├── pages/           # Student, Company, Admin dashboards
│   │   ├── components/      # UI components & progress bars
│   │   └── services/        # Axios API client
│   └── vite.config.js
└── server/                  # Node.js + Express backend
    ├── controllers/         # Auth, jobs, admin, applications logic
    ├── models/              # User, Job, Application, Drive schemas
    ├── routes/              # Express API route endpoints
    ├── seedData.js          # Database seeding script
    └── server.js            # Express server entrypoint
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.
