require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ── CORS: izinkan semua origin (penting untuk Vercel + file lokal) ──
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // handle preflight request

app.use(express.json());

// ── Supabase Client ────────────────────────────────────────
let supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Auto-fix URL jika terlanjur ditambah /rest/v1/ di Vercel env
if (supabaseUrl && supabaseUrl.endsWith('/rest/v1/')) {
    supabaseUrl = supabaseUrl.replace('/rest/v1/', '');
} else if (supabaseUrl && supabaseUrl.endsWith('/rest/v1')) {
    supabaseUrl = supabaseUrl.replace('/rest/v1', '');
}

const supabase    = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.warn('[WARN] SUPABASE_URL / SUPABASE_KEY belum diisi.');
}

// ── POST /api/contact ──────────────────────────────────────
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            error: 'Field name, email, dan message wajib diisi.'
        });
    }

    console.log('[PESAN MASUK]', { name, email, message });

    if (!supabase) {
        return res.status(500).json({
            success: false,
            error: 'Database belum dikonfigurasi. Set SUPABASE_URL dan SUPABASE_KEY di Vercel Environment Variables.'
        });
    }

    const { error } = await supabase
        .from('messages')
        .insert([{ name, email, message }]);

    if (error) {
        console.error('[ERROR] Supabase:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Gagal menyimpan pesan: ' + error.message
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Pesan berhasil dikirim!'
    });
});

// ── GET /api/health ────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        supabase: supabase ? 'connected' : 'not configured'
    });
});

// ── Start server (lokal only, Vercel pakai module.exports) ──
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`\n✅ Server berjalan di http://localhost:${PORT}`);
        console.log(`   Supabase: ${supabase ? 'Terhubung' : 'Belum dikonfigurasi'}\n`);
    });
}

// WAJIB untuk Vercel serverless
module.exports = app;
