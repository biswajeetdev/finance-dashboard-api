const PERMISSIONS = {
  viewer: [
    'read:records',
    'read:dashboard'
  ],
  analyst: [
    'read:records',
    'read:dashboard',
    'write:records',
    'read:users'
  ],
  admin: [
    'read:records',
    'write:records',
    'delete:records',
    'read:dashboard',
    'read:users',
    'write:users',
    'delete:users'
  ]
};

module.exports = (...requiredPermissions) => {
  return (req, res, next) => {
    const userRole        = req.user?.role;
    const userPermissions = PERMISSIONS[userRole] || [];

    const hasAll = requiredPermissions.every(
      perm => userPermissions.includes(perm)
    );

    if (!hasAll) {
      return res.status(403).json({
        error:    'Forbidden. You do not have permission to perform this action.',
        required: requiredPermissions,
        yourRole: userRole
      });
    }

    next();
  };
};