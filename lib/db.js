import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'wine-event.db');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS print_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    item_number INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS badge_status (
    company_number INTEGER PRIMARY KEY,
    company_name TEXT NOT NULL,
    is_printed BOOLEAN DEFAULT 0,
    printed_at DATETIME,
    quantity INTEGER DEFAULT 0
  );
`);

export function getPrintHistory() {
  return db.prepare('SELECT * FROM print_history ORDER BY timestamp DESC').all();
}

export function addPrintHistory(type, itemId, itemName, itemNumber, quantity) {
  const stmt = db.prepare(`
    INSERT INTO print_history (type, item_id, item_name, item_number, quantity)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(type, itemId, itemName, itemNumber, quantity);

  if (type === 'badge') {
    const badgeStmt = db.prepare(`
      INSERT INTO badge_status (company_number, company_name, is_printed, printed_at, quantity)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(company_number) DO UPDATE SET
        is_printed = 1,
        printed_at = CURRENT_TIMESTAMP,
        quantity = quantity + ?
    `);
    badgeStmt.run(itemNumber, itemName, quantity, quantity);
  }
}

export function getBadgeStatus() {
  return db.prepare('SELECT * FROM badge_status').all();
}

export function resetBadgeStatus() {
  db.prepare('DELETE FROM badge_status').run();
  db.prepare('DELETE FROM print_history WHERE type = "badge"').run();
}

export function searchBadges(query) {
  return db.prepare(`
    SELECT * FROM badge_status 
    WHERE company_name LIKE ? OR company_number LIKE ?
    ORDER BY company_number
  `).all(`%${query}%`, `%${query}%`);
} 