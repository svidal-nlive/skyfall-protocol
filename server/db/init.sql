-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress table (career-wide stats)
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  career_points BIGINT DEFAULT 0,
  total_kills INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  total_flight_time BIGINT DEFAULT 0, -- in seconds
  
  -- Campaign progression
  completed_acts INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  campaign_complete BOOLEAN DEFAULT FALSE,
  highest_wave INTEGER DEFAULT 0,
  
  -- Endless mode
  endless_unlocked BOOLEAN DEFAULT FALSE,
  endless_best_wave INTEGER DEFAULT 0,
  endless_best_score BIGINT DEFAULT 0,
  endless_total_runs INTEGER DEFAULT 0,
  
  -- Aircraft selection
  selected_aircraft_id VARCHAR(50) DEFAULT 'falcon',
  
  -- High scores
  high_score BIGINT DEFAULT 0,
  best_combo INTEGER DEFAULT 0,
  
  -- Enemy kill stats
  kills_phantom INTEGER DEFAULT 0,
  kills_viper INTEGER DEFAULT 0,
  kills_warden INTEGER DEFAULT 0,
  kills_specter INTEGER DEFAULT 0,
  
  -- Achievements
  achievements TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Session tracking
  last_played_date TIMESTAMP,
  total_sessions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game saves table (per-session state)
CREATE TABLE IF NOT EXISTS game_saves (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Wave/Game state
  wave_number INTEGER NOT NULL,
  act_number INTEGER DEFAULT 1,
  game_mode VARCHAR(50) DEFAULT 'CAMPAIGN', -- CAMPAIGN or ENDLESS
  is_paused BOOLEAN DEFAULT FALSE,
  
  -- Player state
  player_health DECIMAL(10,2),
  player_max_health DECIMAL(10,2),
  player_position_x DECIMAL(12,4),
  player_position_y DECIMAL(12,4),
  player_position_z DECIMAL(12,4),
  
  -- Game resources
  current_score BIGINT DEFAULT 0,
  current_combo INTEGER DEFAULT 0,
  scrap_currency BIGINT DEFAULT 0,
  
  -- Upgrades (JSON object with upgrade levels)
  upgrades_state JSONB DEFAULT '{}'::JSONB,
  
  -- Enemy state (JSON array of enemy objects)
  enemies_state JSONB DEFAULT '[]'::JSONB,
  
  -- Timings
  wave_elapsed_time DECIMAL(10,2) DEFAULT 0,
  total_flight_time BIGINT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session/auth table (JWT tokens)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_game_saves_user_id ON game_saves(user_id);
CREATE INDEX idx_game_saves_updated_at ON game_saves(updated_at DESC);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
