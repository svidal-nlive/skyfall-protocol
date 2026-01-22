const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://skyfall.vectorhost.net', 'https://skyfall.vectorhost.net'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Register a new user account
 * POST /auth/register
 * Body: { email, password, username? }
 */
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
      [email, passwordHash, username || email.split('@')[0]]
    );

    const user = result.rows[0];

    // Create initial progress record
    await pool.query(
      'INSERT INTO user_progress (user_id) VALUES ($1)',
      [user.id]
    );

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login to existing account
 * POST /auth/login
 * Body: { email, password }
 */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store session
    const tokenHash = await bcrypt.hash(token, 5); // Light hash for storage
    await pool.query(
      'INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address) VALUES ($1, $2, $3, $4)',
      [
        user.id,
        tokenHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        req.ip,
      ]
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Verify token and get current user
 * GET /auth/me
 */
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// ============================================================================
// GAME SAVES
// ============================================================================

/**
 * Save game state
 * POST /api/game/save
 */
app.post('/api/game/save', authenticateToken, async (req, res) => {
  try {
    const {
      waveNumber,
      actNumber,
      gameMode,
      isPaused,
      playerHealth,
      playerMaxHealth,
      playerPosition,
      currentScore,
      currentCombo,
      scrapCurrency,
      upgradesState,
      enemiesState,
      waveElapsedTime,
      totalFlightTime,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO game_saves (
        user_id, wave_number, act_number, game_mode, is_paused,
        player_health, player_max_health, 
        player_position_x, player_position_y, player_position_z,
        current_score, current_combo, scrap_currency,
        upgrades_state, enemies_state,
        wave_elapsed_time, total_flight_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (user_id) DO UPDATE SET
        wave_number = EXCLUDED.wave_number,
        act_number = EXCLUDED.act_number,
        game_mode = EXCLUDED.game_mode,
        is_paused = EXCLUDED.is_paused,
        player_health = EXCLUDED.player_health,
        player_max_health = EXCLUDED.player_max_health,
        player_position_x = EXCLUDED.player_position_x,
        player_position_y = EXCLUDED.player_position_y,
        player_position_z = EXCLUDED.player_position_z,
        current_score = EXCLUDED.current_score,
        current_combo = EXCLUDED.current_combo,
        scrap_currency = EXCLUDED.scrap_currency,
        upgrades_state = EXCLUDED.upgrades_state,
        enemies_state = EXCLUDED.enemies_state,
        wave_elapsed_time = EXCLUDED.wave_elapsed_time,
        total_flight_time = EXCLUDED.total_flight_time,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        req.userId,
        waveNumber,
        actNumber,
        gameMode,
        isPaused,
        playerHealth,
        playerMaxHealth,
        playerPosition?.x || 0,
        playerPosition?.y || 0,
        playerPosition?.z || 0,
        currentScore,
        currentCombo,
        scrapCurrency,
        upgradesState ? JSON.stringify(upgradesState) : '{}',
        enemiesState ? JSON.stringify(enemiesState) : '[]',
        waveElapsedTime,
        totalFlightTime,
      ]
    );

    res.json({
      success: true,
      save: result.rows[0],
    });
  } catch (error) {
    console.error('Save game error:', error);
    res.status(500).json({ error: 'Failed to save game' });
  }
});

/**
 * Load latest game save
 * GET /api/game/load
 */
app.get('/api/game/load', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM game_saves 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No save found' });
    }

    const save = result.rows[0];
    res.json({
      ...save,
      upgrades_state: typeof save.upgrades_state === 'string' ? JSON.parse(save.upgrades_state) : save.upgrades_state,
      enemies_state: typeof save.enemies_state === 'string' ? JSON.parse(save.enemies_state) : save.enemies_state,
    });
  } catch (error) {
    console.error('Load game error:', error);
    res.status(500).json({ error: 'Failed to load game' });
  }
});

/**
 * Delete a game save
 * DELETE /api/game/save/:saveId
 */
app.delete('/api/game/save/:saveId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM game_saves WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.saveId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete save error:', error);
    res.status(500).json({ error: 'Failed to delete save' });
  }
});

// ============================================================================
// USER PROGRESS
// ============================================================================

/**
 * Get user progress
 * GET /api/progress
 */
app.get('/api/progress', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * Update user progress
 * PUT /api/progress
 */
app.put('/api/progress', authenticateToken, async (req, res) => {
  try {
    const {
      careerPoints,
      totalKills,
      totalDeaths,
      totalFlightTime,
      completedActs,
      campaignComplete,
      highestWave,
      selectedAircraftId,
      highScore,
      bestCombo,
      achievements,
    } = req.body;

    const result = await pool.query(
      `UPDATE user_progress SET
        career_points = COALESCE($2, career_points),
        total_kills = COALESCE($3, total_kills),
        total_deaths = COALESCE($4, total_deaths),
        total_flight_time = COALESCE($5, total_flight_time),
        completed_acts = COALESCE($6, completed_acts),
        campaign_complete = COALESCE($7, campaign_complete),
        highest_wave = COALESCE($8, highest_wave),
        selected_aircraft_id = COALESCE($9, selected_aircraft_id),
        high_score = COALESCE($10, high_score),
        best_combo = COALESCE($11, best_combo),
        achievements = COALESCE($12, achievements),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [
        req.userId,
        careerPoints,
        totalKills,
        totalDeaths,
        totalFlightTime,
        completedActs,
        campaignComplete,
        highestWave,
        selectedAircraftId,
        highScore,
        bestCombo,
        achievements,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Middleware to verify JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.userId = decoded.userId;
    next();
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`[SERVER] Skyfall Protocol API running on port ${port}`);
  console.log(`[DATABASE] Connected to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});
