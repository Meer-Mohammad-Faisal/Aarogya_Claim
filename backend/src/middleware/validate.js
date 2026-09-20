export const validate = (schema) => (request, _response, next) => {
  const { error, value } = schema(request.body);

  if (error) {
    const validationError = new Error(error.message);
    validationError.statusCode = 400;
    next(validationError);
    return;
  }

  request.body = value;
  next();
};
