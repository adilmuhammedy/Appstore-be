const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {
    const token = req.headers.authorization;

    if (token && !BLACKLIST.has(token)) {
        // Token is valid and not blacklisted
        jwt.verify(token, 'qwertyuiopasdfghjklzxcvbnmqwertyuiop', (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            // Token is valid, do something with decoded user object
            login(req, res);
            res.status(200).json({ message: 'Protected resource accessed', user: decoded.user });
        });
    } else {
        // Token is missing or blacklisted
        res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = isAuthenticated;
