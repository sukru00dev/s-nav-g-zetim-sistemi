const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('Authorization');

  // Check if not token
  if (!token) {
    return res.status(401).json({ message: 'Token bulunamadı, yetkilendirme reddedildi.' });
  }

  try {
    // Verify token (Bearer <token> format)
    const tokenPart = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    
    const decoded = jwt.verify(tokenPart, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Geçersiz Token.' });
  }
};
