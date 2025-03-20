// middleware/roleCheck.js - Role-based authorization middleware
module.exports = function(roles) {
    return (req, res, next) => {
      // Check if user has the required role
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Access denied: insufficient permissions' 
        });
      }
      next();
    };
  };