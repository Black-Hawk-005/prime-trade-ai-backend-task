const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message } = err;

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta?.target?.join(', ') || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found.';
  }

  // Prisma foreign key constraint
  if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Related record not found.';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${err.stack}`);
  }

  return sendError(res, statusCode, message || 'Internal server error');
};

module.exports = errorHandler;
