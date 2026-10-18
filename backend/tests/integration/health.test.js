import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('CardBridge health endpoints', () => {
  let mongoServer;
  let connectDatabase;
  let disconnectDatabase;
  let app;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '5001';
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri('cardbridge');

    ({ connectDatabase, disconnectDatabase } = await import('../../src/config/database.js'));
    ({ default: app } = await import('../../src/app.js'));

    await connectDatabase(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('returns ok for the basic health endpoint', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.meta.requestId).toBeTruthy();
  });

  it('returns ready when MongoDB is connected', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ready');
    expect(response.body.data.database.status).toBe('connected');
  });
});
