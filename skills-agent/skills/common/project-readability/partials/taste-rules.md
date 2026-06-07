---
name: project-readability/taste-rules
---

## Taste Rules

Prinsip ini ada di atas semua section lain. Kalau ada konflik, taste rules menang.

1. **Jangan bikin abstraction sebelum ada pola yang terbukti berulang minimal 3x.** Abstraksi prematur lebih mahal dari duplikasi.
2. **Prefer boring code over clever code.** One-liner yang butuh 10 detik dipahami lebih buruk dari 5 baris yang langsung jelas.
3. **Kalau nama function butuh komentar, namanya belum cukup jelas.**
4. **Error message harus bantu user/developer melakukan langkah berikutnya.** `"Order cannot be cancelled because it's already shipped."` bukan `"Something went wrong"`.
5. **Optimasi untuk pembaca berikutnya, bukan untuk baris count.** Kalau ragu, pilih yang lebih mudah di-delete.
6. **Jangan bikin `shared/utils/` jadi tempat sampah.** Helper yang relevan cuma satu fitur → taruh di fitur itu.

## Anti-AI Generated Patterns

- **No icons/emoji in code or comments.** Plain text, professional.
- **Match complexity to project scale.** MVP = minimal abstraction. Startup = feature-first + service layer. Enterprise = baru consider DDD.
- **Variable/function names harus spesifik, verb + noun.** `fetchUserOrderHistory()` bukan `getData()`.
- **No abstraction sebelum pola berulang 3x.** Direct implementation dulu, baru extract kalau terbukti perlu.
- **No verbose JSDoc untuk hal obvious.** JSDoc cuma untuk context penting (side effects, gotchas).
- **No placeholder comments.** TODO harus spesifik + assignee + deadline.
- **No AI-marketing words:** seamlessly, robust, leverage, utilize, facilitate, comprehensive, cutting-edge.
