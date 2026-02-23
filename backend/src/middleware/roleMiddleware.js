/**
 * Middleware to authorize users based on roles
 * @param {string} role - Allowed role for this route
 */
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: No user info' });
        }

        if (req.user.role !== role) {
            return res.status(403).json({ error: `Forbidden: Requires ${role} role` });
        }

        next();
    };
};

module.exports = { requireRole };
