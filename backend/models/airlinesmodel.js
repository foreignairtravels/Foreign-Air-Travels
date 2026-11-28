import mongoose from 'mongoose';

const airlineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    network: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Airline', airlineSchema);