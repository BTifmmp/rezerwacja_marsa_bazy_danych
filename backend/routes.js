"use strict";

const express = require("express");
const router = express.Router();
const db = require("./database/models");

//////// CLIENTS

// All clients
router.get("/clients", async (req, res) => {
  try {
    const clients = await db.Client.findAll();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single client
router.get("/clients/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await db.Client.findByPk(clientId);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Client summary
router.get("/client-summary/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await db.sequelize.query(
      `
      SELECT * FROM v_client_summary WHERE client_id = :id
      `,
      { replacements: { id: clientId } },
    );
    res.json(client[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update client
router.patch("/clients/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const { name, lastName, balance } = req.body;
    const client = await db.Client.findByPk(clientId);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    await client.update({
      ...(name !== undefined ? { name } : {}),
      ...(lastName !== undefined ? { last_name: lastName } : {}),
      ...(balance !== undefined ? { balance } : {}),
    });

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//////// PLOTS

// All available plots
router.get("/plots", async (req, res) => {
  try {
    const plots = await db.sequelize.query(`SELECT * FROM v_available_plots;`);
    res.json(plots[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All plots
router.get("/plots/all", async (req, res) => {
  try {
    const plots = await db.Plot.findAll();
    res.json(plots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single plot
router.get("/plots/:plotId", async (req, res) => {
  try {
    const { plotId } = req.params;
    const plot = await db.Plot.findByPk(plotId);

    if (!plot) {
      return res.status(404).json({ error: "Plot not found" });
    }

    res.json(plot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add plot
router.post("/plots", async (req, res) => {
  try {
    const { price, size, reservedBy = null } = req.body;
    const plot = await db.Plot.create({
      price,
      size,
      reserved_by: reservedBy,
    });

    res.status(201).json(plot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update plot
router.patch("/plots/:plotId", async (req, res) => {
  try {
    const { plotId } = req.params;
    const { price, size, reservedBy } = req.body;
    const plot = await db.Plot.findByPk(plotId);

    if (!plot) {
      return res.status(404).json({ error: "Plot not found" });
    }

    await plot.update({
      ...(price !== undefined ? { price } : {}),
      ...(size !== undefined ? { size } : {}),
      ...(reservedBy !== undefined ? { reserved_by: reservedBy } : {}),
    });

    res.json(plot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plot sales report
router.get("/reports/plots-sold", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "startDate and endDate query parameters are required",
      });
    }

    const report = await db.sequelize.query(
      `
      SELECT *
      FROM fn_plots_sold_between(:startDate, :endDate)
      `,
      {
        replacements: { startDate, endDate },
      },
    );

    res.json(report[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//////// RESERVATIONS

router.post("/reserve", async (req, res) => {
  const { clientId, plotId } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    await db.sequelize.query("CALL p_reserve(:c, :p)", {
      replacements: { c: clientId, p: plotId },
      transaction: transaction
    });
    
    await transaction.commit();
    res.json({ message: "Rezerwacja udana" });
    
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
});

// Remove plot reservation
router.post("/remove-reservation", async (req, res) => {
  const { clientId, plotId } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    await db.sequelize.query("CALL p_remove_reservation(:c, :p)", {
      replacements: { c: clientId, p: plotId },
      transaction: transaction
    });
    
    await transaction.commit();
    res.json({ message: "Rezerwacja usunięta" });
    
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
});

// Reservation history
router.get("/reservations", async (req, res) => {
  try {
    const { clientId, plotId } = req.query;
    const where = [];
    const replacements = {};

    if (clientId !== undefined) {
      where.push("client_id = :clientId");
      replacements.clientId = clientId;
    }

    if (plotId !== undefined) {
      where.push("plot_id = :plotId");
      replacements.plotId = plotId;
    }

    const query = `
      SELECT *
      FROM reservations
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC
    `;

    const reservations = await db.sequelize.query(query, { replacements });
    res.json(reservations[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//////// PAYMENTS

// Payment history
router.get("/payments", async (req, res) => {
  try {
    const { clientId } = req.query;
    const where = [];
    const replacements = {};

    if (clientId !== undefined) {
      where.push("client_id = :clientId");
      replacements.clientId = clientId;
    }

    const query = `
      SELECT *
      FROM payments
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY created_at DESC
    `;

    const payments = await db.sequelize.query(query, { replacements });
    res.json(payments[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add client
router.post("/add-client", async (req, res) => {
  const { name, lastName } = req.body;
  try {
    const newClient = await db.Client.create({ name, last_name: lastName });
    res.json(newClient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
