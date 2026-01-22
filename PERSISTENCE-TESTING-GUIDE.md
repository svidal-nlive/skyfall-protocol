# Game Persistence Testing Guide

## Overview
This guide explains how to test the game persistence system using the new dev mode wave clear feature. The system ensures that game progress is saved and can be resumed across sessions, even after logout.

## Test Account
- **Email**: dev@vectorhost.net
- **Password**: devuser123!
- **Username**: devuser

## Wave Clear Feature

### Purpose
Instantly complete a wave for testing purposes without needing to fight through all enemies.

### Desktop Usage (Ctrl+K)
- While playing: Press **Ctrl+K** to instantly clear all enemies in the current wave
- This triggers enemy destruction, point gains, and opens the shop
- Wave completion is saved to the database

### Mobile Usage (UI Button)
- A red **[DEV] CLEAR WAVE** button appears below the wave name
- Only visible in development mode
- Click to instantly complete the current wave
- Same effect as keyboard shortcut

## Testing Procedures

### Test 1: Wave Progression and Persistence
**Objective**: Verify that waves complete and game state saves correctly

**Steps**:
1. Open browser to `http://localhost` (or your deployment URL)
2. Click "Login" and enter dev account credentials:
   - Email: `dev@vectorhost.net`
   - Password: `devuser123!`
3. Click "Launch Game" to start Wave 1
4. Use **Ctrl+K** (desktop) or click **[DEV] CLEAR WAVE** button (mobile) to clear Wave 1
5. Complete any upgrade selections in the shop that appears
6. Click "Continue" to advance to Wave 2
7. Verify Wave 2 starts correctly
8. Clear Wave 2 with the dev feature
9. In the shop, note your current score and scrap currency
10. **Exit to menu** (return to hangar) without completing Wave 3
11. **Verify**: Continue button should appear with saved progress
12. Click "Continue" - should resume at Wave 3 shop with same score/currency

**Expected Results**:
- Each wave clears successfully when using dev feature
- Continue button appears after exiting mid-game
- Game resumes at exact point of exit (same wave, same stats)

### Test 2: Logout and Login Persistence
**Objective**: Verify game state persists across logout/login cycles

**Steps**:
1. From the main menu, click "Logout"
2. Verify you're back to login screen
3. Log back in with same credentials:
   - Email: `dev@vectorhost.net`
   - Password: `devuser123!`
4. **Verify**: Continue button should appear with previous progress
5. Click "Continue" to resume the game
6. **Verify**: Game resumes at Wave 3 shop with same score/currency from Test 1

**Expected Results**:
- Logout clears session but preserves game save in database
- Login restores Continue button
- Continuing resumes exact same game state

### Test 3: Complete Game Progression
**Objective**: Verify full wave progression through multiple acts

**Steps**:
1. From main menu with dev account logged in, click "Launch Game"
2. Clear waves 1-5 sequentially using Ctrl+K / button
3. After each wave, verify:
   - Next wave number increments correctly
   - Wave name shows correct mission
   - Score and scrap accumulate
4. Notice boss waves (visually indicated with red warning)
5. Return to menu mid-wave-10 progression
6. **Verify**: Continue button shows with exact state
7. Resume and continue to wave 15 (final wave)

**Expected Results**:
- All 15 waves can be progressed through
- Act transitions occur correctly (Waves 1-5 = Act 1, 6-10 = Act 2, 11-15 = Act 3)
- Boss waves display correctly
- Game saves after each wave completion

### Test 4: Multiple Save/Load Cycles
**Objective**: Verify system handles repeated exit/resume cycles

**Steps**:
1. Clear Wave 1
2. Return to menu
3. Verify Continue button and note score (e.g., 5000)
4. Logout
5. Login again
6. **Verify**: Same score still showing
7. Resume game, clear Wave 2
8. Return to menu again
9. **Verify**: New score showing (e.g., 10000 if you killed more enemies)
10. Close browser completely (simulate app restart)
11. Navigate back to application
12. Login again
13. **Verify**: Continue button appears with latest score

**Expected Results**:
- Game state updates with each save
- Database always has the most recent save
- No data loss on logout/app close

## Technical Details

### Wave Clear Implementation
The `clearCurrentWave()` method in GameEngine:
1. Gets all active enemies from EnemyManager
2. Instantly kills each enemy (triggers enemy-destroyed events)
3. Awards points for each destroyed enemy
4. Awards wave completion bonus scrap
5. Opens the upgrade shop for next wave

### Save Mechanism
- Game state is saved automatically when:
  - Wave completes and shop opens
  - Shop closes and next wave begins
  - Player returns to hangar
- Saved data includes:
  - Wave number
  - Player health
  - Current score
  - Scrap currency
  - All active upgrades
  - Game mode

### Continue Button Logic
- Appears when user logs in and has a saved game
- Re-checks for saved game when returning to menu from gameplay
- Clicking Continue restores all game state and resumes at the saved wave

## Debugging Tips

### Check Backend Connectivity
```bash
curl http://localhost:3001/health
```
Should return: `{"status":"ok",...}`

### Verify Save Data
After logging in and clearing a wave, check the database:
```bash
docker exec skyfall-postgres psql -U skyfall_user -d skyfall_db -c \
  "SELECT user_id, wave_number, current_score, scrap_currency FROM game_saves;"
```

### View User Progress
```bash
docker exec skyfall-postgres psql -U skyfall_user -d skyfall_db -c \
  "SELECT * FROM user_progress WHERE user_id = 3;"
```

## Common Issues

### Continue Button Not Appearing
- Check browser console for errors
- Verify logged in (should see dev@vectorhost.net in account menu)
- Verify saved game exists in database
- Try refreshing page

### Wave Not Clearing
- Only works when wave is actively playing
- Check browser console for errors
- Verify keyboard shortcut (Ctrl+K on desktop)
- Mobile: ensure button is visible and clicked

### Game Not Saving
- Check backend health: `curl http://localhost:3001/health`
- Verify database connection
- Check browser console for save request errors
- Watch network tab in DevTools

### Score/Progress Not Updating
- Game saves are async (non-blocking)
- Wait a moment after action before checking
- Refresh page to see latest data from database
- Check browser local storage for auth token

## Performance Notes
- Wave clearing is instant (no delay)
- Save requests are async and don't block gameplay
- Database queries are optimized with indexes
- System can handle multiple rapid waves efficiently

## Next Steps
After confirming persistence works:
1. Test with additional accounts
2. Test mobile device (button appears instead of shortcut)
3. Test network interruption scenarios
4. Monitor database size over extended testing
5. Prepare for production deployment
