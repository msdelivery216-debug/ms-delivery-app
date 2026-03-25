import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("logistics.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientName TEXT NOT NULL,
    clientAddress TEXT,
    clientContact TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNumber TEXT UNIQUE NOT NULL,
    orderDate TEXT NOT NULL,
    clientId INTEGER,
    pickupLocation TEXT,
    customerName TEXT,
    dropLocation TEXT,
    mapPinUrl TEXT,
    customerContact TEXT,
    outsourceName TEXT,
    outsourceCharges REAL DEFAULT 0,
    modeOfPayment TEXT,
    deliveryCharges REAL DEFAULT 0,
    units INTEGER DEFAULT 1,
    remark TEXT,
    FOREIGN KEY (clientId) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    companyName TEXT,
    ownerName TEXT,
    contactEmail TEXT,
    logoUrl TEXT
  );

  -- NEW: Ledger table for manual payments
  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partnerId TEXT NOT NULL, -- Prefix with 'cli-' for clients, 'drv-' for outsources
    date TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    amount REAL DEFAULT 0
  );

  INSERT OR IGNORE INTO profile (id, companyName, ownerName, contactEmail) 
  VALUES (1, 'MS Delivery Services', 'Admin', 'admin@msdelivery.com');
`);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Auth Middleware (Simple)
  const auth = (req: any, res: any, next: any) => {
    next();
  };

  // --- Clients API ---
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY clientName ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { clientName, clientAddress, clientContact } = req.body;
    const info = db.prepare("INSERT INTO clients (clientName, clientAddress, clientContact) VALUES (?, ?, ?)")
      .run(clientName, clientAddress, clientContact);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/clients/:id", (req, res) => {
    const { id } = req.params;
    const { clientName, clientAddress, clientContact } = req.body;
    db.prepare("UPDATE clients SET clientName = ?, clientAddress = ?, clientContact = ? WHERE id = ?")
      .run(clientName, clientAddress, clientContact, id);
    res.json({ success: true });
  });

  app.delete("/api/clients/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/clients/bulk-delete", (req, res) => {
    const { ids } = req.body;
    const placeholders = ids.map(() => "?").join(",");
    db.prepare(`DELETE FROM clients WHERE id IN (${placeholders})`).run(...ids);
    res.json({ success: true });
  });

  // --- Orders API ---
  app.get("/api/orders", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, c.clientName 
      FROM orders o 
      LEFT JOIN clients c ON o.clientId = c.id 
      ORDER BY o.orderDate DESC, o.id DESC
    `).all();
    res.json(orders);
  });

  app.post("/api/orders", (req, res) => {
    const { 
      orderNumber, orderDate, clientId, pickupLocation, customerName, 
      dropLocation, mapPinUrl, customerContact, outsourceName, 
      outsourceCharges, modeOfPayment, deliveryCharges, units, remark 
    } = req.body;
    
    try {
      const info = db.prepare(`
        INSERT INTO orders (
          orderNumber, orderDate, clientId, pickupLocation, customerName, 
          dropLocation, mapPinUrl, customerContact, outsourceName, 
          outsourceCharges, modeOfPayment, deliveryCharges, units, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderNumber, orderDate, clientId, pickupLocation, customerName, 
        dropLocation, mapPinUrl, customerContact, outsourceName, 
        outsourceCharges, modeOfPayment, deliveryCharges, units, remark
      );
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const { 
      orderDate, clientId, pickupLocation, customerName, 
      dropLocation, mapPinUrl, customerContact, outsourceName, 
      outsourceCharges, modeOfPayment, deliveryCharges, units, remark 
    } = req.body;
    
    db.prepare(`
      UPDATE orders SET 
        orderDate = ?, clientId = ?, pickupLocation = ?, customerName = ?, 
        dropLocation = ?, mapPinUrl = ?, customerContact = ?, outsourceName = ?, 
        outsourceCharges = ?, modeOfPayment = ?, deliveryCharges = ?, units = ?, remark = ?
      WHERE id = ?
    `).run(
      orderDate, clientId, pickupLocation, customerName, 
      dropLocation, mapPinUrl, customerContact, outsourceName, 
      outsourceCharges, modeOfPayment, deliveryCharges, units, remark, id
    );
    res.json({ success: true });
  });

  app.delete("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM orders WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/orders/bulk-delete", (req, res) => {
    const { ids } = req.body;
    const placeholders = ids.map(() => "?").join(",");
    db.prepare(`DELETE FROM orders WHERE id IN (${placeholders})`).run(...ids);
    res.json({ success: true });
  });

  // --- Profile API ---
  app.get("/api/profile", (req, res) => {
    const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
    res.json(profile);
  });

  app.put("/api/profile", (req, res) => {
    const { companyName, ownerName, contactEmail, logoUrl } = req.body;
    db.prepare(`
      UPDATE profile SET 
        companyName = ?, ownerName = ?, contactEmail = ?, logoUrl = ?
      WHERE id = 1
    `).run(companyName, ownerName, contactEmail, logoUrl);
    res.json({ success: true });
  });

  // ==========================================
  // NEW: ACCOUNTING & DASHBOARD ROUTES
  // ==========================================

  // Combine clients and outsource drivers into a single list for the sidebar
  app.get("/api/partners", (req, res) => {
    const clients = db.prepare("SELECT id, clientName as name FROM clients ORDER BY name ASC").all();
    const formattedClients = clients.map((c: any) => ({ id: `cli-${c.id}`, name: c.name, type: 'CLIENT' }));

    const outsources = db.prepare("SELECT DISTINCT outsourceName as name FROM orders WHERE outsourceName IS NOT NULL AND outsourceName != '' ORDER BY name ASC").all();
    const formattedOutsources = outsources.map((o: any) => ({ id: `drv-${o.name}`, name: o.name, type: 'OUTSOURCE' }));

    res.json([...formattedOutsources, ...formattedClients]);
  });

  // Fetch the combined ledger (Orders + Manual Payments) for a specific partner
  app.get("/api/ledger", (req, res) => {
    const { partnerId } = req.query;
    if (!partnerId || typeof partnerId !== 'string') return res.status(400).json({ error: "partnerId required" });

    const entries = [];

    // 1. Fetch manual payments from ledger table
    const manualEntries = db.prepare("SELECT * FROM ledger WHERE partnerId = ? ORDER BY date DESC").all(partnerId);
    entries.push(...manualEntries.map((e: any) => ({
      id: `manual-${e.id}`,
      partnerId: e.partnerId,
      date: e.date,
      description: e.description,
      type: e.type,
      partnerShare: 0,
      myShare: 0,
      amount: e.amount,
      isManual: true
    })));

    // 2. Fetch order-related entries
    if (partnerId.startsWith('cli-')) {
      const clientId = partnerId.replace('cli-', '');
      const orderEntries = db.prepare(`
        SELECT id, orderDate, orderNumber, modeOfPayment, outsourceCharges, deliveryCharges 
        FROM orders WHERE clientId = ?
      `).all(clientId);

      entries.push(...orderEntries.map((o: any) => {
        // Based on logic: If CLIENT_PAID (Pre-paid), you hold driver's money (- outsourceCharges)
        // If COP/COD, the driver/agency holds your money (+ deliveryCharges - outsourceCharges)
        let type = o.modeOfPayment; // Assuming modeOfPayment is COP, COD, or PREPAID/CLIENT_PAID
        let partnerShare = type === 'CLIENT_PAID' || type === 'PREPAID' ? o.outsourceCharges : 0;
        let myShare = type === 'COP' || type === 'COD' ? (o.deliveryCharges - o.outsourceCharges) : 0;

        return {
          id: `order-${o.id}`,
          partnerId,
          date: o.orderDate,
          description: `Order ${o.orderNumber}`,
          type: type || 'UNKNOWN',
          partnerShare: partnerShare,
          myShare: myShare > 0 ? myShare : 0, 
          amount: 0,
          isManual: false
        };
      }));
    } else if (partnerId.startsWith('drv-')) {
      const drvName = partnerId.replace('drv-', '');
      const orderEntries = db.prepare(`
        SELECT id, orderDate, orderNumber, modeOfPayment, outsourceCharges, deliveryCharges 
        FROM orders WHERE outsourceName = ?
      `).all(drvName);

      entries.push(...orderEntries.map((o: any) => {
        let type = o.modeOfPayment;
        let partnerShare = type === 'CLIENT_PAID' || type === 'PREPAID' ? o.outsourceCharges : 0;
        let myShare = type === 'COP' || type === 'COD' ? (o.deliveryCharges - o.outsourceCharges) : 0;

        return {
          id: `order-${o.id}`,
          partnerId,
          date: o.orderDate,
          description: `Order ${o.orderNumber}`,
          type: type || 'UNKNOWN',
          partnerShare: partnerShare,
          myShare: myShare > 0 ? myShare : 0,
          amount: 0,
          isManual: false
        };
      }));
    }

    // Sort combined array by date descending
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(entries);
  });

  // Create manual payment
  app.post("/api/ledger", (req, res) => {
    const { partnerId, date, description, type, amount } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO ledger (partnerId, date, description, type, amount) 
        VALUES (?, ?, ?, ?, ?)
      `).run(partnerId, date, description, type, amount);
      
      res.json({ 
        id: `manual-${info.lastInsertRowid}`, 
        partnerId, date, description, type, amount, partnerShare: 0, myShare: 0, isManual: true 
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update manual payment
  app.put("/api/ledger/:id", (req, res) => {
    const rawId = req.params.id;
    if (!rawId.startsWith('manual-')) return res.status(400).json({ error: "Can only edit manual payments" });
    
    const dbId = rawId.replace('manual-', '');
    const { amount, type } = req.body;
    
    db.prepare("UPDATE ledger SET amount = ?, type = ? WHERE id = ?").run(amount, type, dbId);
    res.json({ success: true });
  });

  // Delete manual payment
  app.delete("/api/ledger/:id", (req, res) => {
    const rawId = req.params.id;
    if (!rawId.startsWith('manual-')) return res.status(400).json({ error: "Can only delete manual payments" });
    
    const dbId = rawId.replace('manual-', '');
    db.prepare("DELETE FROM ledger WHERE id = ?").run(dbId);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/dashboard-stats", (req, res) => {
    try {
      const orders = db.prepare("SELECT COUNT(*) as total FROM orders").get();
      const drivers = db.prepare("SELECT COUNT(DISTINCT outsourceName) as total FROM orders WHERE outsourceName IS NOT NULL AND outsourceName != ''").get();
      
      // Calculate Receivables (COP/COD orders) - Money owed to you
      const receivablesCalc = db.prepare(`
        SELECT SUM(deliveryCharges - outsourceCharges) as total 
        FROM orders 
        WHERE modeOfPayment IN ('COP', 'COD')
      `).get();

      // Calculate Payables (Client Paid/Prepaid) - Money you owe driver
      const payablesCalc = db.prepare(`
        SELECT SUM(outsourceCharges) as total 
        FROM orders 
        WHERE modeOfPayment IN ('CLIENT_PAID', 'PREPAID')
      `).get();

      // Factor in manual payments
      const manualPaymentsReceived = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE type = 'PAYMENT_RECEIVED'").get();
      const manualPaymentsSent = db.prepare("SELECT SUM(amount) as total FROM ledger WHERE type = 'PAYMENT_SENT'").get();

      const totalReceivables = (receivablesCalc as any).total || 0;
      const totalPayables = (payablesCalc as any).total || 0;
      const received = (manualPaymentsReceived as any).total || 0;
      const sent = (manualPaymentsSent as any).total || 0;

      res.json({
        totalDeliveries: (orders as any).total,
        activeDrivers: (drivers as any).total,
        // Net out the manual payments from the totals
        totalReceivables: Math.max(0, totalReceivables - received), 
        totalPayables: Math.max(0, totalPayables - sent)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to calculate stats" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
