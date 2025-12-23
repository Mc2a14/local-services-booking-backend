const authService = require('../services/authService');

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, full_name, phone, user_type } = req.body;

    // Validation
    if (!email || !password || !full_name || !user_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['customer', 'provider'].includes(user_type)) {
      return res.status(400).json({ error: 'Invalid user_type. Must be "customer" or "provider"' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await authService.registerUser({ email, password, full_name, phone, user_type });

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await authService.loginUser(email, password);

    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getMe
};



