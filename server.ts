import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client"; // Switched to Turso Cloud Client
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONNECT TO TURSO CLOUD ---
// These will be pulled from your Vercel Environment Variables automatically
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

// Initialize Database Tables in the Cloud
async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientName TEXT NOT NULL,
      clientAddress TEXT,
      clientContact TEXT
    );
  `);

  await db.execute(`
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
      remark TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partnerId TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      amount REAL DEFAULT 0
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY,
      companyName TEXT,
      ownerName TEXT,
      contactEmail TEXT,
      logoUrl TEXT
    );
  `);
  
  await db.execute("INSERT OR IGNORE INTO profile (id, companyName) VALUES (1, 'MS Delivery Services')");
}

async function startServer() {
  await initDb();
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- API Routes (Updated for Cloud SQL) ---

  app.get("/api/clients", async (req, res) => {
    const result = await db.execute("SELECT * FROM clients ORDER BY clientName ASC");
    res.json(result.rows);
  });

  app.post("/api/clients", async (req, res) => {
    const { clientName, clientAddress, clientContact } = req.body;
    const result = await db.execute({
      sql: "INSERT INTO clients (clientName, clientAddress, clientContact) VALUES (?, ?, ?)",
      args: [clientName, clientAddress, clientContact]
    });
    res.json({ id: result.lastInsertRowid?.toString() });
  });

  app.get("/api/orders", async (req, res) => {
    const result = await db.execute("SELECT * FROM orders ORDER BY orderDate DESC");
    res.json(result.rows);
  });

  app.post("/api/orders", async (req, res) => {
    const { orderNumber, orderDate, clientId, pickupLocation, customerName, dropLocation, mapPinUrl, customerContact, outsourceName, outsourceCharges, modeOfPayment, deliveryCharges, units, remark } = req.body;
    try {
      const result = await db.execute({
        sql: "INSERT INTO orders (orderNumber, orderDate, clientId, pickupLocation, customerName, dropLocation, mapPinUrl, customerContact, outsourceName, outsourceCharges, modeOfPayment, deliveryCharges, units, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [orderNumber, orderDate, clientId, pickupLocation, customerName, dropLocation, mapPinUrl, customerContact, outsourceName, outsourceCharges, modeOfPayment, deliveryCharges, units, remark]
      });
      res.json({ id: result.lastInsertRowid?.toString() });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/partners", async (req, res) => {
    const clients = await db.execute("SELECT id, clientName as name FROM clients");
    const outsources = await db.execute("SELECT DISTINCT outsourceName as name FROM orders WHERE outsourceName IS NOT NULL");
    
    const formattedClients = clients.rows.map((c: any) => ({ id: `cli-${c.id}`, name: c.name, type: 'CLIENT' }));
    const formattedOutsources = outsources.rows.map((o: any) => ({ id: `drv-${o.name}`, name: o.name, type: 'OUTSOURCE' }));
    
    res.json([...formattedOutsources, ...formattedClients]);
  });

  app.get("/api/ledger", async (req, res) => {
    const { partnerId } = req.query;
    const result = await db.execute({
      sql: "SELECT * FROM ledger WHERE partnerId = ?",
      args: [partnerId as string]
    });
    res.json(result.rows);
  });

  app.post("/api/ledger", async (req, res) => {
    const { partnerId, date, description, type, amount } = req.body;
    const result = await db.execute({
      sql: "INSERT INTO ledger (partnerId, date, description, type, amount) VALUES (?, ?, ?, ?, ?)",
      args: [partnerId, date, description, type, amount]
    });
    res.json({ id: result.lastInsertRowid?.toString() });
  });

  app.get("/api/profile", async (req, res) => {
    const result = await db.execute("SELECT * FROM profile WHERE id = 1");
    res.json(result.rows[0]);
  });

  // Vite/Static Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
}

startServer();
