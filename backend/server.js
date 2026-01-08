const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '.env' });

// Import routes
const authRoutes = require('./routes/auth');
const placesRoutes = require('./routes/places');
const reviewsRoutes = require('./routes/reviews');
const savedRoutes = require('./routes/saved');
const communitiesRoutes = require('./routes/communities');
const pollsRoutes = require('./routes/polls');
const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import database connection
const connectDB = require('./config/db');

// Connect to database 
connectDB();

const app = express();

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// 🚫 NO CORS NEEDED for same-origin http://localhost:3000
// Frontend and backend are served from the same origin,
// so cookies and auth will work without any CORS configuration.

// Static files middleware (serve frontend and uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/admin', adminRoutes);

// Root route → serve main frontend page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handler middleware (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', err);
  server.close(() => {
    process.exit(1);
  });
});
