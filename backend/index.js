'use strict';

const express = require('express');
const cors = require('cors');
const db = require('./database/models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

async function start() {
  try {
    await db.sequelize.authenticate();
    console.log('[startup] Database connection OK.');

    await db.sequelize.sync();
    console.log('[startup] Sequelize sync complete.');

    app.listen(PORT, () => {
      console.log(`[startup] API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[startup] Failed to start app:', error.message);
    process.exit(1);
  }
}

start();
