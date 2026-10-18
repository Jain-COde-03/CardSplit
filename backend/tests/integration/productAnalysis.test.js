import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '../fixtures');

describe('Product Analysis Endpoints (Integration)', () => {
  let mongoServer;
  let connectDatabase;
  let disconnectDatabase;
  let app;
  let amazonFixture;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '5002';
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri('cardbridge_products');

    ({ connectDatabase, disconnectDatabase } = await import('../../src/config/database.js'));
    ({ default: app } = await import('../../src/app.js'));

    await connectDatabase(process.env.MONGODB_URI);

    amazonFixture = fs.readFileSync(path.join(fixturesDir, 'amazon-product.html'), 'utf-8');
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  let createdProductId = null;
  let createdAnalysisId = null;

  it('POST /api/v1/products/analyze creates product and analysis from valid URL', async () => {
    const response = await request(app)
      .post('/api/v1/products/analyze')
      .send({
        url: 'https://www.amazon.in/dp/B0BDK62PDX',
        htmlFixture: amazonFixture,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('completed');
    expect(response.body.data.retailer).toBe('amazon');
    expect(response.body.data.product).toBeDefined();
    expect(response.body.data.product.name).toBe('Apple iPhone 14 (128 GB) - Blue');
    expect(response.body.data.product.currentPrice).toBe(56999);
    expect(response.body.data.discoveredOffers.length).toBeGreaterThan(0);
    expect(response.body.meta.requestId).toBeDefined();

    createdProductId = response.body.data.product.id;
    createdAnalysisId = response.body.data.analysisId;
  });

  it('GET /api/v1/products/analyses/:analysisId returns the completed analysis', async () => {
    const response = await request(app).get(`/api/v1/products/analyses/${createdAnalysisId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('completed');
    expect(response.body.data.submittedUrl).toBe('https://www.amazon.in/dp/B0BDK62PDX');
  });

  it('GET /api/v1/products/:productId retrieves the stored product', async () => {
    const response = await request(app).get(`/api/v1/products/${createdProductId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(createdProductId);
    expect(response.body.data.name).toBe('Apple iPhone 14 (128 GB) - Blue');
    expect(response.body.data.retailer).toBe('amazon');
  });

  it('GET /api/v1/products/:productId/offers retrieves available offers', async () => {
    const response = await request(app).get(`/api/v1/products/${createdProductId}/offers`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.product.id).toBe(createdProductId);
    expect(response.body.data.offers.length).toBeGreaterThan(0);
  });

  it('provides a reusable eligible showcase cardholder even without scraped offers', async () => {
    const { default: User } = await import('../../src/models/User.js');
    const { default: UserCard } = await import('../../src/models/UserCard.js');
    const fixture = fs.readFileSync(path.join(fixturesDir, 'meesho-product.html'), 'utf-8');
    const analyze = (htmlFixture) => request(app).post('/api/v1/products/analyze').send({ url: 'https://www.meesho.com/printed-kurti/p/12345', htmlFixture });
    const first = await analyze(fixture);
    expect(first.status).toBe(200);
    const offer = first.body.data.discoveredOffers[first.body.data.bestPickIndex];
    expect(offer.bestPick).toBe(true);
    const member = await User.findOne({ isShowcase: true });
    expect(member.profile.cardholderDiscovery).toBe(true);
    let card = await UserCard.findOne({ userId: member._id, issuer: offer.bank, cardProduct: offer.cardName });
    expect(card.availableCredit).toBeGreaterThanOrEqual(first.body.data.product.currentPrice);
    const count = await UserCard.countDocuments({ userId: member._id });
    const second = await analyze(fixture.replace('₹499', '₹99999'));
    expect(second.status).toBe(200);
    card = await UserCard.findById(card._id);
    expect(card.availableCredit).toBeGreaterThanOrEqual(99999);
    expect(await User.countDocuments({ isShowcase: true })).toBe(1);
    expect(await UserCard.countDocuments({ userId: member._id })).toBe(count);
  });

  it('does not create showcase profiles in production', async () => {
    const { ensureShowcaseCardholder } = await import('../../src/services/showcaseCardholder.service.js');
    const { default: UserCard } = await import('../../src/models/UserCard.js');
    const before = await UserCard.countDocuments();
    const recommendation = { offers: [], bestPickIndex: null };
    const previous = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      await ensureShowcaseCardholder(recommendation, 1000000);
    } finally { process.env.NODE_ENV = previous; }
    expect(recommendation.offers).toEqual([]);
    expect(await UserCard.countDocuments()).toBe(before);
  });

  it('POST /api/v1/products/analyze rejects invalid and unsupported URLs with 400', async () => {
    const response = await request(app)
      .post('/api/v1/products/analyze')
      .send({
        url: 'https://evil-unsupported-domain.com/hack',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_PRODUCT_URL');
  });

  it('GET /api/v1/products/:productId returns 404 for non-existent product ID', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const response = await request(app).get(`/api/v1/products/${fakeId}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });
});

