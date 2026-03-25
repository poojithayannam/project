import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (mongoose.connection.readyState !== 1) {
       console.warn("⚠️ MongoDB offline. Using Mock Auth logic.");
       if (email === 'admin@test.com' && password === 'admin123') {
           const token = jwt.sign({ id: 'mock-admin-id', role: 'admin' }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '1d' });
           return res.json({ token, user: { email, role: 'admin' } });
       }
       return res.status(401).json({ error: 'Invalid mock credentials. Database is offline, please use admin@test.com / admin123' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'demo-secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
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

    if (mongoose.connection.readyState !== 1) {
       return res.status(503).json({ error: 'Registration is Disabled: The database is currently in mock offline mode.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists globally' });
    }

    const newUser = await User.create({ email, password, role: 'admin' });
    res.status(201).json({ success: true, user: { id: newUser._id, email: newUser.email, role: newUser.role } });
  } catch (error) {
    next(error);
  }
};
