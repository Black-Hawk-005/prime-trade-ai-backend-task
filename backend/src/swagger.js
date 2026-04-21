const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Prime Trade API',
      version: '1.0.0',
      description: 'Scalable REST API with JWT Authentication and Role-Based Access Control.\n\n**How to authenticate:**\n1. Register or login to get a JWT token.\n2. Click the **Authorize** button and enter: `Bearer <your-token>`',
      contact: {
        name: 'Prime Trade',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

module.exports = swaggerJsdoc(options);
