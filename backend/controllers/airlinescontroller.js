import mongoose from 'mongoose';
import Airline from '../models/airlinesmodel.js';

// Body se sirf wahi fields lo jo model mein hain
const pickFields = (body) => {
  const fields = {};
  ['name', 'network', 'logo'].forEach((key) => {
    if (body[key] !== undefined) fields[key] = body[key];
  });
  return fields;
};

// GET /api/airlines
export const getAirlines = async (req, res) => {
  try {
    const records = await Airline.find().sort({ createdAt: 1 }).lean();
    const names = new Set();
    const airlines = records.filter((airline) => {
      const name = airline.name.trim().toLowerCase();
      if (names.has(name)) return false;
      names.add(name);
      return true;
    });
    res.json({ success: true, data: airlines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/airlines/:id
export const getAirline = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid airline id' });
    }

    const item = await Airline.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Airline not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/airlines
export const createAirline = async (req, res) => {
  try {
    const fields = pickFields(req.body);
    fields.name = String(fields.name || '').trim();
    fields.logo = String(fields.logo || '').trim();
    if (!fields.logo) {
      return res.status(400).json({ success: false, message: 'Upload a logo first.' });
    }
    const existing = await Airline.findOne({ name: fields.name })
      .collation({ locale: 'en', strength: 2 });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An airline with this name already exists.' });
    }
    const item = await Airline.create(fields);
    res.status(201).json({ success: true, message: 'Airline created', data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/airlines/:id
export const updateAirline = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid airline id' });
    }

    const updates = pickFields(req.body);
    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();
      const existing = await Airline.findOne({ _id: { $ne: id }, name: updates.name })
        .collation({ locale: 'en', strength: 2 });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An airline with this name already exists.' });
      }
    }
    if (updates.logo !== undefined) {
      updates.logo = String(updates.logo || '').trim();
      if (!updates.logo) {
        return res.status(400).json({ success: false, message: 'Upload a logo first.' });
      }
    }

    const item = await Airline.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Airline not found' });
    }
    res.json({ success: true, message: 'Airline updated', data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/airlines/:id
export const deleteAirline = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid airline id' });
    }

    const item = await Airline.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Airline not found' });
    }
    res.json({ success: true, message: 'Airline deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};