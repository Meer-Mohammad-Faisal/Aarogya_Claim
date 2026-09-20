import mongoose from 'mongoose';
import Claim from '../models/Claim.js';
import { deleteClaimDocument, uploadClaimDocument } from '../utils/cloudinary.js';

const allowedStatuses = new Set(['Pending', 'Approved', 'Rejected']);

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseClaimAmount = (value) => {
  const amount = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw createHttpError(400, 'claimAmount must be a positive number');
  }

  return amount;
};

const parseNonNegativeAmount = (value, fieldName) => {
  const amount = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw createHttpError(400, `${fieldName} must be a non-negative number`);
  }

  return amount;
};

const parseDate = (value, fieldName) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const calendarDate = new Date(Date.UTC(year, month - 1, day));

    if (
      calendarDate.getUTCFullYear() !== year
      || calendarDate.getUTCMonth() !== month - 1
      || calendarDate.getUTCDate() !== day
    ) {
      throw createHttpError(400, `${fieldName} must be a valid date`);
    }
  }

  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    throw createHttpError(400, `${fieldName} must be a valid date`);
  }

  return date;
};

const startOfUtcDay = (date) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate(),
));

const endOfUtcDay = (date) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate(),
  23,
  59,
  59,
  999,
));

const getDateRange = (query) => {
  const { submissionDate, from, to } = query;

  if (submissionDate && (from || to)) {
    throw createHttpError(400, 'Use submissionDate or from/to, not both');
  }

  if (submissionDate) {
    const date = parseDate(submissionDate, 'submissionDate');
    return { $gte: startOfUtcDay(date), $lte: endOfUtcDay(date) };
  }

  if (!from && !to) {
    return null;
  }

  const range = {};

  if (from) {
    range.$gte = parseDate(from, 'from');
  }

  if (to) {
    range.$lte = parseDate(to, 'to');
  }

  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    throw createHttpError(400, 'from must be earlier than or equal to to');
  }

  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    range.$gte = startOfUtcDay(range.$gte);
  }

  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    range.$lte = endOfUtcDay(range.$lte);
  }

  return range;
};

const getClaimsFilter = (query) => {
  const filter = {};

  if (query.status) {
    if (!allowedStatuses.has(query.status)) {
      throw createHttpError(400, 'status must be Pending, Approved, or Rejected');
    }

    filter.status = query.status;
  }

  const hasMinimum = query.minAmount !== undefined;
  const hasMaximum = query.maxAmount !== undefined;

  if (hasMinimum || hasMaximum) {
    filter.claimAmount = {};

    if (hasMinimum) {
      filter.claimAmount.$gte = parseNonNegativeAmount(query.minAmount, 'minAmount');
    }

    if (hasMaximum) {
      filter.claimAmount.$lte = parseNonNegativeAmount(query.maxAmount, 'maxAmount');
    }

    if (
      filter.claimAmount.$gte !== undefined
      && filter.claimAmount.$lte !== undefined
      && filter.claimAmount.$gte > filter.claimAmount.$lte
    ) {
      throw createHttpError(400, 'minAmount must be less than or equal to maxAmount');
    }
  }

  const dateRange = getDateRange(query);
  if (dateRange) {
    filter.submissionDate = dateRange;
  }

  return filter;
};

const ensureObjectId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createHttpError(400, 'Invalid claim ID');
  }
};

const getClaimForUser = async (id, user) => {
  ensureObjectId(id);
  const claim = await Claim.findById(id);

  if (!claim) {
    throw createHttpError(404, 'Claim not found');
  }

  if (user.role === 'patient' && claim.patientId.toString() !== user._id.toString()) {
    throw createHttpError(403, 'You do not have permission to access this claim');
  }

  return claim;
};

export const createClaim = async (request, response, next) => {
  let uploadedDocument;

  try {
    const { name, email, description } = request.body;

    if (!name || !name.trim()) {
      throw createHttpError(400, 'name is required');
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      throw createHttpError(400, 'A valid email is required');
    }

    if (email.trim().toLowerCase() !== request.user.email) {
      throw createHttpError(400, 'Claim email must match the authenticated patient email');
    }

    if (!description || !description.trim()) {
      throw createHttpError(400, 'description is required');
    }

    if (!request.file) {
      throw createHttpError(400, 'Supporting document is required');
    }

    const claimAmount = parseClaimAmount(request.body.claimAmount);
    uploadedDocument = await uploadClaimDocument(request.file.buffer);

    const claim = await Claim.create({
      patientId: request.user._id,
      name: name.trim(),
      email: request.user.email,
      claimAmount,
      description: description.trim(),
      document: uploadedDocument.url,
    });

    response.status(201).json({ success: true, data: { claim } });
  } catch (error) {
    if (uploadedDocument?.publicId) {
      try {
        await deleteClaimDocument(uploadedDocument);
      } catch (cleanupError) {
        console.error(`Unable to clean up uploaded claim document: ${cleanupError.message}`);
      }
    }

    next(error);
  }
};

export const getMyClaims = async (request, response, next) => {
  try {
    const claims = await Claim.find({ patientId: request.user._id }).sort({ submissionDate: -1 });
    response.json({ success: true, data: { claims } });
  } catch (error) {
    next(error);
  }
};

export const getAllClaims = async (request, response, next) => {
  try {
    const claims = await Claim.find(getClaimsFilter(request.query)).sort({ submissionDate: -1 });
    response.json({ success: true, data: { claims } });
  } catch (error) {
    next(error);
  }
};

export const getClaimById = async (request, response, next) => {
  try {
    const claim = await getClaimForUser(request.params.id, request.user);
    response.json({ success: true, data: { claim } });
  } catch (error) {
    next(error);
  }
};

export const updateClaimStatus = async (request, response, next) => {
  try {
    const { status, approvedAmount, insurerComments } = request.body;

    if (!allowedStatuses.has(status)) {
      throw createHttpError(400, 'status must be Pending, Approved, or Rejected');
    }

    if (insurerComments !== undefined && typeof insurerComments !== 'string') {
      throw createHttpError(400, 'insurerComments must be a string');
    }

    const claim = await getClaimForUser(request.params.id, request.user);
    const update = {
      status,
      insurerComments: insurerComments === undefined ? claim.insurerComments : insurerComments.trim(),
    };

    if (status === 'Approved') {
      if (approvedAmount === undefined || approvedAmount === null || approvedAmount === '') {
        throw createHttpError(400, 'approvedAmount is required when status is Approved');
      }

      update.approvedAmount = parseNonNegativeAmount(approvedAmount, 'approvedAmount');

      if (update.approvedAmount > claim.claimAmount) {
        throw createHttpError(400, 'approvedAmount cannot exceed claimAmount');
      }
    } else if (approvedAmount !== undefined && approvedAmount !== null && approvedAmount !== '' && Number(approvedAmount) !== 0) {
      throw createHttpError(400, `approvedAmount must be 0 or null when status is ${status}`);
    } else {
      update.approvedAmount = null;
    }

    Object.assign(claim, update);
    await claim.save();

    response.json({ success: true, data: { claim } });
  } catch (error) {
    next(error);
  }
};
