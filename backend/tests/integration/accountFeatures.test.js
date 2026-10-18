import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { hashToken } from '../../src/middleware/authenticate.js';

describe('Account-backed platform features', () => {
  let mongoServer;
  let connectDatabase;
  let disconnectDatabase;
  let app;
  let User;
  let AuthSession;
  let UserCard;
  let Connection;
  let ProductAnalysis;
  let DealRequest;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '5003';
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri('cardbridge_accounts');

    ({ connectDatabase, disconnectDatabase } = await import('../../src/config/database.js'));
    ({ default: app } = await import('../../src/app.js'));
    ({ default: User } = await import('../../src/models/User.js'));
    ({ default: AuthSession } = await import('../../src/models/AuthSession.js'));
    ({ default: UserCard } = await import('../../src/models/UserCard.js'));
    ({ default: Connection } = await import('../../src/models/Connection.js'));
    ({ default: ProductAnalysis } = await import('../../src/models/ProductAnalysis.js'));
    ({ default: DealRequest } = await import('../../src/models/DealRequest.js'));
    await connectDatabase(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await disconnectDatabase();
    if (mongoServer) await mongoServer.stop();
  });

  async function createMember(name, email, profile = {}) {
    const user = await User.create({
      name,
      email,
      passwordHash: 'test-only-password-hash',
      emailVerified: true,
      profile,
    });
    const token = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');
    await AuthSession.create({
      userId: user._id,
      tokenHash: hashToken(token),
      csrfToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    return {
      user,
      cookie: `cardbridge_session=${token}`,
      csrfToken,
    };
  }

  function signedIn(member, method, url) {
    let call = request(app)[method](url).set('Cookie', member.cookie);
    if (method !== 'get') call = call.set('X-CSRF-Token', member.csrfToken);
    return call;
  }

  it('issues an HTTP-only login session and requires CSRF protection for logout', async () => {
    await User.create({
      name: 'Login member',
      email: 'login-member@example.com',
      passwordHash: await bcrypt.hash('correct horse battery staple', 4),
      emailVerified: true,
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'login-member@example.com',
      password: 'correct horse battery staple',
    });
    expect(login.status).toBe(200);
    expect(login.body.data.csrfToken).toBeTruthy();
    const sessionCookie = login.headers['set-cookie'].find((cookie) => cookie.startsWith('cardbridge_session='));
    expect(sessionCookie).toContain('HttpOnly');
    const cookie = sessionCookie.split(';')[0];

    const currentUser = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(currentUser.status).toBe(200);
    expect(currentUser.body.data.user.email).toBe('login-member@example.com');

    const rejectedLogout = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie).send({});
    expect(rejectedLogout.status).toBe(403);
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', login.body.data.csrfToken)
      .send({});
    expect(logout.status).toBe(200);
    const expiredSession = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(expiredSession.status).toBe(401);
  });

  it('only returns cardholders who opted in at both profile and card level', async () => {
    const viewer = await createMember('Viewer', 'viewer@example.com');
    const visible = await createMember('Visible member', 'visible@example.com', { cardholderDiscovery: true });
    const hidden = await createMember('Hidden member', 'hidden@example.com');
    await UserCard.create([
      { userId: visible.user._id, issuer: 'Example Bank', cardProduct: 'Everyday Card', visibility: 'discoverable' },
      { userId: hidden.user._id, issuer: 'Example Bank', cardProduct: 'Everyday Card', visibility: 'discoverable' },
    ]);
    await Connection.create({
      requesterId: viewer.user._id,
      recipientId: visible.user._id,
      status: 'pending',
    });

    const response = await signedIn(viewer, 'get', '/api/v1/members/cardholders?issuer=Example%20Bank');
    expect(response.status).toBe(200);
    expect(response.body.data.members.map((member) => member.name)).toEqual(['Visible member']);
    expect(response.body.data.members[0].connectionStatus).toBe('pending');
  });

  it('matches every offer type only to opted-in exact-card listings whose reported limit covers the product price', async () => {
    const viewer = await createMember('Offer viewer', 'offer-viewer@example.com');
    const eligible = await createMember('Eligible cardholder', 'eligible-cardholder@example.com', { cardholderDiscovery: true, dealFeePercent: 10 });
    const belowLimit = await createMember('Below limit', 'below-limit@example.com', { cardholderDiscovery: true });
    const unknownLimit = await createMember('Unknown limit', 'unknown-limit@example.com', { cardholderDiscovery: true });
    const wrongCard = await createMember('Different card', 'different-card@example.com', { cardholderDiscovery: true });
    const hidden = await createMember('Hidden cardholder', 'hidden-cardholder@example.com');

    const cards = await UserCard.create([
      { userId: eligible.user._id, issuer: 'HDFC Bank', cardProduct: 'Millennia Credit Card', creditLimit: 25000, visibility: 'discoverable' },
      { userId: belowLimit.user._id, issuer: 'HDFC Bank', cardProduct: 'Millennia Credit Card', creditLimit: 24999, visibility: 'discoverable' },
      { userId: unknownLimit.user._id, issuer: 'HDFC Bank', cardProduct: 'Millennia Credit Card', visibility: 'discoverable' },
      { userId: wrongCard.user._id, issuer: 'HDFC Bank', cardProduct: 'Regalia Gold Credit Card', creditLimit: 50000, visibility: 'discoverable' },
      { userId: hidden.user._id, issuer: 'HDFC Bank', cardProduct: 'Millennia Credit Card', creditLimit: 50000, visibility: 'discoverable' },
    ]);

    const matchedOffer = (discountType) => ({
      bank: 'HDFC Bank',
      cardName: 'Millennia Credit Card',
      discountType,
      discountValue: 500,
      minimumPurchase: 5000,
    });
    const analysis = await ProductAnalysis.create({
      userId: viewer.user._id,
      submittedUrl: 'https://www.amazon.in/dp/B0BDK62PDX',
      retailer: 'amazon',
      status: 'completed',
      extractedData: {
        productSummary: { name: 'Offer matching test product', currentPrice: 25000 },
        offers: [
          matchedOffer('instant_discount_flat'),
          matchedOffer('instant_discount_percentage'),
          matchedOffer('cashback_flat'),
          matchedOffer('cashback_percentage'),
          matchedOffer('emi_discount'),
          { bank: 'Other Bank', cardName: 'Card eligibility unknown', discountType: 'instant_discount_flat', discountValue: 500, minimumPurchase: 0 },
          { ...matchedOffer('instant_discount_flat'), minimumPurchase: 30000 },
          { ...matchedOffer('instant_discount_flat'), minimumPurchase: undefined },
          { bank: 'HDFC Bank', cardName: 'Card eligibility unknown', title: '5% on HDFC Bank Millennia Credit Card', discountType: 'instant_discount_percentage', discountValue: 5, minimumPurchase: 5000 },
        ],
      },
    });

    for (let offerIndex = 0; offerIndex < 5; offerIndex += 1) {
      const response = await signedIn(viewer, 'get', `/api/v1/members/cardholders?analysisId=${analysis._id}&offerIndex=${offerIndex}`);
      expect(response.status).toBe(200);
      expect(response.body.data.members.map((member) => member.name)).toEqual(['Eligible cardholder']);
      expect(response.body.data.eligibility).toMatchObject({
        productPrice: 25000,
        minimumPurchase: 5000,
        requiredReportedCreditLimit: 25000,
        availableCreditVerified: false,
        reason: 'ELIGIBLE_CRITERIA',
      });
    }

    const unknownCard = await signedIn(viewer, 'get', `/api/v1/members/cardholders?analysisId=${analysis._id}&offerIndex=5`);
    expect(unknownCard.body.data.members).toHaveLength(0);
    expect(unknownCard.body.data.eligibility.reason).toBe('CARD_NOT_IDENTIFIED');

    const minimumNotMet = await signedIn(viewer, 'get', `/api/v1/members/cardholders?analysisId=${analysis._id}&offerIndex=6`);
    expect(minimumNotMet.body.data.members).toHaveLength(0);
    expect(minimumNotMet.body.data.eligibility.reason).toBe('MINIMUM_PURCHASE_NOT_MET');

    const unknownMinimum = await signedIn(viewer, 'get', `/api/v1/members/cardholders?analysisId=${analysis._id}&offerIndex=7`);
    expect(unknownMinimum.body.data.members).toHaveLength(0);
    expect(unknownMinimum.body.data.eligibility.reason).toBe('MINIMUM_PURCHASE_UNKNOWN');

    const exactCardInOfferText = await signedIn(viewer, 'get', `/api/v1/members/cardholders?analysisId=${analysis._id}&offerIndex=8`);
    expect(exactCardInOfferText.body.data.members.map((member) => member.name)).toEqual(['Eligible cardholder']);

    const otherViewer = await createMember('Other viewer', 'other-offer-viewer@example.com');
    const privateAnalysis = await signedIn(otherViewer, 'get', `/api/v1/members/cardholders?analysisId=${analysis._id}&offerIndex=0`);
    expect(privateAnalysis.status).toBe(404);
    expect(privateAnalysis.body.error.code).toBe('ANALYSIS_NOT_AVAILABLE');

    await UserCard.updateOne({ _id: cards[0]._id }, { $set: { creditLimit: 24999 } });
    const belowLimitRequest = await signedIn(viewer, 'post', '/api/v1/deal-requests')
      .send({
        analysisId: String(analysis._id),
        offerIndex: 0,
        cardholderId: String(eligible.user._id),
        cardId: String(cards[0]._id),
        deliveryAddress: {
          recipientName: 'Buyer',
          phone: '9876543210',
          addressLine: '10 Example Road',
          pincode: '400001',
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      });
    expect(belowLimitRequest.status).toBe(409);
    expect(belowLimitRequest.body.error.code).toBe('REPORTED_CREDIT_LIMIT_TOO_LOW');

    const unknownMinimumRequest = await signedIn(viewer, 'post', '/api/v1/deal-requests')
      .send({
        analysisId: String(analysis._id),
        offerIndex: 7,
        cardholderId: String(eligible.user._id),
        cardId: String(cards[0]._id),
        deliveryAddress: {
          recipientName: 'Buyer',
          phone: '9876543210',
          addressLine: '10 Example Road',
          pincode: '400001',
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      });
    expect(unknownMinimumRequest.status).toBe(409);
    expect(unknownMinimumRequest.body.error.code).toBe('MINIMUM_PURCHASE_UNKNOWN');
  });

  it('creates deal requests from owned stored analysis values and rejects unverifiable discount types', async () => {
    const buyer = await createMember('Deal buyer', 'deal-buyer@example.com');
    const cardholder = await createMember('Deal cardholder', 'deal-cardholder@example.com', {
      cardholderDiscovery: true,
      dealFeePercent: 10,
    });
    const card = await UserCard.create({
      userId: cardholder.user._id,
      issuer: 'HDFC Bank',
      cardProduct: 'Millennia Credit Card',
      creditLimit: 10000,
      visibility: 'discoverable',
    });
    const analysis = await ProductAnalysis.create({
      userId: buyer.user._id,
      submittedUrl: 'https://www.amazon.in/dp/B0BDK62PDX',
      retailer: 'amazon',
      status: 'completed',
      extractedData: {
        productSummary: { name: 'Analyzed headphones', currentPrice: 10000 },
        offers: [
          {
            bank: 'HDFC Bank',
            title: '10% instant discount up to ₹500 on Millennia Credit Card',
            cardName: 'Millennia Credit Card',
            discountType: 'instant_discount_percentage',
            discountValue: 10,
            maximumDiscount: 500,
            minimumPurchase: 5000,
          },
          {
            bank: 'HDFC Bank',
            title: '5% cashback on Millennia Credit Card',
            cardName: 'Millennia Credit Card',
            discountType: 'cashback_percentage',
            discountValue: 5,
            minimumPurchase: 0,
          },
        ],
      },
    });
    const deliveryAddress = {
      recipientName: 'Buyer',
      phone: '9876543210',
      addressLine: '10 Example Road',
      pincode: '400001',
      city: 'Mumbai',
      state: 'Maharashtra',
    };
    const response = await signedIn(buyer, 'post', '/api/v1/deal-requests')
      .send({
        analysisId: String(analysis._id),
        offerIndex: 0,
        cardholderId: String(cardholder.user._id),
        cardId: String(card._id),
        deliveryAddress,
        product: { name: 'Forged product name', price: 1 },
        offer: { discountType: 'instant_discount_flat', discountValue: 100000 },
      });

    expect(response.status).toBe(201);
    expect(response.body.data.dealRequest.product).toMatchObject({
      name: 'Analyzed headphones',
      price: 10000,
      retailer: 'amazon',
    });
    expect(response.body.data.dealRequest.calculation).toMatchObject({
      listedPrice: 10000,
      eligibleDiscount: 500,
      commissionAmount: 50,
      platformCommissionAmount: 50,
      cardholderPayout: 9550,
      netPayable: 9600,
      estimatedSavings: 400,
    });

    const otherBuyer = await createMember('Other buyer', 'other-buyer@example.com');
    const crossAccountRequest = await signedIn(otherBuyer, 'post', '/api/v1/deal-requests')
      .send({
        analysisId: String(analysis._id),
        offerIndex: 0,
        cardholderId: String(cardholder.user._id),
        cardId: String(card._id),
        deliveryAddress,
      });
    expect(crossAccountRequest.status).toBe(404);
    expect(crossAccountRequest.body.error.code).toBe('ANALYSIS_NOT_AVAILABLE');

    const cashback = await signedIn(buyer, 'post', '/api/v1/deal-requests')
      .send({
        analysisId: String(analysis._id),
        offerIndex: 1,
        cardholderId: String(cardholder.user._id),
        cardId: String(card._id),
        deliveryAddress,
      });
    expect(cashback.status).toBe(409);
    expect(cashback.body.error.code).toBe('INSTANT_DISCOUNT_REQUIRED');

    const savedDeal = await DealRequest.findById(response.body.data.dealRequest._id).lean();
    expect(String(savedDeal.analysisId)).toBe(String(analysis._id));
    expect(savedDeal.offerIndex).toBe(0);

    const unconfirmedAgreement = await signedIn(cardholder, 'patch', `/api/v1/deal-requests/${savedDeal._id}/agree`)
      .send({});
    expect(unconfirmedAgreement.status).toBe(400);
    expect(unconfirmedAgreement.body.error.code).toBe('AVAILABLE_CREDIT_CONFIRMATION_REQUIRED');

    const agreed = await signedIn(cardholder, 'patch', `/api/v1/deal-requests/${savedDeal._id}/agree`)
      .send({ confirmAvailableCredit: true });
    expect(agreed.status).toBe(200);
    expect(agreed.body.data.dealRequest.events.at(-1).note).toContain('confirmed sufficient available credit');
    expect(agreed.body.data.dealRequest.status).toBe('agreed');
    expect(savedDeal.escrow.amount).toBeNull();
    expect(savedDeal.escrow.fundedAt).toBeNull();
    const earlyOrder = await signedIn(cardholder, 'patch', `/api/v1/deal-requests/${savedDeal._id}/place-order`);
    expect(earlyOrder.status).toBe(409);
    const funding = await signedIn(buyer, 'patch', `/api/v1/deal-requests/${savedDeal._id}/fund-escrow`);
    expect(funding.status).toBe(200);
    expect(funding.body.data.dealRequest.escrow.amount).toBe(9600);
    expect(funding.body.data.dealRequest.messages.at(-1).body).toContain('please order');
    const simulatedOrder = await signedIn(cardholder, 'patch', `/api/v1/deal-requests/${savedDeal._id}/place-order`);
    expect(simulatedOrder.status).toBe(200);
    expect(simulatedOrder.body.data.dealRequest.order.verified).toBe(false);
    const prematureDelivery = await signedIn(buyer, 'patch', `/api/v1/deal-requests/${savedDeal._id}/confirm-delivery`);
    expect(prematureDelivery.status).toBe(409);
    const outsiderVerification = await signedIn(otherBuyer, 'patch', `/api/v1/deal-requests/${savedDeal._id}/verify-order`);
    expect(outsiderVerification.status).toBe(404);
    const verification = await signedIn(buyer, 'patch', `/api/v1/deal-requests/${savedDeal._id}/verify-order`);
    expect(verification.status).toBe(200);
    expect(verification.body.data.dealRequest.order.verifiedAt).toBeTruthy();
    const delivery = await signedIn(buyer, 'patch', `/api/v1/deal-requests/${savedDeal._id}/confirm-delivery`);
    expect(delivery.status).toBe(200);
    expect(delivery.body.data.dealRequest.escrow).toMatchObject({ amount: 9600, releasedAmount: 9550, platformAmount: 50 });
    const repeatedDelivery = await signedIn(buyer, 'patch', `/api/v1/deal-requests/${savedDeal._id}/confirm-delivery`);
    expect(repeatedDelivery.status).toBe(409);
    const rating = await signedIn(buyer, 'post', `/api/v1/deal-requests/${savedDeal._id}/rating`).send({ score: 5, review: 'Helpful cardholder' });
    expect(rating.status).toBe(200);
    const repeatedRating = await signedIn(buyer, 'post', `/api/v1/deal-requests/${savedDeal._id}/rating`).send({ score: 4 });
    expect(repeatedRating.status).toBe(409);
    cardholder.user.profile.dealFeePercent = 20;
    await cardholder.user.save();
    const secondRequest = await signedIn(buyer, 'post', '/api/v1/deal-requests').send({ analysisId: String(analysis._id), offerIndex: 0, cardholderId: String(cardholder.user._id), cardId: String(card._id), deliveryAddress });
    expect(secondRequest.status).toBe(201);
    expect(secondRequest.body.data.dealRequest.calculation).toMatchObject({ commissionAmount: 100, platformCommissionAmount: 50, netPayable: 9650, cardholderPayout: 9600 });
    const declined = await signedIn(buyer, 'patch', `/api/v1/deal-requests/${secondRequest.body.data.dealRequest._id}/simulate-decline`);
    expect(declined.status).toBe(200);
    expect(declined.body.data.dealRequest.escrow.fundedAt).toBeNull();
    expect(declined.body.data.dealRequest.events.at(-1).note).toContain('simulated cardholder reply');
    const thirdRequest = await signedIn(buyer, 'post', '/api/v1/deal-requests').send({ analysisId: String(analysis._id), offerIndex: 0, cardholderId: String(cardholder.user._id), cardId: String(card._id), deliveryAddress });
    const prematureFunding = await signedIn(buyer, 'patch', `/api/v1/deal-requests/${thirdRequest.body.data.dealRequest._id}/fund-escrow`);
    expect(prematureFunding.status).toBe(409);
    const simulatedReply = await signedIn(buyer, 'patch', `/api/v1/deal-requests/${thirdRequest.body.data.dealRequest._id}/simulate-accept`);
    expect(simulatedReply.status).toBe(200);
    expect(simulatedReply.body.data.dealRequest.status).toBe('agreed');
    expect(simulatedReply.body.data.dealRequest.escrow.fundedAt).toBeNull();
    await UserCard.findByIdAndUpdate(card._id, { availableCredit: 100 });
    const lowAvailableCredit = await signedIn(buyer, 'get', `/api/v1/members/cardholders?analysisId=${analysis._id}&offerIndex=0`);
    expect(lowAvailableCredit.body.data.members.some((member) => member.memberId === String(cardholder.user._id))).toBe(false);
    const missingProduct = await signedIn(buyer, 'post', '/api/v1/deal-requests').send({ cardholderId: String(cardholder.user._id), deliveryAddress });
    expect(missingProduct.status).toBe(400);
  });

  it('only allows connection requests to discoverable members with discoverable card listings', async () => {
    const sender = await createMember('Connection sender', 'connection-sender@example.com');
    const hidden = await createMember('Hidden recipient', 'hidden-recipient@example.com');
    const visible = await createMember('Visible recipient', 'visible-recipient@example.com', { cardholderDiscovery: true });
    await UserCard.create({
      userId: visible.user._id,
      issuer: 'Example Bank',
      cardProduct: 'Visible Card',
      visibility: 'discoverable',
    });

    const hiddenResponse = await signedIn(sender, 'post', '/api/v1/connections')
      .send({ targetUserId: String(hidden.user._id) });
    expect(hiddenResponse.status).toBe(404);

    const visibleResponse = await signedIn(sender, 'post', '/api/v1/connections')
      .send({ targetUserId: String(visible.user._id), message: 'I would like to learn about your card offers.' });
    expect(visibleResponse.status).toBe(201);
    expect(visibleResponse.body.data.connection.message).toBe('I would like to learn about your card offers.');
  });

  it('creates private-by-account saved offers and allows only their owner to remove them', async () => {
    const owner = await createMember('Deal owner', 'deal-owner@example.com');
    const other = await createMember('Other member', 'deal-other@example.com');
    const analysis = await ProductAnalysis.create({
      userId: owner.user._id,
      submittedUrl: 'https://www.amazon.in/dp/B0BDK62PDX',
      retailer: 'amazon',
      status: 'completed',
      extractedData: {
        offers: [{ bank: 'Example Bank', title: 'Card offer', minimumPurchase: 5000 }],
      },
    });
    const privateAnalysis = await request(app).get(`/api/v1/products/analyses/${analysis._id}`);
    expect(privateAnalysis.status).toBe(404);
    const ownerAnalysis = await signedIn(owner, 'get', `/api/v1/products/analyses/${analysis._id}`);
    expect(ownerAnalysis.status).toBe(200);

    const saved = await signedIn(owner, 'post', '/api/v1/saved-deals')
      .send({ analysisId: String(analysis._id), offerIndex: 0 });
    expect(saved.status).toBe(201);
    const savedDealId = saved.body.data.savedDeal._id;

    const privateList = await signedIn(other, 'get', '/api/v1/saved-deals');
    expect(privateList.body.data.savedDeals).toHaveLength(0);
    const forbiddenDelete = await signedIn(other, 'delete', `/api/v1/saved-deals/${savedDealId}`);
    expect(forbiddenDelete.status).toBe(404);

    const deleted = await signedIn(owner, 'delete', `/api/v1/saved-deals/${savedDealId}`);
    expect(deleted.status).toBe(200);
  });

  it('creates groups and community posts while limiting group posts to members', async () => {
    const creator = await createMember('Group creator', 'group-creator@example.com');
    const member = await createMember('Group member', 'group-member@example.com');
    const outsider = await createMember('Group outsider', 'group-outsider@example.com');
    const created = await signedIn(creator, 'post', '/api/v1/groups')
      .send({ name: 'Travel cards', description: 'Travel rewards', visibility: 'public' });
    expect(created.status).toBe(201);
    const groupId = created.body.data.group._id;

    const publicGroupPost = await signedIn(creator, 'post', '/api/v1/posts')
      .send({ body: 'A public group tip', groupId });
    expect(publicGroupPost.status).toBe(201);
    const privateGroup = await signedIn(creator, 'post', '/api/v1/groups')
      .send({ name: 'Private cards', description: 'Members only', visibility: 'private' });
    const groupPost = await signedIn(creator, 'post', '/api/v1/posts')
      .send({ body: 'A private group tip', groupId: privateGroup.body.data.group._id });
    expect(groupPost.status).toBe(201);
    const hiddenBeforeJoin = await signedIn(member, 'get', '/api/v1/posts');
    expect(hiddenBeforeJoin.body.data.posts).toHaveLength(1);
    expect(hiddenBeforeJoin.body.data.posts[0].body).toBe('A public group tip');

    const joined = await signedIn(member, 'post', `/api/v1/groups/${groupId}/join`).send({});
    expect(joined.status).toBe(200);
    const visibleAfterJoin = await signedIn(member, 'get', '/api/v1/posts');
    expect(visibleAfterJoin.body.data.posts).toHaveLength(1);

    const hiddenFromOutsider = await signedIn(outsider, 'get', '/api/v1/posts');
    expect(hiddenFromOutsider.body.data.posts).toHaveLength(1);
    expect(hiddenFromOutsider.body.data.posts[0].body).toBe('A public group tip');
    const visibleToCreator = await signedIn(creator, 'get', '/api/v1/posts');
    expect(visibleToCreator.body.data.posts).toHaveLength(2);
  });

  it('allows persistent direct messages only between accepted connections', async () => {
    const sender = await createMember('Message sender', 'message-sender@example.com');
    const recipient = await createMember('Message recipient', 'message-recipient@example.com');
    const stranger = await createMember('Stranger', 'message-stranger@example.com');

    const denied = await signedIn(sender, 'post', '/api/v1/conversations')
      .send({ recipientId: String(recipient.user._id) });
    expect(denied.status).toBe(403);

    await Connection.create({
      requesterId: sender.user._id,
      recipientId: recipient.user._id,
      status: 'accepted',
    });
    const started = await signedIn(sender, 'post', '/api/v1/conversations')
      .send({ recipientId: String(recipient.user._id) });
    expect(started.status).toBe(200);
    const conversationId = started.body.data.conversation._id;

    const sent = await signedIn(sender, 'post', `/api/v1/conversations/${conversationId}/messages`)
      .send({ body: 'Hello from CardBridge.' });
    expect(sent.status).toBe(201);
    const received = await signedIn(recipient, 'get', `/api/v1/conversations/${conversationId}/messages`);
    expect(received.body.data.messages).toHaveLength(1);
    expect(received.body.data.messages[0].body).toBe('Hello from CardBridge.');

    const inaccessible = await signedIn(stranger, 'get', `/api/v1/conversations/${conversationId}/messages`);
    expect(inaccessible.status).toBe(404);
  });

  it('blocks excessive authentication requests with an explicit rate-limit response', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app).post('/api/v1/auth/register').send({});
      expect(response.status).toBe(400);
    }

    const blocked = await request(app).post('/api/v1/auth/register').send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
    expect(blocked.body.error.code).toBe('AUTH_RATE_LIMITED');
    expect(blocked.body.meta.requestId).toBeTruthy();
    expect(blocked.headers['ratelimit-limit']).toBe('5');
  });

  it('allows browser preflight for the CSRF header on protected account mutations', async () => {
    const response = await request(app)
      .options('/api/v1/auth/logout')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,x-csrf-token');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-headers']).toContain('X-CSRF-Token');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});
