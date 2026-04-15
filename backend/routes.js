'use strict';

const express = require('express');
const router = express.Router();
const db = require('./database/models');

// All clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await db.Client.findAll();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plot reservation
router.post('/reserve', async (req, res) => {
  const { clientId, plotId } = req.body;
  try {
    await db.sequelize.query('CALL p_reserve(:c, :p)', {
      replacements: { c: clientId, p: plotId }
    });
    res.json({ message: 'Rezerwacja udana' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove plot reservation
router.post('/remove-reservation', async (req, res) => {
  const { clientId, plotId } = req.body;
  try {
    await db.sequelize.query('CALL p_remove_reservation(:c, :p)', {
      replacements: { c: clientId, p: plotId }
    });
    res.json({ message: 'Rezerwacja usunięta' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add client
router.post('/add-client', async (req, res) => {
  const { name, lastName } = req.body;
    try {
    const newClient = await db.Client.create({ name, last_name: lastName });
    res.json(newClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;