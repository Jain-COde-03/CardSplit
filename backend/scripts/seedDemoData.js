import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import User from '../src/models/User.js';
import UserCard from '../src/models/UserCard.js';
import Product from '../src/models/Product.js';
import ProductAnalysis from '../src/models/ProductAnalysis.js';
import SavedDeal from '../src/models/SavedDeal.js';
import Group from '../src/models/Group.js';
import Post from '../src/models/Post.js';
import Connection from '../src/models/Connection.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';

const DEMO_PASSWORD = 'BridgeDemo2026!';
const ids = {
  memberZero: '64f000000000000000000001',
  memberOne: '64f000000000000000000002',
  memberTwo: '64f000000000000000000003',
  product: '64f000000000000000000101',
  analysis: '64f000000000000000000201',
  savedDeal: '64f000000000000000000301',
  group: '64f000000000000000000401',
  postOne: '64f000000000000000000501',
  postTwo: '64f000000000000000000502',
  postThree: '64f000000000000000000503',
  cardOne: '64f000000000000000000601',
  cardTwo: '64f000000000000000000602',
  cardThree: '64f000000000000000000603',
  connection: '64f000000000000000000701',
  conversation: '64f000000000000000000801',
  messageOne: '64f000000000000000000901',
  messageTwo: '64f000000000000000000902',
};
const additionalMembers = [
  ['Ananya Rao', 'Bengaluru', 'HDFC Bank', 'Millennia Credit Card'],
  ['Kabir Shah', 'Mumbai', 'SBI Card', 'Cashback Credit Card'],
  ['Isha Nair', 'Kochi', 'ICICI Bank', 'Amazon Pay Credit Card'],
  ['Rohan Mehta', 'Delhi', 'Axis Bank', 'ACE Credit Card'],
  ['Zoya Khan', 'Hyderabad', 'HDFC Bank', 'Regalia Gold Credit Card'],
  ['Arjun Iyer', 'Chennai', 'SBI Card', 'Cashback Credit Card'],
  ['Meera Joshi', 'Pune', 'Kotak Mahindra Bank', 'League Platinum Credit Card'],
  ['Vivaan Das', 'Kolkata', 'Axis Bank', 'ACE Credit Card'],
  ['Tara Menon', 'Bengaluru', 'ICICI Bank', 'Coral Credit Card'],
  ['Aditya Verma', 'Noida', 'HDFC Bank', 'Millennia Credit Card'],
  ['Sana Ali', 'Jaipur', 'SBI Card', 'SimplyCLICK Credit Card'],
  ['Ishaan Bose', 'Mumbai', 'Axis Bank', 'Atlas Credit Card'],
  ['Diya Kapoor', 'Hyderabad', 'ICICI Bank', 'Amazon Pay Credit Card'],
  ['Reyansh Gupta', 'Lucknow', 'Kotak Mahindra Bank', 'Mojo Platinum Credit Card'],
  ['Kiara Reddy', 'Chennai', 'HDFC Bank', 'Millennia Credit Card'],
  ['Ayaan Sethi', 'Chandigarh', 'SBI Card', 'Cashback Credit Card'],
  ['Myra Kulkarni', 'Pune', 'Axis Bank', 'ACE Credit Card'],
  ['Neil D’Souza', 'Goa', 'ICICI Bank', 'Coral Credit Card'],
  ['Pari Bansal', 'Ahmedabad', 'HDFC Bank', 'Regalia Gold Credit Card'],
  ['Devika Pillai', 'Kochi', 'SBI Card', 'SimplyCLICK Credit Card'],
  ['Kian Thomas', 'Bengaluru', 'Kotak Mahindra Bank', 'League Platinum Credit Card'],
  ['Aditi Chawla', 'Gurugram', 'Axis Bank', 'ACE Credit Card'],
];

async function upsertById(Model, id, values) {
  return Model.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: values },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
  );
}

async function upsertDemoUser({ id, name, email, city, bio, discoverable, dealFeePercent, responseMinutes }) {
  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        passwordHash,
        emailVerified: true,
        accountStatus: 'active',
        profile: { city, bio, cardholderDiscovery: discoverable, dealFeePercent, responseMinutes },
      },
      $setOnInsert: { _id: new mongoose.Types.ObjectId(id) },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
  );
}

