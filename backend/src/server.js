require('dotenv').config();
const app = require('./app');
const config = require('./config/config');

const server = app.listen(config.port, () => {
  console.log(`\n🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`📖 API Docs: http://localhost:${config.port}/api/docs`);
  console.log(`❤️  Health:  http://localhost:${config.port}/api/health\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed gracefully');
    process.exit(0);
  });
});
