export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'CardBridge API',
    version: '1.0.0',
    description:
      'Production-minded backend API for CardBridge — credit-card offer comparison, product-price analysis, and cardholder-discovery.',
    contact: {
      name: 'CardBridge Engineering',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base URL',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Service liveness and readiness monitoring',
    },
    {
      name: 'Products',
      description: 'Product URL validation, web scraping, and offer discovery',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service liveness check',
        description: 'Returns 200 OK if the Express HTTP server process is running and responding to requests.',
        responses: {
          '200': {
            description: 'Server is running normally',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success', 'data', 'meta'],
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      required: ['status', 'uptimeSeconds'],
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        uptimeSeconds: { type: 'number', example: 45.2 },
                      },
                    },
                    meta: {
                      type: 'object',
                      required: ['requestId'],
                      properties: {
                        requestId: { type: 'string', example: 'c4e4df9b-13c5-4d78-9f26-0e123456789a' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Service readiness check',
        description:
          'Verifies whether the server and all critical subsystems (MongoDB) are ready to handle production traffic.',
        responses: {
          '200': {
            description: 'Application and MongoDB are fully ready',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success', 'data', 'meta'],
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      required: ['status', 'database'],
                      properties: {
                        status: { type: 'string', example: 'ready' },
                        database: {
                          type: 'object',
                          required: ['status'],
                          properties: {
                            status: { type: 'string', example: 'connected' },
                          },
                        },
                      },
                    },
                    meta: {
                      type: 'object',
                      required: ['requestId'],
                      properties: {
                        requestId: { type: 'string', example: 'c4e4df9b-13c5-4d78-9f26-0e123456789a' },
                      },
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Application is still starting or MongoDB is disconnected',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['success', 'error', 'meta'],
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                      type: 'object',
                      required: ['code', 'message'],
                      properties: {
                        code: { type: 'string', example: 'SERVICE_UNAVAILABLE' },
                        message: {
                          type: 'string',
                          example: 'The application is still starting or MongoDB is not ready yet.',
                        },
                      },
                    },
                    meta: {
                      type: 'object',
                      required: ['requestId'],
                      properties: {
                        requestId: { type: 'string', example: 'c4e4df9b-13c5-4d78-9f26-0e123456789a' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/products/analyze': {
      post: {
        tags: ['Products'],
        summary: 'Analyze product URL and extract details & offers',
        description:
          'Validates product URL against SSRF defenses, scrapes normalized product details and credit card offers, and upserts product.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: {
                    type: 'string',
                    example: 'https://www.amazon.in/dp/B0BDK62PDX',
                    description: 'HTTPS URL of the product from supported retailers (Amazon India, Flipkart, Meesho)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Product analyzed and upserted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        analysisId: { type: 'string', example: '651f8a84c259bb0012345678' },
                        status: { type: 'string', example: 'completed' },
                        retailer: { type: 'string', example: 'amazon' },
                        product: { type: 'object' },
                        discoveredOffers: { type: 'array', items: { type: 'object' } },
                      },
                    },
                    message: { type: 'string', example: 'Product analysis completed successfully' },
                    meta: { type: 'object' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid or unsupported product URL',
          },
          '502': {
            description: 'Retailer page blocked or unreachable',
          },
        },
      },
    },
    '/products/analyses/{analysisId}': {
      get: {
        tags: ['Products'],
        summary: 'Get product analysis job status and extracted data',
        parameters: [
          {
            name: 'analysisId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Product analysis record ID',
          },
        ],
        responses: {
          '200': {
            description: 'Analysis retrieved successfully',
          },
          '404': {
            description: 'Analysis record not found',
          },
        },
      },
    },
    '/products/{productId}': {
      get: {
        tags: ['Products'],
        summary: 'Get product details by ID',
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Product ObjectId',
          },
        ],
        responses: {
          '200': {
            description: 'Product details retrieved successfully',
          },
          '404': {
            description: 'Product not found',
          },
        },
      },
    },
    '/products/{productId}/offers': {
      get: {
        tags: ['Products'],
        summary: 'Get available offers for a product',
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Product ObjectId',
          },
        ],
        responses: {
          '200': {
            description: 'Product offers retrieved successfully',
          },
          '404': {
            description: 'Product not found',
          },
        },
      },
    },
  },
};

export default swaggerDocument;
