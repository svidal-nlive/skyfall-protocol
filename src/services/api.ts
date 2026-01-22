/**
 * API client for game persistence and authentication
 */

// Use relative URLs in production (proxied through nginx), localhost for local dev
const API_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:3001';
const TOKEN_KEY = 'skyfall-auth-token';
const USER_KEY = 'skyfall-user';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('Failed to save auth token');
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn('Failed to clear auth token');
  }
}

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export async function registerAccount(email: string, password: string, username?: string) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setAuthToken(data.token);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch (e) {
      console.warn('Failed to save user data');
    }

    return data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}

export async function loginAccount(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setAuthToken(data.token);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch (e) {
      console.warn('Failed to save user data');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function verifyToken(): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      clearAuthToken();
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token verification error:', error);
    clearAuthToken();
    return null;
  }
}

export function logoutAccount() {
  clearAuthToken();
}

export function getCurrentUser() {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getAuthToken();
}

// ============================================================================
// GAME SAVES
// ============================================================================

export interface GameSaveData {
  waveNumber: number;
  actNumber: number;
  gameMode: string;
  isPaused: boolean;
  playerHealth: number;
  playerMaxHealth: number;
  playerPosition: { x: number; y: number; z: number };
  currentScore: number;
  currentCombo: number;
  scrapCurrency: number;
  upgradesState: Record<string, number>;
  enemiesState: any[];
  waveElapsedTime: number;
  totalFlightTime: number;
}

export async function saveGameState(saveData: Partial<GameSaveData>) {
  if (!isLoggedIn()) {
    console.warn('Not logged in, cannot save game state');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/game/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(saveData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Save failed');
    }

    return data.save;
  } catch (error) {
    console.error('Save game error:', error);
    throw error;
  }
}

export async function loadGameState() {
  if (!isLoggedIn()) {
    console.warn('Not logged in, cannot load game state');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/game/load`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No save exists
      }
      throw new Error(data.error || 'Load failed');
    }

    return data;
  } catch (error) {
    console.error('Load game error:', error);
    throw error;
  }
}

export async function deleteGameSave(saveId: number) {
  if (!isLoggedIn()) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/game/save/${saveId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Delete failed');
    }

    return true;
  } catch (error) {
    console.error('Delete save error:', error);
    throw error;
  }
}

// ============================================================================
// USER PROGRESS
// ============================================================================

export interface UserProgressData {
  careerPoints?: number;
  totalKills?: number;
  totalDeaths?: number;
  totalFlightTime?: number;
  completedActs?: number[];
  campaignComplete?: boolean;
  highestWave?: number;
  selectedAircraftId?: string;
  highScore?: number;
  bestCombo?: number;
  achievements?: string[];
}

export async function getUserProgress() {
  if (!isLoggedIn()) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/progress`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to get progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Get progress error:', error);
    throw error;
  }
}

export async function updateUserProgress(progressData: UserProgressData) {
  if (!isLoggedIn()) {
    console.warn('Not logged in, cannot update progress');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/progress`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(progressData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Update failed');
    }

    return data;
  } catch (error) {
    console.error('Update progress error:', error);
    throw error;
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
}
