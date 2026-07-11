const adminOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'super admin')) {
        next();
    } else {
        res.status(403).json({
            status: "error",
            message: "Access denied. Administrator privileges required."
        });
    }
};

module.exports = adminOnly;
