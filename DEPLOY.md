# Deploy Frontend (Vercel)

Langkah singkat untuk deploy `fr-p1` (Next.js) ke Vercel:

1. Pastikan `package.json` di `fr-p1` memiliki script build:
```
"build": "next build",
"start": "next start -p $PORT"
```
2. Push repo ke GitHub.
3. Di Vercel: "New Project" → Import Git Repository → pilih repo dan folder `fr-p1` (jika monorepo, pilih path).
4. Set Environment Variables di Vercel:
   - `NEXT_PUBLIC_API_URL` = URL ke backend (mis. `https://your-backend.up.railway.app/api`)
   - variabel lain yang diperlukan (mis. auth keys).
5. Build & Deploy — Vercel otomatis menjalankan `npm install` dan `npm run build`.

Catatan:
- Jika monorepo, atur Root Directory ke `fr-p1` saat meng-import project di Vercel.
- Untuk preview deploy gunakan `vercel --prod` atau via UI.
