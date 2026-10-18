import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/config/database.js', () => ({
  isDatabaseReady: vi.fn(),
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

import * as dbModule from '../../src/config/database.js';
import app from '../../src/app.js';

describe('Health Endpoints (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/health', () => {
    it('returns 200 with status ok and uptime', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
      expect(typeof response.body.data.uptimeSeconds).toBe('number');
      expect(response.body.meta.requestId).toBeDefined();
    });

    it('attaches and returns custom x-request-id header when provided', async () => {
      const customId = 'test-trace-id-12345';
      const response = await request(app)
        .get('/api/v1/health')
        .set('x-request-id', customId);

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBe(customId);
      expect(response.body.meta.requestId).toBe(customId);
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('returns 200 when database is connected', async () => {
      vi.mocked(dbModule.isDatabaseReady).mockReturnValue(true);

      const response = await request(app).get('/api/v1/health/ready');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ready');
      expect(response.body.data.database.status).toBe('connected');
    });

    it('returns 503 SERVICE_UNAVAILABLE when database is not connected', async () => {
      vi.mocked(dbModule.isDatabaseReady).mockReturnValue(false);

      const response = await request(app).get('/api/v1/health/ready');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('404 & Centralized Error Handling', () => {
    it('returns 404 for unknown endpoints with consistent format', async () => {
      const response = await request(app).get('/api/v1/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.meta.requestId).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    it('serves Swagger UI at /api-docs', async () => {
      const response = await request(app).get('/api-docs/');

      expect([200, 301]).toContain(response.status);
    });
  });
});
