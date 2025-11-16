# Firebase Rules Update

Untuk mengatasi error PERMISSION_DENIED, update Firebase Realtime Database Rules dengan rules berikut:

## Cara Update:

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Sidebar → Realtime Database → Rules
4. Replace dengan rules berikut
5. Klik "Publish"

## Rules (Lebih Permissive untuk Development):

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": "auth != null",
        ".write": "auth != null",
        ".indexOn": ["createdAt", "status"]
      }
    }
  }
}
```

## Rules (Production - Lebih Strict):

Setelah testing selesai, gunakan rules yang lebih strict:

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
        )",
        "players": {
          "player1": {
            ".write": "auth != null && (
              !data.exists() || 
              data.child('id').val() === auth.uid
            )"
          },
          "player2": {
            ".write": "auth != null && (
              !data.exists() || 
              data.child('id').val() === auth.uid ||
              root.child('games').child($gameId).child('players').child('player1').child('id').val() === auth.uid
            )"
          }
        },
        ".indexOn": ["createdAt", "status"]
      }
    }
  }
}
```

## Catatan:

- Rules pertama (development) memperbolehkan semua authenticated user untuk read/write
- Rules kedua (production) membatasi write hanya untuk pemain yang terlibat
- Pastikan Anonymous Authentication sudah enabled di Firebase Console
