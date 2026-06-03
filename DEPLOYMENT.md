# 🚀 Deployment Guide - Cafe Billing System

## Option 1: Railway (Backend) + Vercel (Frontend) — Recommended

### Backend → Railway
1. Push project to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select the `backend` folder as root
4. Add all environment variables from `.env.example`
5. Railway auto-detects Node.js and deploys

### Frontend → Vercel
1. Go to vercel.com → New Project → Import from GitHub
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-railway-url.up.railway.app/api`
4. Deploy

---

## Option 2: Render (Backend) + Netlify (Frontend)

### Backend → Render
1. New Web Service → Connect GitHub repo
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables

### Frontend → Netlify
1. New site → Import from GitHub
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`
5. Add env var: `VITE_API_URL`

---

## Option 3: VPS (Full Control)

```bash
# On your server
git clone <repo-url>

# Backend
cd cafe-system/backend
npm install
cp .env.example .env
nano .env   # fill in your values
npm run seed
pm2 start server.js --name cafe-backend

# Frontend
cd ../frontend
npm install
cp .env.example .env
nano .env   # set VITE_API_URL
npm run build
# Serve dist/ with nginx

# Nginx config
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## MongoDB Atlas (Cloud Database)

1. Go to cloud.mongodb.com
2. Create free M0 cluster
3. Create database user
4. Whitelist your server IP (or 0.0.0.0/0 for anywhere)
5. Get connection string → paste as `MONGO_URI` in .env

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/cafe-billing
```

---

## Environment Variables Checklist

| Variable | Required | Notes |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas or local |
| `JWT_SECRET` | ✅ | Use a long random string |
| `CLIENT_URL` | ✅ | Frontend URL (no trailing slash) |
| `CLOUDINARY_*` | ⚠️ Optional | For image uploads |
| `EMAIL_*` | ⚠️ Optional | For password reset emails |
| `PORT` | ❌ | Default: 5000 |

## Generate secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
