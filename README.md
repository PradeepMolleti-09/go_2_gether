# 🗺️ Go2Gether: Premium Real-Time Trip Coordination

Go2Gether is a high-performance, real-time group travel coordination platform built on the MERN stack. Designed with a sleek, monochrome Google Maps-inspired aesthetic, it provides seamless location tracking, group security, and media sharing for modern travelers.

---

## 🚀 Pro-Features

- **Real-Time Sync**: Live location updates and group chat powered by **Socket.io**.
- **Neural Map Interface**: Custom monochrome map styles with glassmorphism UI elements.
- **Safety Protocol**: One-tap **SOS alerts** and automated safety notifications.
- **Trip Lifecycle Management**: Dynamic trip start/end, checkpoint creation, and routing.
- **Smart Media Gallery**: Real-time photo sharing backed by **Cloudinary**.
- **Digital Souvenirs**: Auto-generated **Trip Reports (PDF)** with distance and checkpoint stats.
- **Privacy First**: Secure authentication via **Google OAuth** and JWT.

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Socket.io Client.
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.io, Cloudinary, PDFKit.
- **Infrastructure**: JWT Auth, Google Maps Javascript API, Places API.

---

## 🛠️ Local Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Cloud Console Project (with Maps & OAuth enabled)
- Cloudinary Account

### 2. Installation
```bash
# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the **root** folder (or separate `.env` files in `backend` and `frontend`).

**Backend Variables (`backend/.env`):**
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/go2gether
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

**Frontend Variables (`frontend/.env`):**
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_API_BASE_URL=http://localhost:4000
```

### 4. Running Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 🌐 Deployment Guide

### Backend: [Render](https://render.com)
1. **New Web Service**: Connect your GitHub repository.
2. **Root Directory**: Select `backend`.
3. **Environment**: Select `Node`.
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm start`
6. **Env Vars**: Add all variables from the Backend section above. 
   *Note: Set `CLIENT_ORIGIN` to your Vercel URL.*

### Frontend: [Vercel](https://vercel.com)
1. **New Project**: Import your repository.
2. **Root Directory**: Select `frontend`.
3. **Framework Preset**: `Vite`.
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Env Vars**: 
   - `VITE_GOOGLE_MAPS_API_KEY`: Your key.
   - `VITE_API_BASE_URL`: Your **Render Web Service URL**.

---

## 📄 License
Distributed under the MIT License. Developed by Google Deepmind Advanced Agentic Coding team.
