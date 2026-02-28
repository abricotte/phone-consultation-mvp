require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const consultantRoutes = require('./routes/consultants');
const walletRoutes = require('./routes/wallets');
const sessionRoutes = require('./routes/sessions');
const webhookRoutes = require('./routes/webhook');
const callRoutes = require('./routes/calls');

const app = express();
const PORT = process.env.PORT || 5000;

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.1.0', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
