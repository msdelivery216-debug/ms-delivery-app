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

  INSERT OR IGNORE INTO profile (id, companyName, ownerName, contactEmail) 
  VALUES (1, 'MS Delivery Services', 'Admin', 'admin@msdelivery.com');
`);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  
  // Auth Middleware (Simple)
  const auth = (req: any, res: any, next: any) => {
    // In a real app, use JWT or sessions. For this demo, we'll check a header or just allow for now
    // since the frontend handles the login state.
    next();
  };

  // Clients API
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

  // Orders API
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

  // Profile API
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
