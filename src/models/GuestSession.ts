import mongoose from 'mongoose';

const guestSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  testCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours in seconds - MongoDB TTL index
  }
});

// Create TTL index
guestSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const GuestSession = mongoose.models.GuestSession || mongoose.model('GuestSession', guestSessionSchema); 