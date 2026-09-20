import api from './api.js';

export const getMyClaims = async () => {
  const { data } = await api.get('/claims/my');
  return data.data.claims;
};

export const getClaimById = async (claimId) => {
  const { data } = await api.get(`/claims/${claimId}`);
  return data.data.claim;
};

export const getAllClaims = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );
  const { data } = await api.get('/claims', { params });
  return data.data.claims;
};

export const updateClaimStatus = async (claimId, payload) => {
  const { data } = await api.patch(`/claims/${claimId}/status`, payload);
  return data.data.claim;
};

export const submitClaim = async (formData) => {
  const { data } = await api.post('/claims', formData);
  return data.data.claim;
};
