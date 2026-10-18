import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    retailer: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    canonicalProductUrl: {
      type: String,
      required: true,
      trim: true,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    availability: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'pre_order', 'unknown'],
      default: 'in_stock',
    },
    productIdentifiers: {
      asin: { type: String, trim: true, sparse: true, index: true },
      fsn: { type: String, trim: true, sparse: true, index: true },
      sku: { type: String, trim: true },
    },
    lastPriceCheckedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    priceStatus: {
      type: String,
      enum: ['current', 'stale', 'unverified'],
      default: 'current',
    },
    sourceMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

productSchema.index({ retailer: 1, canonicalProductUrl: 1 }, { unique: true });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;

