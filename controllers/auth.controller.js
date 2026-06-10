const User = require('../models/user.model')
const jwt = require('jsonwebtoken')

// Helper: generate tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        {id: userId},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRES}
    )

    const refreshToken = jwt.sign(
        {id: userId},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRES}
    )

    return {accessToken, refreshToken}
}

// @desc Register a new user
// @route POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const {username, email, password} = req.body

        // Check if user already exists
        const existingUser = await User.findOne({$or: [{email}, {username}]})
        if (existingUser) {
            return res.status(400).json({message: 'Username or email already taken'})
        }

        // Create user (password hashed automatically by model hook)
        const user = await User.create({username, email, password})

        // Generate tokens
        const {accessToken, refreshToken} = generateTokens(user._id)

        // Send refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, //set to true in production (HTTPS)
            samSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
        })

        res.status(201).json({
            message: 'Registration successful',
            accessToken,
            user: {id: user._id, username: user.username, email: user.email}
        })

    }  catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Check token matches what's in DB
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Issue new tokens (rotation)
    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ accessToken });

  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(204);

    // Remove refresh token from DB
    await User.findOneAndUpdate(
      { refreshToken: token },
      { refreshToken: null }
    );

    // Clear cookie
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

