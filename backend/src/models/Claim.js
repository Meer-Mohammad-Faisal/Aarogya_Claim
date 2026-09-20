import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    claimAmount: {
      type: Number,
      required: [true, 'Claim amount is required'],
      min: [0.01, 'Claim amount must be greater than zero'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
    },
    document: {
      type: String,
      required: [true, 'Supporting document is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    approvedAmount: {
      type: Number,
      min: [0, 'Approved amount cannot be negative'],
      default: null,
    },
    insurerComments: {
      type: String,
      trim: true,
      maxlength: [2000, 'Insurer comments must be at most 2000 characters long'],
      default: '',
    },
  },
  { timestamps: true },
);

claimSchema.index({ patientId: 1, submissionDate: -1 });

const Claim = mongoose.model('Claim', claimSchema);

export default Claim;
