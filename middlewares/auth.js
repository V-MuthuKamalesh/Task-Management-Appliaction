import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  const publicRoutes = ['/users/login', '/users/register'];
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token not provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authenticate;
