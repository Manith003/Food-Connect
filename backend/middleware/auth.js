const jwt = require('jsonwebtoken'); 
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Try cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Fallback to Authorization header (Bearer)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid or user is inactive.'
      });
    }

    // Attach user to request so controllers can use req.user
    req.user = user;

    // Continue to the next middleware / route handler
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token is not valid.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // On error, just treat as unauthenticated and continue
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };
