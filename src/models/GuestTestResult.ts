import mongoose from 'mongoose';

const guestTestResultSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  answers: [{
    questionId: String,
    answer: String
  }],
  result: {
    type: Map,
    of: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  }
});

// Create TTL index
guestTestResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const GuestTestResult = mongoose.models.GuestTestResult || mongoose.model('GuestTestResult', guestTestResultSchema); 