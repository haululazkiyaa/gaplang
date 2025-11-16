# Instruksi Pembuatan Game Tebak Kata Multiplayer Real-time

## Deskripsi Umum

Buat game tebak kata berbasis web yang dapat dimainkan oleh 2 orang secara berjauhan menggunakan Firebase Realtime Database. Game ini memiliki konsep turn-based dimana pemain bergantian membuat kata dan menebak.

## Spesifikasi Teknis

### Technology Stack

- **Frontend**: React
- **Backend/Database**: Firebase Realtime Database
- **Authentication**: Firebase Anonymous Auth (untuk identifikasi pemain)

### Fitur Utama

#### 1. Sistem Lobby & Matchmaking

- **Player 1 (Host)**:

  - Input nama pemain
  - Klik tombol "Mulai Bermain" / "Create Game"
  - Sistem generate link unik (menggunakan Firebase push key atau custom ID)
  - Tampilkan link yang bisa di-copy/share
  - Status: "Menunggu pemain kedua..."

- **Player 2 (Guest)**:
  - Akses melalui link yang di-share
  - Input nama pemain
  - Klik tombol "Bergabung" / "Join Game"
  - Status: "Terhubung! Menunggu kedua pemain ready..."

#### 2. Ready System

- Kedua pemain harus klik tombol "Ready"
- Ketika kedua pemain ready:
  - Sistem mengacak siapa yang main pertama (random)
  - Tampilkan notifikasi: "Permainan dimulai! [Nama Pemain] giliran pertama"
  - Mulai ronde 1

#### 3. Gameplay - Fase Membuat Kata (30 detik)

**Pemain yang Giliran Membuat:**

- Input field untuk kata (tidak case-sensitive)
- Input field untuk hint/deskripsi
- Tombol "Simpan"
- Timer countdown 30 detik (visual countdown)
- Jika waktu habis, kata otomatis di-submit (atau skip jika kosong)

**Pemain yang Menunggu:**

- Tampilan: "Pemain [Nama] sedang membuat pertanyaan..."
- Loading animation atau countdown timer

#### 4. Gameplay - Fase Menebak (90 detik)

**Pemain yang Menebak:**

- **Display Area**:
  - Hint/deskripsi di bagian atas
  - Kotak input sebanyak jumlah huruf kata (underscore atau kotak kosong)
  - Grid huruf acak di bawah (ukuran random, misalnya 4x4, 5x5, atau 6x4)
- **Mekanisme Grid Huruf**:

  - Generate grid berisi huruf-huruf (semua huruf dari kata target + huruf random tambahan)
  - Huruf disusun acak dalam grid
  - Huruf bisa diklik
  - Saat huruf diklik, masuk ke kotak input berikutnya yang kosong
  - Bisa backspace/hapus huruf yang salah
  - Huruf yang sudah digunakan bisa di-grey out atau tetap bisa diklik (sesuai preferensi)

- **Tombol Hint**:

  - "Gunakan Hint" button
  - Saat diklik: tampilkan 1 huruf yang benar di posisi yang tepat
  - Kurangi skor -10 poin
  - Bisa digunakan berulang kali

- **Timer**: 90 detik (1.5 menit) countdown
- **Auto-check**: Ketika semua kotak terisi, otomatis cek jawaban
- **Feedback**:
  - Benar: Tampilkan animasi sukses, tambah skor
  - Salah: Tampilkan notifikasi, bisa coba lagi sampai waktu habis

**Pemain yang Menunggu:**

- Tampilan: "Pemain [Nama] sedang menebak..."
- Progress indicator

#### 5. Sistem Scoring

- **Skor Dasar per Kata**: 100 poin
- **Pengurangan Skor**:
  - Setiap hint digunakan: -10 poin
  - Bonus waktu: Sisa waktu × 1 poin (opsional)
- **Jika Gagal Menebak**: 0 poin untuk ronde tersebut

#### 6. Sistem Ronde

- Total: 10 ronde
- Masing-masing pemain membuat 5 kata dan menebak 5 kata
- Giliran bergantian setiap ronde:

  - Ronde 1: Player A buat, Player B tebak
  - Ronde 2: Player B buat, Player A tebak
  - Ronde 3: Player A buat, Player B tebak
  - Dan seterusnya...

- **Progress Indicator**: Tampilkan "Ronde 1/10", "Ronde 2/10", dst.
- **Score Display**: Tampilkan skor real-time kedua pemain

#### 7. End Game & Winner

