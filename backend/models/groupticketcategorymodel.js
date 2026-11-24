import mongoose from 'mongoose';

const groupTicketCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, default: '' },
    logo: { type: String, default: '' },
    tagline: { type: String, default: '', trim: true },
    isSyncImported: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('GroupTicketCategory', groupTicketCategorySchema);
