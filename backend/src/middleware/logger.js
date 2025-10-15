const morgan = require('morgan');

// Custom token to log request body (be careful with sensitive data)
morgan.token('body', (req) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // Hide password from logs
    const body = { ...req.body };
    if (body.password) body.password = '***';
    return JSON.stringify(body);
  }
  return '';
});

// Custom format
const loggerFormat = ':method :url :status :response-time ms - :body';

// Create logger middleware
const logger = morgan(loggerFormat, {
  skip: (req) => {
    // Skip logging for health check endpoint
    return req.url === '/health';
  },
});

module.exports = logger;
