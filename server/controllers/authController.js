import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists globally' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email.toLowerCase().trim(), hashedPassword, 'admin']);
    
    res.status(201).json({ success: true, user: { id: result.lastID, email: email.toLowerCase().trim(), role: 'admin' } });
  } catch (error) {
    next(error);
  }
};
