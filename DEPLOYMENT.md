# 🚀 Deployment Guide - GAPLANG

## Persiapan

### 1. Setup Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project" atau "Create a project"
3. Masukkan nama project (contoh: "gaplang")
4. Ikuti wizard setup hingga selesai

### 2. Enable Services

#### Realtime Database

1. Di sidebar, pilih "Build" → "Realtime Database"
2. Klik "Create Database"
3. Pilih location (contoh: asia-southeast1)
4. Pilih "Start in test mode" (akan diganti dengan rules nanti)
5. Klik "Enable"

#### Authentication

1. Di sidebar, pilih "Build" → "Authentication"
2. Klik "Get started"
3. Tab "Sign-in method"
4. Enable "Anonymous" authentication
5. Klik "Save"

### 3. Get Firebase Configuration

1. Di Project Overview (icon gear), klik "Project settings"
2. Scroll ke "Your apps"
3. Klik icon "</>" (Web)
4. Register app dengan nickname (contoh: "gaplang-web")
5. Copy konfigurasi Firebase (firebaseConfig)
6. Paste ke file `.env` dengan format:

```env
VITE_API_KEY=AIzaSy...
VITE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_PROJECT_ID=your-project
VITE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_MESSAGING_SENDER_ID=123456789
VITE_APP_ID=1:123456789:web:...
```

### 4. Update Database Rules

1. Di Realtime Database, tab "Rules"
2. Copy rules dari file `database.rules.json`
3. Paste dan klik "Publish"

Rules yang benar:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": "auth != null",
        ".write": "auth != null && (!data.exists() || data.child('players/player1/id').val() === auth.uid || data.child('players/player2/id').val() === auth.uid)",
        ".indexOn": ["createdAt", "status"]
      }
    }
  }
}
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Buka browser di http://localhost:5173

## Production Build

```bash
# Build untuk production
npm run build

# Preview production build
npm run preview
```

## Deploy ke Firebase Hosting

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login ke Firebase

```bash
firebase login
```

### 3. Initialize Firebase Hosting

```bash
firebase init hosting
```

Jawab pertanyaan:

- What do you want to use as your public directory? → **dist**
- Configure as a single-page app? → **Yes**
- Set up automatic builds and deploys with GitHub? → **No** (atau Yes jika mau CI/CD)
- File dist/index.html already exists. Overwrite? → **No**

### 4. Build dan Deploy

```bash
# Build app
npm run build

# Deploy ke Firebase
firebase deploy --only hosting
```

### 5. Selesai!

Setelah deploy berhasil, akan muncul:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-project.web.app
```

## Deploy ke Platform Lain

### Vercel

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Deploy:

```bash
npm run build
vercel --prod
```

### Netlify

1. Install Netlify CLI:

```bash
npm install -g netlify-cli
```

2. Deploy:

```bash
npm run build
netlify deploy --prod --dir=dist
```

## Environment Variables di Production

### Firebase Hosting

Sudah otomatis dari `.env` saat build

### Vercel

1. Di dashboard Vercel, buka project settings
2. Tab "Environment Variables"
3. Tambahkan satu per satu:
   - `VITE_API_KEY`
   - `VITE_AUTH_DOMAIN`
   - dll.

### Netlify

1. Di dashboard Netlify, buka site settings
2. "Build & deploy" → "Environment"
3. Tambahkan environment variables

## Monitoring & Maintenance

### Check Usage

1. Firebase Console → Usage and billing
2. Monitor:
   - Realtime Database reads/writes
   - Authentication users
   - Hosting bandwidth

### Free Tier Limits

- **Realtime Database**: 100 concurrent connections, 1GB storage, 10GB/month download
- **Authentication**: Unlimited
- **Hosting**: 10GB storage, 360MB/day bandwidth

### Tips Optimisasi

1. Minimize Firebase reads/writes
2. Use Firebase transactions
3. Implement caching strategy
4. Clean up old/abandoned games

## Troubleshooting

### Build Error

```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firebase Deploy Error

```bash
# Re-login
firebase logout
firebase login

# Try deploy again
firebase deploy --only hosting
```

### Environment Variables Not Working

- Pastikan prefix `VITE_` ada
- Restart dev server setelah edit `.env`
- Untuk production, rebuild: `npm run build`

## Custom Domain (Opsional)

1. Firebase Console → Hosting → "Add custom domain"
2. Masukkan domain (contoh: gaplang.com)
3. Follow DNS configuration instructions
4. Tunggu verifikasi (bisa 24-48 jam)

---

**Good luck with your deployment! 🚀**
