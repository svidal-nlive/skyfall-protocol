# Quick Start: Testing Game Persistence

## Access the Application
- **URL**: http://localhost (or your server)
- **Test Account Email**: dev@vectorhost.net
- **Test Account Password**: devuser123!

## Quick Test Flow

### 1. Login
- Click "Login"
- Enter dev@vectorhost.net / devuser123!
- Click "Launch Game"

### 2. Clear Waves
**Desktop**: Press **Ctrl+K** while playing
**Mobile**: Click red **[DEV] CLEAR WAVE** button below wave name

### 3. Complete Purchases
- Shop opens automatically after clearing wave
- Select upgrades or skip
- Click "Continue to Next Wave"

### 4. Test Persistence
- Return to Hangar (pause menu)
- Verify "Continue" button appears at main menu
- Logout and login again
- Continue button should still be there
- Click Continue to resume exact same game state

## What's Being Saved
- ✅ Current wave number
- ✅ Player health
- ✅ Score and currency
- ✅ Purchased upgrades
- ✅ Game mode (campaign/endless)
- ✅ Scrap currency

## Key Features
1. **Wave Clear** - Ctrl+K (desktop) or button click (mobile)
2. **Auto-Save** - Happens after each wave completion
3. **Continue Button** - Appears when you have a saved game
4. **Cross-Session** - Works even after logout/browser restart

## Testing Checklist

- [ ] Clear Wave 1 with dev feature
- [ ] Return to menu, see Continue button
- [ ] Click Continue, verify Wave 2 starts
- [ ] Clear Wave 2
- [ ] Logout from main menu
- [ ] Login again
- [ ] Continue button still visible
- [ ] Click Continue
- [ ] Verify game resumes at Wave 2 shop with correct stats
- [ ] Clear Wave 3
- [ ] Note your score
- [ ] Return to hangar
- [ ] Refresh browser
- [ ] Login again
- [ ] Score still saved

## Database Verification

Check that saves are being stored:
```bash
docker exec skyfall-postgres psql -U skyfall_user -d skyfall_db -c \
  "SELECT wave_number, current_score, scrap_currency FROM game_saves WHERE user_id = 3;"
```

## Troubleshooting

**"Continue button not showing"**
- Make sure you're logged in (check if email shows in menu)
- Completed at least one wave clear
- Returned to hangar from gameplay (not game over)

**"Game not saving"**
- Check backend: `curl http://localhost:3001/health`
- Open browser DevTools → Console for errors
- Check Network tab for failed save requests

**"Can't clear wave with Ctrl+K"**
- Must be playing (not in briefing or shop)
- Try again during active gameplay
- Mobile: use button instead

**"Resume shows wrong wave"**
- Hard refresh browser (Ctrl+Shift+R)
- Logout completely and login again
- Check that you returned to hangar (not game over)
