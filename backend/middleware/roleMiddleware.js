exports.requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Yetkisiz erişim, kimlik bilgileri eksik.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bu işlem için gerekli yetkiniz bulunmamaktadır.' });
        }

        next();
    };
};
