require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase    = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.warn('[WARN] SUPABASE_URL / SUPABASE_KEY belum diisi di .env');
    console.warn('[WARN] Pesan yang masuk hanya akan ditampilkan di console.');
}

// ── POST /api/contact ─────────────────────────────────────
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    // Validasi field wajib
    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            error: 'Field name, email, dan message wajib diisi.'
        });
    }

    console.log('\n[PESAN MASUK]');
    console.log('  Nama   :', name);
    console.log('  Email  :', email);
    console.log('  Pesan  :', message);

    // Jika Supabase belum dikonfigurasi, tetap berhasil (mode dev)
    if (!supabase) {
        console.log('[DEV MODE] Pesan diterima tapi tidak disimpan ke database.');
        return res.status(200).json({
            success: true,
            message: 'Pesan berhasil dikirim! (Dev mode — konfigurasi Supabase untuk menyimpan ke database)'
        });
    }

    // Insert ke tabel "messages" di Supabase
    const { error } = await supabase
        .from('messages')
        .insert([{ name, email, message }]);

    if (error) {
        console.error('[ERROR] Supabase:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Gagal menyimpan pesan ke database.'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Pesan berhasil dikirim!'
    });
});

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        supabase: supabase ? 'connected' : 'not configured'
    });
});

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`   Supabase: ${supabase ? 'Terhubung' : 'Belum dikonfigurasi (dev mode)'}\n`);
});
