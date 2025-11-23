# 🎮 GAPLANG - Game Tebak Kata Multiplayer tes

Game tebak kata berbasis web yang dapat dimainkan oleh 2 orang secara berjauhan menggunakan Firebase Realtime Database.

## ✨ Fitur

- 🎯 Multiplayer real-time untuk 2 pemain
- 🔗 Link sharing untuk invite teman
- ✏️ Fase membuat kata dengan hint (30 detik)
- 🤔 Fase menebak dengan grid huruf interaktif (90 detik)
- 💡 Sistem hint dengan pengurangan skor
- 🏆 10 ronde permainan dengan scoring system
- 📱 Mobile-first responsive design
- 🎨 UI kid-friendly dengan animasi menarik

## 🚀 Tech Stack

- **Frontend**: React + Vite
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Anonymous Auth
- **Styling**: CSS3 dengan animasi
- **Routing**: React Router DOM

## 📦 Instalasi

1. Install dependencies:

```bash
npm install
```

2. Setup Firebase:

   - Buat project di [Firebase Console](https://console.firebase.google.com/)
   - Enable Realtime Database
   - Enable Anonymous Authentication
   - Copy konfigurasi Firebase ke file `.env`

3. Konfigurasi `.env`:

```env
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_auth_domain
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_storage_bucket
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_APP_ID=your_app_id
```

4. Jalankan development server:

```bash
npm run dev
```

## 🎮 Cara Bermain

1. **Buat Game**

   - Masukkan nama kamu
   - Klik "Buat Game Baru"
   - Share link ke teman

2. **Join Game**

   - Akses link yang di-share
   - Masukkan nama kamu
   - Klik "Bergabung"

3. **Ready**

   - Kedua pemain klik tombol "Ready"
   - Sistem akan mengacak siapa yang main pertama

4. **Gameplay**

   - **Membuat Kata**: Input kata dan hint (30 detik)
   - **Menebak**: Klik huruf dari grid untuk mengisi jawaban (90 detik)
   - **Hint**: Gunakan hint untuk bantuan (-10 poin per hint)

5. **Penilaian**
   - Skor dasar: 100 poin per kata
   - Pengurangan: -10 poin per hint
   - Total: 10 ronde (5 pertanyaan per pemain)

## 📁 Struktur Project

```
gaplang/
├── src/
│   ├── components/
│   │   ├── CreateWordPhase.jsx      # Komponen fase membuat kata
│   │   ├── GuessWordPhase.jsx       # Komponen fase menebak
│   │   └── WaitingPhase.jsx         # Komponen waiting screen
│   ├── pages/
│   │   ├── Home.jsx                 # Halaman utama
│   │   ├── Lobby.jsx                # Ruang tunggu
│   │   ├── Game.jsx                 # Halaman game utama
│   │   └── GameOver.jsx             # Halaman hasil akhir
│   ├── services/
│   │   ├── firebase.js              # Konfigurasi Firebase
│   │   └── gameService.js           # Service untuk game logic
│   ├── App.jsx                      # Root component dengan routing
│   └── main.jsx                     # Entry point
├── .env                             # Environment variables
└── package.json
```

## 🎨 Design Features

- **Mobile-First**: Dioptimalkan untuk layar mobile
- **Responsive**: Tampil sempurna di tablet dan desktop
- **Kid-Friendly**: Warna cerah dan font bubble
- **Animasi**: Smooth transitions dan feedback visual
- **Intuitive UI**: Mudah dipahami tanpa instruksi panjang

## 🔧 Development

```bash
# Development
npm run dev

# Build untuk production
npm run build

# Preview production build
npm run preview
```

## 🚀 Deployment

### Firebase Hosting

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login ke Firebase:

```bash
firebase login
```

3. Inisialisasi Firebase:

```bash
firebase init
```

4. Build dan deploy:

```bash
npm run build
firebase deploy
```

## 📝 Firebase Database Rules

Tambahkan security rules di Firebase Console:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": "auth != null",
        ".write": "auth != null && (
          !data.exists() ||
          data.child('players/player1/id').val() === auth.uid ||
          data.child('players/player2/id').val() === auth.uid
        )"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Firebase Connection Error

- Pastikan `.env` sudah dikonfigurasi dengan benar
- Cek Firebase project settings
- Pastikan Realtime Database sudah enabled

### Game Not Found

- Pastikan game ID valid
- Cek koneksi internet
- Cek Firebase console untuk data

### Player Can't Join

- Pastikan game belum penuh (max 2 players)
- Refresh halaman dan coba lagi
- Cek Firebase security rules

## 📄 License

MIT License - Feel free to use this project for learning purposes!

## 👨‍💻 Credits

Developed with ❤️ for fun and learning!

---

**Selamat Bermain! 🎉**
