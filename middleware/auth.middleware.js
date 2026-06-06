const jwt = require('jsonwebtoken')
const User = require('../models/user.model')

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token, access denied' })
        }

        const token = authHeader.split(' ')[1]

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        req.user = await User.findById(decoded.id).select('-password -refreshToken')

        if (!req.user) {
            return res.status(401).json({ message: 'User no longer exists' })
        }

        next()

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Access token expired' })
        }
        return res.status(401).json({ message: 'Invalid token' })
    }
}

module.exports = { protect }