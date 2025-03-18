import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

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
    printed_at DATETIME
  );
`);

// Load initial badge data from CSV if badge_status is empty
const badgeCount = db.prepare('SELECT COUNT(*) as count FROM badge_status').get();
if (badgeCount.count === 0) {
  try {
    const attendeesPath = path.join(process.cwd(), 'data', 'attendees.csv');
    const fileContent = fs.readFileSync(attendeesPath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    const insertStmt = db.prepare(`
      INSERT INTO badge_status (company_number, company_name, is_printed)
      VALUES (?, ?, 0)
    `);

    records.forEach(record => {
      insertStmt.run(parseInt(record.number), record.company);
    });
  } catch (error) {
    console.error('Error loading initial badge data:', error);
  }
}

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
      UPDATE badge_status 
      SET is_printed = 1, printed_at = CURRENT_TIMESTAMP
      WHERE company_number = ?
    `);
    badgeStmt.run(itemNumber);
  }
}

export function getBadgeStatus() {
  return db.prepare('SELECT * FROM badge_status ORDER BY company_number').all();
}

export function resetBadgeStatus() {
  db.prepare('UPDATE badge_status SET is_printed = 0, printed_at = NULL').run();
  db.prepare('DELETE FROM print_history WHERE type = "badge"').run();
}

export function searchBadges(query) {
  return db.prepare(`
    SELECT * FROM badge_status 
    WHERE company_name LIKE ? OR company_number LIKE ?
    ORDER BY company_number
  `).all(`%${query}%`, `%${query}%`);
} 