async function upsertDemoCard(user, issuer, cardProduct, details) {
  return UserCard.findOneAndUpdate(
    { userId: user._id, issuer, cardProduct },
    { $set: { ...details, visibility: 'discoverable', ownershipVerificationStatus: 'unverified' } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

function nextId(id, offset) {
  return new mongoose.Types.ObjectId((BigInt(`0x${id}`) + BigInt(offset)).toString(16).padStart(24, '0'));
}

async function resetDemoData() {
  const demoUsers = await User.find({ email: /@cardbridge\.test$/i }).select('_id').lean();
  const demoUserIds = demoUsers.map((user) => user._id);
  const demoGroupIds = await Group.find({
    $or: [{ _id: ids.group }, { createdBy: { $in: demoUserIds } }],
  }).distinct('_id');
  const demoConversationIds = await Conversation.find({
    $or: [{ _id: ids.conversation }, { participantIds: { $in: demoUserIds } }],
  }).distinct('_id');

  await Group.updateMany({ memberIds: { $in: demoUserIds } }, { $pullAll: { memberIds: demoUserIds } });
  await Promise.all([
    Message.deleteMany({
      $or: [
        { _id: { $in: [ids.messageOne, ids.messageTwo] } },
        { conversationId: { $in: demoConversationIds } },
      ],
    }),
    Conversation.deleteMany({ _id: { $in: demoConversationIds } }),
    Connection.deleteMany({
      $or: [
        { _id: ids.connection },
        { requesterId: { $in: demoUserIds } },
        { recipientId: { $in: demoUserIds } },
      ],
    }),
    Post.deleteMany({
      $or: [
        { _id: { $in: [ids.postOne, ids.postTwo, ids.postThree] } },
        { authorId: { $in: demoUserIds } },
        { groupId: { $in: demoGroupIds } },
      ],
    }),
    Group.deleteMany({ _id: { $in: demoGroupIds } }),
    SavedDeal.deleteMany({
      $or: [{ _id: ids.savedDeal }, { userId: { $in: demoUserIds } }],
    }),
    ProductAnalysis.deleteMany({
      $or: [{ _id: ids.analysis }, { userId: { $in: demoUserIds } }],
    }),
    Product.deleteOne({ _id: ids.product }),
    UserCard.deleteMany({ userId: { $in: demoUserIds } }),
    User.deleteMany({ _id: { $in: demoUserIds } }),
  ]);
}

const resetRequested = process.argv.includes('--reset');
if (resetRequested && env.NODE_ENV !== 'development') {
  throw new Error('Demo data reset is allowed only when NODE_ENV=development.');
}
if (resetRequested) {
  const mongoHost = new URL(env.MONGODB_URI).hostname;
  if (!['localhost', '127.0.0.1', '::1'].includes(mongoHost) && process.env.ALLOW_REMOTE_DEMO_RESET !== 'true') {
    throw new Error('Refusing to reset demo data on a remote MongoDB host without ALLOW_REMOTE_DEMO_RESET=true.');
  }
}

if (env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_DATA !== 'true') {
  throw new Error('Refusing to seed demo accounts in production. Set ALLOW_DEMO_DATA=true only for an isolated judging database.');
}

const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

try {
  await connectDatabase();

  if (resetRequested) await resetDemoData();

  const [memberZero, memberOne, memberTwo] = await Promise.all([
    upsertDemoUser({ id: ids.memberZero, name: 'Aarav Sharma', email: 'aarav@cardbridge.test', city: 'Mumbai', bio: 'Card enthusiast. Sample member profile for presentation.', discoverable: true, dealFeePercent: 0, responseMinutes: 4 }),
    upsertDemoUser({ id: ids.memberOne, name: 'Mira Kapoor', email: 'mira@cardbridge.test', city: 'Bengaluru', bio: 'E-commerce shopper sharing member-reported card benefits.', discoverable: true, dealFeePercent: 10, responseMinutes: 2 }),
    upsertDemoUser({ id: ids.memberTwo, name: 'Dev Malhotra', email: 'dev@cardbridge.test', city: 'Pune', bio: 'Cardholder sharing sample savings details with the community.', discoverable: true, dealFeePercent: 20, responseMinutes: 12 }),
  ]);
  await UserCard.deleteOne({
    userId: memberZero._id,
    issuer: 'ICICI Bank',
    cardProduct: 'Amazon Pay Credit Card · Demo listing',
  });
  const moreMembers = await Promise.all(additionalMembers.map(([name, city, issuer, cardProduct], index) =>
    upsertDemoUser({
      id: `64f0000000000000000000${(index + 4).toString(16).padStart(2, '0')}`,
      name,
      email: `member${String(index + 1).padStart(2, '0')}@cardbridge.test`,
      city,
      bio: 'Sample member profile. Card details and deal terms are self-reported.',
      discoverable: true,
      dealFeePercent: [0, 10, 20][index % 3],
      responseMinutes: [3, 7, 12, 18, 25][index % 5],
    }).then((user) => ({ user, issuer, cardProduct }))
  ));
  const demoMembers = [memberOne, memberTwo, ...moreMembers.map(({ user }) => user), memberZero];
  if (demoMembers.length !== 25 || new Set(demoMembers.map((member) => member.email)).size !== 25) {
    throw new Error('Demo seed data must contain exactly 25 unique sample accounts.');
  }

  const product = await upsertById(Product, ids.product, {
    name: 'Demo headphones · Sample product',
    description: 'Fictional product data for the CardBridge judging walkthrough.',
    brand: 'Demo Audio',
    category: 'Electronics',
    retailer: 'amazon',
    canonicalProductUrl: 'https://www.amazon.in/dp/B0DEMO0001',
    currentPrice: 24999,
    currency: 'INR',
    availability: 'in_stock',
    lastPriceCheckedAt: new Date(),
    priceStatus: 'unverified',
    sourceMetadata: { demoData: true, note: 'Illustrative; not retrieved from Amazon.' },
  });

  const offers = [
    {
      title: 'DEMO ONLY — 10% instant discount up to ₹1,500 on HDFC Bank Millennia Credit Card. Minimum purchase ₹5,000.',
      bank: 'HDFC Bank', discountType: 'instant_discount_percentage', discountValue: 10,
      cardName: 'Millennia Credit Card',
      maximumDiscount: 1500, minimumPurchase: 5000, verificationStatus: 'unverified', retailer: 'amazon', source: 'demo',
    },
    {
      title: 'DEMO ONLY — 5% cashback on Amazon Pay ICICI Bank Credit Card. Cashback is delayed.',
      bank: 'ICICI Bank', discountType: 'cashback_percentage', discountValue: 5,
      cardName: 'Amazon Pay Credit Card',
      maximumDiscount: null, minimumPurchase: 0, verificationStatus: 'unverified', retailer: 'amazon', source: 'demo',
    },
  ];

  const analysis = await upsertById(ProductAnalysis, ids.analysis, {
    userId: memberZero._id,
    submittedUrl: product.canonicalProductUrl,
    retailer: 'amazon',
    status: 'completed',
    productId: product._id,
    extractedData: {
      demoData: true,
      productSummary: { id: String(product._id), name: product.name, currentPrice: product.currentPrice, availability: product.availability },
      offersFoundCount: offers.length,
      offers,
    },
    startedAt: new Date(Date.now() - 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 55 * 60 * 1000),
  });

  await UserCard.deleteMany({ userId: { $in: demoMembers.map((member) => member._id) }, cardProduct: / · Demo listing$/ });
  await Promise.all([
    ...demoMembers.map((member, index) => {
      const profile = index === 24
        ? ['HDFC Bank', 'Millennia Credit Card', 450000, 'Annual spend target: ₹10L for fee waiver and bonus points', 'Member-reported milestone benefit; verify current issuer terms.']
        : index < 2
        ? index === 0
          ? ['HDFC Bank', 'Millennia Credit Card', 280000, 'Monthly online spend reward target', 'Member-reported online purchase cashback; verify current issuer terms.']
          : ['ICICI Bank', 'Amazon Pay Credit Card', 240000, 'Quarterly shopping spend target', 'Member-reported shopping reward; verify current issuer terms.']
        : [moreMembers[index - 2].issuer, moreMembers[index - 2].cardProduct, [320000, 190000, 350000, 260000][(index - 2) % 4], 'Sample annual spend milestone; check issuer terms.', 'Member-reported card benefit; verify current issuer terms.'];
      return upsertDemoCard(member, profile[0], profile[1], { creditLimit: profile[2], milestone: profile[3], benefit: profile[4] });
    }),
    upsertById(SavedDeal, ids.savedDeal, { userId: memberZero._id, productId: product._id, analysisId: analysis._id, offerSnapshot: offers[0] }),
  ]);

  const group = await upsertById(Group, ids.group, {
    name: 'Demo · Everyday card savings',
    description: 'A fictional sample group for the CardBridge judging walkthrough.',
    visibility: 'public',
    createdBy: memberZero._id,
    memberIds: demoMembers.map((member) => member._id),
  });

  const starterPosts = [
    upsertById(Post, ids.postOne, { authorId: memberZero._id, groupId: group._id, body: 'DEMO POST — Comparing immediate discounts separately from later cashback makes the checkout choice easier to understand.' }),
    upsertById(Post, ids.postTwo, { authorId: memberOne._id, groupId: group._id, body: 'DEMO POST — Always check minimum spend and eligible transaction types before relying on a card offer.' }),
    upsertById(Post, ids.postThree, { authorId: memberTwo._id, groupId: null, body: 'DEMO POST — Sample community content for the CardBridge hackathon presentation.' }),
  ];
  const memberPostBodies = [
    'DEMO POST — I compare the amount due today separately from rewards that may arrive later.',
    'DEMO POST — Check the minimum purchase and eligible payment method in the offer terms.',
    'DEMO POST — Sample community note: these profiles and offers are fictional presentation data.',
    'DEMO POST — A card listing does not confirm ownership or eligibility for any promotion.',
  ];
  const memberPosts = demoMembers.slice(2).map((member, index) => upsertById(Post, nextId(ids.postThree, index + 1), {
    authorId: member._id,
    groupId: index % 2 === 0 ? group._id : null,
    body: memberPostBodies[index % memberPostBodies.length],
  }));

  await Promise.all([
    ...starterPosts,
    ...memberPosts,
    upsertById(Connection, ids.connection, { requesterId: memberZero._id, recipientId: memberOne._id, status: 'accepted' }),
    upsertById(Conversation, ids.conversation, { participantIds: [memberZero._id, memberOne._id], lastMessageAt: new Date(Date.now() - 5 * 60 * 1000) }),
  ]);

  await Promise.all([
    upsertById(Message, ids.messageOne, { conversationId: new mongoose.Types.ObjectId(ids.conversation), senderId: memberOne._id, body: 'DEMO MESSAGE — This conversation is fictional sample content.' }),
    upsertById(Message, ids.messageTwo, { conversationId: new mongoose.Types.ObjectId(ids.conversation), senderId: memberZero._id, body: 'Thanks! I’m comparing the terms in the sample analysis.' }),
  ]);

  const seededCards = await UserCard.find({ userId: { $in: demoMembers.map((member) => member._id) } }).lean();
  const seededDemoAccountCount = await User.countDocuments({ email: /@cardbridge\.test$/i });
  const invalidCardCount = seededCards.filter((card) => card.visibility !== 'discoverable'
    || !Number.isFinite(card.creditLimit)
    || card.creditLimit < product.currentPrice).length;
  const invalidProfileCount = demoMembers.filter((member) => member.profile.cardholderDiscovery !== true).length;
  if (seededCards.length !== 25 || invalidCardCount > 0 || invalidProfileCount > 0
    || (resetRequested && seededDemoAccountCount !== 25)) {
    throw new Error('Demo data validation failed: expected 25 opted-in accounts, each with one discoverable card and a sufficient reported limit.');
  }

  console.log('CardBridge sample user data is ready.');
  console.log('Seeded 25 fictional sample accounts.');
  console.log('All accounts use the shared password: ' + DEMO_PASSWORD);
  console.log('All included offers, profiles, posts, and conversations are fictional demo data.');
} finally {
  await disconnectDatabase();
}