- Setelah ronde 10 selesai:
  - Hitung total skor kedua pemain
  - Tampilkan screen "Game Over"
  - Tampilkan pemenang dengan animasi celebration
  - Tampilkan breakdown skor:
    - Total pertanyaan berhasil dijawab
    - Total waktu rata-rata
    - Total hint digunakan
  - Tombol "Main Lagi" (create new game)
  - Tombol "Kembali ke Home"

## Desain UI/UX

### Prinsip Desain

- **Mobile First**: Optimize untuk layar mobile (320px - 480px)
- **Responsive**: Tampil baik di tablet dan desktop
- **Kid-Friendly**: Warna cerah, font besar, animasi menarik
- **Game-like**: Mirip game edukasi anak

### Color Palette (Saran)

- Primary: Warna cerah seperti biru cerah (#4A90E2) atau hijau lime (#7ED321)
- Secondary: Orange (#F5A623) atau pink (#FF6B9D)
- Success: Hijau (#50C878)
- Warning: Kuning (#FFD700)
- Error: Merah lembut (#FF6B6B)
- Background: Putih atau gradient lembut

### Typography

- Font: Rounded/bubble fonts seperti "Nunito", "Fredoka One", "Quicksand"
- Size: Minimum 16px untuk body text, 24px+ untuk judul

### Komponen UI

#### 1. Button Styles

- Border-radius: Rounded (15-25px)
- Shadow: Soft shadow untuk depth
- Hover effect: Scale up sedikit (transform: scale(1.05))
- Active state: Jelas dan responsif

#### 2. Input Fields

- Border-radius: Rounded
- Large touch targets (min 44px height)
- Clear placeholder text
- Visual feedback saat fokus

#### 3. Timer Display

- Large dan prominent
- Color change saat waktu menipis (hijau → kuning → merah)
- Animasi pulse saat < 10 detik

#### 4. Grid Huruf

- Kotak dengan aspect ratio 1:1
- Gap antar huruf: 8-12px
- Font size besar dan jelas
- Animasi saat diklik (scale/bounce)
- Border atau shadow untuk kedalaman

#### 5. Animasi

- Transisi halus antar state (0.3s ease)
- Confetti atau particles saat menang
- Shake animation saat salah
- Bounce animation untuk tombol
- Smooth fade in/out untuk perubahan screen

#### 6. Loading States

- Spinner atau skeleton screens
- Pesan status yang jelas
- Progress bars untuk download/upload

### Layout Sections

#### Home Screen

```
+---------------------------+
|        LOGO/TITLE         |
|    (Gambar menarik)       |
+---------------------------+
|                           |
|    [Input Nama]          |
|                           |
|    [Tombol: Buat Game]   |
|    [Tombol: Join Game]   |
|                           |
+---------------------------+
```

#### Waiting Lobby

```
+---------------------------+
|     Menunggu Pemain...    |
+---------------------------+
|   Player 1: [Nama] ✓      |
|   Player 2: [Waiting...]  |
+---------------------------+
|   Link:                   |
|   [https://...] [Copy]    |
+---------------------------+
|   [Tombol: Ready]         |
+---------------------------+
```

#### Game Screen - Membuat Kata

```
+---------------------------+
|  Ronde 1/10 | Waktu: 0:30 |
|  Skor: P1[0] | P2[0]      |
+---------------------------+
|  Giliran: [Nama Anda]     |
+---------------------------+
|  [Input: Masukkan kata]   |
|                           |
|  [Textarea: Hint/Desc]    |
|                           |
|  [Tombol: Simpan]         |
+---------------------------+
```

#### Game Screen - Menebak

```
+---------------------------+
|  Ronde 2/10 | Waktu: 1:30 |
|  Skor: P1[100] | P2[0]    |
+---------------------------+
|  Hint: [Deskripsi...]     |
+---------------------------+
|  Jawaban:                 |
|  [_] [_] [_] [_] [_]      |
+---------------------------+
|  Grid Huruf:              |
|  [G] [A] [L] [O] [N]      |
|  [T] [R] [M] [I] [P]      |
|  [S] [E] [U] [K] [W]      |
+---------------------------+
|  [Tombol: Gunakan Hint]   |
|  (-10 poin)               |
+---------------------------+
```

#### Game Over Screen

```
+---------------------------+
|      🎉 GAME OVER 🎉      |
+---------------------------+
|   Pemenang: [Nama]        |
|   Skor: [500]             |
+---------------------------+
|   Detail:                 |
|   Player 1: [450]         |
|   - Benar: 4/5            |
|   - Hint: 3x              |
|                           |
|   Player 2: [500]         |
|   - Benar: 5/5            |
|   - Hint: 0x              |
+---------------------------+
|   [Main Lagi] [Home]      |
+---------------------------+
```

## Firebase Structure

### Database Schema

```json
{
  "games": {
    "gameId123": {
      "createdAt": 1234567890,
      "status": "waiting|ready|playing|finished",
      "currentRound": 1,
      "currentTurn": "player1|player2",
      "totalRounds": 10,

      "players": {
        "player1": {
          "id": "uid1",
          "name": "Budi",
          "ready": true,
          "score": 100,
          "isHost": true
        },
        "player2": {
          "id": "uid2",
          "name": "Ani",
          "ready": true,
          "score": 150,
          "isHost": false
        }
      },

      "rounds": {
        "round1": {
          "wordMaker": "player1",
          "guesser": "player2",
          "word": "galon",
          "hint": "alat untuk menampung air minum",
          "startTime": 1234567890,
          "endTime": 1234567980,
          "guessedWord": "galon",
          "hintsUsed": 1,
          "score": 90,
          "status": "completed|inProgress|skipped"
        },
        "round2": {
          "wordMaker": "player2",
          "guesser": "player1",
          "word": "komputer",
          "hint": "alat elektronik untuk bekerja",
          "startTime": 1234567990,
          "status": "inProgress"
        }
      },

      "currentWord": {
        "word": "galon",
        "hint": "alat untuk menampung air minum",
        "gridSize": "4x4",
        "letters": [
          "G",
          "A",
          "L",
          "O",
          "N",
          "T",
          "R",
          "M",
          "I",
          "P",
          "S",
          "E",
          "U",
          "K",
          "W",
          "X"
        ],
        "timeLeft": 85
      }
    }
  }
}
```

### Security Rules (contoh)

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

## Implementasi Firebase Real-time

### 1. Inisialisasi Firebase

```javascript
// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();
```

### 2. Listener Real-time

- Gunakan `.on('value', callback)` untuk mendengarkan perubahan
- Update UI secara real-time saat data berubah
- Handle disconnection dengan `onDisconnect()`

### 3. Game State Management

- Monitor `games/{gameId}/status`
- Monitor `games/{gameId}/currentRound`
- Monitor `games/{gameId}/currentWord`
- Update UI berdasarkan perubahan

## Fitur Tambahan (Opsional)

1. **Sound Effects**:

   - Klik huruf
   - Jawaban benar/salah
   - Timer warning
   - Victory sound

2. **Haptic Feedback** (mobile):

   - Vibration saat klik
   - Vibration saat salah/benar

3. **Chat** (sederhana):

   - Quick reactions (emoji)
   - Status pemain (typing...)

4. **History/Statistics**:

   - Simpan riwayat game
   - Leaderboard lokal

5. **Avatar**:

   - Pilih avatar/icon untuk pemain
   - Display di UI

6. **Share Result**:
   - Screenshot hasil
   - Share ke social media

## Testing Checklist

- [ ] Test di berbagai device (mobile, tablet, desktop)
- [ ] Test di berbagai browser (Chrome, Safari, Firefox)
- [ ] Test koneksi lambat/terputus
- [ ] Test edge cases (nama kosong, timeout, refresh halaman)
- [ ] Test concurrent games (multiple games berjalan bersamaan)
- [ ] Test input validation (kata dengan spasi, angka, karakter khusus)
- [ ] Test timer accuracy
- [ ] Test scoring calculation
- [ ] Test Firebase security rules
- [ ] Test responsive design di berbagai ukuran layar

## Deployment

1. Build project
2. Setup Firebase Hosting
3. Deploy ke Firebase: `firebase deploy`
4. Test production URL
5. Monitor Firebase usage (Realtime Database reads/writes)

## Error Handling

- Koneksi internet terputus
- Firebase quota exceeded
- Player disconnect mid-game
- Browser refresh
- Invalid input
- Timeout scenarios

## Performance Optimization

- Minimize Firebase reads/writes
- Use Firebase transactions untuk atomic updates
- Implement debouncing untuk rapid inputs
- Lazy load assets
- Optimize images
- Minify CSS/JS

---

## Referensi & Resources

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Realtime Database: https://firebase.google.com/docs/database
- CSS Animation Libraries: Animate.css, GSAP
- Icon Libraries: Font Awesome, Material Icons
- Sound Effects: freesound.org

---

**Catatan Penting**:

- Pastikan handle semua edge cases
- UI harus intuitif tanpa instruksi panjang
- Performance harus smooth di low-end devices
- Testing menyeluruh sebelum launch
- Monitor Firebase costs (Realtime Database usage)

**Good Luck! 🚀**
