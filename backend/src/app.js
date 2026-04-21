const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const errorHandler = require('./middlewares/error.middleware');
const config = require('./config/config');

const authRoutes = require('./modules/auth/auth.routes');
const taskRoutes = require('./modules/tasks/tasks.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Prime Trade API Docs',
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Prime Trade API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
