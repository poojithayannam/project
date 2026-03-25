import jwt from 'jsonwebtoken';


export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
    req.user = decoded; // Contains id and role
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }
  next();
};

export const requireViewer = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'viewer')) {
    return res.status(403).json({ error: 'Forbidden: Viewer or Admin access only' });
  }
  next();
};
