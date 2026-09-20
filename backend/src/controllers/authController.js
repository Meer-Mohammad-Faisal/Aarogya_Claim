import User from '../models/User.js';
import { createAccessToken } from '../utils/jwt.js';

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    response.json({
      success: true,
      data: {
        token: createAccessToken(user),
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = (request, response) => {
  response.json({
    success: true,
    data: { user: request.user.toSafeObject() },
  });
};
