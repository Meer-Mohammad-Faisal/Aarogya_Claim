export const requireRole = (...allowedRoles) => (request, _response, next) => {
  if (!request.user || !allowedRoles.includes(request.user.role)) {
    const error = new Error('You do not have permission to access this resource');
    error.statusCode = 403;
    next(error);
    return;
  }

  next();
};
