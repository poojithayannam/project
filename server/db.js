import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

let dbInstance = null;

export const initDb = async () => {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedbackText TEXT NOT NULL,
      rating INTEGER NOT NULL,
      category TEXT DEFAULT 'General',
      platform TEXT DEFAULT 'Direct',
      detectedLanguage TEXT DEFAULT 'English',
      sentiment TEXT DEFAULT 'Neutral',
      sentimentScore INTEGER DEFAULT 50,
      emotion TEXT DEFAULT 'Unknown',
      userFeelingExplanation TEXT,
      severity TEXT DEFAULT 'Low',
      impactScore INTEGER DEFAULT 0,
      keywords TEXT,
      summary TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platformName TEXT UNIQUE NOT NULL,
      apiKey TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'General',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin user
  const adminExists = await dbInstance.get('SELECT id FROM users WHERE email = ?', ['admin@test.com']);
  if (!adminExists) {
    const hashed = await bcrypt.hash('admin123', 10);
    await dbInstance.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', ['admin@test.com', hashed, 'admin']);
    console.log('✅ Default Admin account created (admin@test.com / admin123)');
  }

  // Seed default viewer user
  const viewerExists = await dbInstance.get('SELECT id FROM users WHERE email = ?', ['viewer@test.com']);
  if (!viewerExists) {
    const hashedViewer = await bcrypt.hash('viewer123', 10);
    await dbInstance.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', ['viewer@test.com', hashedViewer, 'viewer']);
    console.log('✅ Default Viewer account created (viewer@test.com / viewer123)');
  }

  // Seed all mock integrations for the web simulator
  const platforms = ['Amazon', 'Zomato', 'Flipkart'];
  for (const plat of platforms) {
      const exists = await dbInstance.get('SELECT id FROM integrations WHERE platformName = ?', [plat]);
      if (!exists) {
          await dbInstance.run('INSERT INTO integrations (platformName, apiKey, category) VALUES (?, ?, ?)', [plat, 'demo-secret-key', 'E-commerce']);
          console.log(`✅ Demo ${plat} Simulator Integration seeded (demo-secret-key)`);
      }
  }

  return dbInstance;
};

export const getDb = () => {
  if (!dbInstance) throw new Error('Database not initialized yet');
  return dbInstance;
};
