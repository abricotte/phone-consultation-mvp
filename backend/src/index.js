require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const consultantRoutes = require('./routes/consultants');
const walletRoutes = require('./routes/wallets');
const sessionRoutes = require('./routes/sessions');
const webhookRoutes = require('./routes/webhook');
const callRoutes = require('./routes/calls');
const configRoutes = require('./routes/config');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Derrière le proxy Railway : nécessaire pour que le rate limiting
// identifie la vraie IP cliente (X-Forwarded-For)
app.set('trust proxy', 1);

// En-têtes de sécurité (HSTS, nosniff, frame-deny, etc.)
app.use(helmet());

app.use(cors());

// Le webhook Stripe a besoin du body brut, il doit être monté AVANT express.json()
app.use('/api/webhook', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Pour les callbacks Twilio

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/consultants', consultantRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    // Drapeaux booléens uniquement — aucun secret exposé
    config: {
      supabase: !!process.env.SUPABASE_URL,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      twilio: !!process.env.TWILIO_ACCOUNT_SID,
      backendUrl: !!process.env.BACKEND_URL,
      frontendUrl: !!process.env.FRONTEND_URL,
      nodeEnv: process.env.NODE_ENV || 'non défini',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
