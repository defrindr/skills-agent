---
name: project-readability/pr-checklist
---

## PR Checklist

```
[ ] Nama function jelas tanpa komentar penjelasan
[ ] Error message actionable, bukan "Something went wrong"
[ ] Tidak ada variabel bernama: data, res, temp, result, item
[ ] Tidak ada emoji/icons dalam kode
[ ] Response pakai ApiSuccess/ApiError envelope
[ ] Input external divalidasi dengan Zod
[ ] Error pakai AppError, bukan Error polos
[ ] No AI words: seamlessly, robust, leverage, utilize
[ ] Fungsi ≤ 30 baris, tidak ada nested if > 2 level
[ ] Test names bisa dibaca non-engineer
[ ] Helper baru di shared/ sudah lulus 3 questions DRY
[ ] Fungsi dengan > 3 parameter pakai object, bukan positional
[ ] .env.example updated kalau ada env var baru
[ ] Dockerfile multi-stage
[ ] Error tak terduga masuk logger/Sentry
[ ] Request ID wajib di tiap response
```
