import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const localDb = new Database("logistics.db");
const cloudDb = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

async function restore() {
  console.log("🚀 Starting data restoration to Cloud...");

  try {
    // 1. Restore Clients
    const clients = localDb.prepare("SELECT * FROM clients").all();
    for (const client of clients as any[]) {
      await cloudDb.execute({
        sql: "INSERT OR IGNORE INTO clients (id, clientName, clientAddress, clientContact) VALUES (?, ?, ?, ?)",
        args: [client.id, client.clientName, client.clientAddress, client.clientContact]
      });
    }
    console.log(`✅ Restored ${clients.length} Clients`);

    // 2. Restore Orders
    const orders = localDb.prepare("SELECT * FROM orders").all();
    for (const order of orders as any[]) {
      await cloudDb.execute({
        sql: "INSERT OR IGNORE INTO orders (id, orderNumber, orderDate, clientId, pickupLocation, customerName, dropLocation, mapPinUrl, customerContact, outsourceName, outsourceCharges, modeOfPayment, deliveryCharges, units, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [order.id, order.orderNumber, order.orderDate, order.clientId, order.pickupLocation, order.customerName, order.dropLocation, order.mapPinUrl, order.customerContact, order.outsourceName, order.outsourceCharges, order.modeOfPayment, order.deliveryCharges, order.units, order.remark]
      });
    }
    console.log(`✅ Restored ${orders.length} Orders`);

    // 3. Restore Ledger
    const ledger = localDb.prepare("SELECT * FROM ledger").all();
    for (const entry of ledger as any[]) {
      await cloudDb.execute({
        sql: "INSERT OR IGNORE INTO ledger (id, partnerId, date, description, type, amount) VALUES (?, ?, ?, ?, ?, ?)",
        args: [entry.id, entry.partnerId, entry.date, entry.description, entry.type, entry.amount]
      });
    }
    console.log(`✅ Restored ${ledger.length} Ledger entries`);

    console.log("🎉 Restoration Complete! Check your live website now.");
  } catch (error) {
    console.error("❌ Error during restoration:", error);
  }
}

restore();