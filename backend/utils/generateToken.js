const jwt = require('jsonwebtoken');

const expiryMs = (value) => {
  const match = /^([1-9]\d*)([smhd])$/.exec(value || '1d');
  if (!match) return 86400000;
  return Number(match[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
};

const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Kapag magkaiba ang frontend at backend domain sa Vercel, kailangan 'none' at secure: true
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    expires: new Date(Date.now() + expiryMs(process.env.JWT_EXPIRES_IN))
  };
};

module.exports = (user, res) => {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  res.cookie('token', token, cookieOptions());
  return token;
};

module.exports.cookieOptions = cookieOptions;