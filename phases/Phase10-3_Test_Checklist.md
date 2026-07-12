# Phase 10-3-4: Functional Test Checklist

** Tester:** Youcheng Li  
** Date:** 2026-07-12  
** Build:** dist/ (v1.0.0)  
** Browser:** Chrome  

> **Instructions:** Follow each test step by step. Mark ✅ Pass / ❌ Fail / ⏭ Skip.  
> If a test fails, describe what happened in the Notes column.  
> You don't need to do them all at once — but try to do them in order.

---

## Preparation

### P1. Open Chrome Extensions page
- Type `chrome://extensions` in the address bar
- Turn on **Developer mode** (top-right toggle)

### P2. Load the extension
- Click **Load unpacked**
- Select the `dist/` folder from: `C:\Users\18038\OneDrive\桌面\Linkedin Project\dist`
- The extension should appear in the list with the blue speech-bubble icon

| # | Test | Result | Notes |
|---|------|--------|-------|
| P2 | Extension loads without errors | ⬜ | No red error text on the extensions page |

---

## Part A: Core Message Generation (Tests 1–6)

### Test 1: Popup opens without errors
1. Click the extension icon in the Chrome toolbar (pin it if hidden)
2. The popup window should open
3. Press `F12` to open DevTools → Console tab
4. Check for any red error messages

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1.1 | Popup opens and displays UI | ⬜ | |
| 1.2 | No errors in Console | ⬜ | |

### Test 2: Generate messages on a LinkedIn profile (Shared Mode)
> This tests the core feature using Shared Mode (no API key needed).

1. Go to any LinkedIn user's profile page (e.g., search a person and open their profile)
2. Click the extension icon
3. Make sure the mode is **Shared** (default — you should NOT need to enter an API key)
4. Click **Generate Messages**
5. Wait ~5-10 seconds for the AI to respond
6. You should see **4 message styles**: Professional, Friendly, Entrepreneur, Academic

| # | Test | Result | Notes |
|---|------|--------|-------|
| 2.1 | "Generate Messages" button works | ⬜ | |
| 2.2 | All 4 styles appear | ⬜ | |
| 2.3 | Each message contains relevant content (not generic) | ⬜ | |
| 2.4 | Messages mention the target person's name or details | ⬜ | |

### Test 3: Copy a message to clipboard
1. Click the **Copy** button on any of the 4 messages
2. A green toast should appear saying "Copied!" or similar
3. Paste (Ctrl+V) into any text field to verify the content was copied

| # | Test | Result | Notes |
|---|------|--------|-------|
| 3.1 | Copy button works | ⬜ | |
| 3.2 | Toast notification appears | ⬜ | |
| 3.3 | Pasted content matches the message | ⬜ | |

### Test 4: Edit a message
1. Click the **Edit** button on any message
2. The message should become editable (text input area)
3. Change some text
4. Click **Save** (or the edit button again to confirm)
5. The edited text should be displayed

| # | Test | Result | Notes |
|---|------|--------|-------|
| 4.1 | Edit mode activates | ⬜ | |
| 4.2 | Edited text saves successfully | ⬜ | |
| 4.3 | Edited content persists while popup is open | ⬜ | |

### Test 5: Regenerate a single message style
1. Click the **Regenerate** button on ONE of the 4 messages (e.g., Professional)
2. Wait for it to update
3. The other 3 messages should NOT change

| # | Test | Result | Notes |
|---|------|--------|-------|
| 5.1 | Regenerate button works for a single style | ⬜ | |
| 5.2 | Only the targeted message updates | ⬜ | |
| 5.3 | Other 3 messages remain unchanged | ⬜ | |

### Test 6: Find Common Points
1. While on a LinkedIn profile, click **Find Common Points** (if visible)
2. The extension should analyze your profile vs. the target profile
3. It should display shared elements (school, company, industry, etc.)
4. Click one of the found common points to emphasize it
5. Click **Generate Messages** — the generated messages should reference the selected common ground

| # | Test | Result | Notes |
|---|------|--------|-------|
| 6.1 | "Find Common Points" button works | ⬜ | |
| 6.2 | Common points are displayed | ⬜ | |
| 6.3 | Selecting a common point and regenerating incorporates it | ⬜ | |

---

## Part B: Settings & Configuration (Tests 7–10)

### Test 7: Settings page opens
1. Click the extension icon to open the popup
2. Click the **Settings** gear icon (or Settings link)
3. The Settings page should open within the popup
4. You should see sections for: Profile, API settings, Message preferences, etc.

| # | Test | Result | Notes |
|---|------|--------|-------|
| 7.1 | Settings page opens | ⬜ | |
| 7.2 | All settings sections are visible | ⬜ | |

### Test 8: Custom Mode — API key entry and persistence
> This tests Custom Mode (user's own DeepSeek API key).

1. In Settings, find the API key input field
2. Switch mode to **Custom** (if not already)
3. Enter a test API key (can be fake, like `sk-test123456`)
4. Click **Save**
5. Close the popup (click away)
6. Reopen the popup → go to Settings
7. Verify the API key is still there

| # | Test | Result | Notes |
|---|------|--------|-------|
| 8.1 | API key input field exists | ⬜ | |
| 8.2 | API key saves successfully | ⬜ | |
| 8.3 | API key persists after popup close/reopen | ⬜ | |

### Test 9: Message Length Limit
1. In Settings, find the **Message Length Limit** field
2. Change the value to something specific (e.g., `100` characters)
3. Save settings
4. Go to a LinkedIn profile and generate messages
5. Check if the generated messages are roughly within the specified length

| # | Test | Result | Notes |
|---|------|--------|-------|
| 9.1 | Message Length Limit field exists | ⬜ | |
| 9.2 | Custom value saves | ⬜ | |
| 9.3 | Generated messages respect the length limit | ⬜ | |

### Test 10: Profile Sync (auto-import from LinkedIn)
1. Go to **your own** LinkedIn profile page (not someone else's)
2. Open the extension popup
3. Click **Sync My Profile** (or similar button)
4. Wait for the sync to complete
5. Go to Settings → Profile section
6. Verify your profile data is filled in: name, headline, company, location, education, background

| # | Test | Result | Notes |
|---|------|--------|-------|
| 10.1 | Sync button triggers profile import | ⬜ | |
| 10.2 | Name field is populated | ⬜ | |
| 10.3 | Headline/role is populated | ⬜ | |
| 10.4 | Company is populated | ⬜ | |
| 10.5 | Location is populated | ⬜ | |
| 10.6 | Education/background is populated | ⬜ | |
| 10.7 | Sync only fires when user clicks (not automatically) | ⬜ | |

---

## Part C: Error Handling (Tests 11–12)

### Test 11: API error handling (invalid key in Custom Mode)
1. In Settings, switch to **Custom Mode**
2. Enter an invalid API key (e.g., `sk-invalid123`)
3. Save settings
4. Go to a LinkedIn profile and click Generate Messages
5. You should see a **friendly error message** (not a raw API error or crash)

| # | Test | Result | Notes |
|---|------|--------|-------|
| 11.1 | Invalid key produces user-friendly error | ⬜ | |
| 11.2 | No crash or blank screen | ⬜ | |
| 11.3 | Error message explains what went wrong | ⬜ | |

### Test 12: Rate limit handling (Shared Mode)
> Hard to test manually, but observe behavior.

1. Switch to **Shared Mode**
2. Rapidly click Generate Messages multiple times in quick succession
3. If you hit the rate limit (10 requests/minute), you should see a friendly message
4. The extension should NOT crash or enter an infinite retry loop

| # | Test | Result | Notes |
|---|------|--------|-------|
| 12.1 | Rate limit message appears (if triggered) | ⬜ | |
| 12.2 | No infinite loop or crash | ⬜ | |

---

## Part D: Additional Features (Tests 13–14)

### Test 13: Message History + CSV Export
1. In Settings, find the **History** toggle and turn it **ON**
2. Generate messages on a LinkedIn profile
3. Look for a **Record** or **Save to History** button after generating
4. Click it to save the interaction to history
5. Find the **History** view (might be a tab or button in the popup)
6. Verify the saved interaction appears
7. Look for an **Export CSV** button and click it
8. A CSV file should download

| # | Test | Result | Notes |
|---|------|--------|-------|
| 13.1 | History toggle exists and can be enabled | ⬜ | |
| 13.2 | Interaction can be saved to history | ⬜ | |
| 13.3 | History view shows saved interactions | ⬜ | |
| 13.4 | CSV export downloads a file | ⬜ | |
| 13.5 | CSV file contains correct data | ⬜ | |

### Test 14: Privacy Policy link
1. Open the extension popup
2. Find the **Privacy Policy** link (usually in Settings or at the bottom)
3. Click it
4. The Privacy Policy should open in a **new browser tab**

| # | Test | Result | Notes |
|---|------|--------|-------|
| 14.1 | Privacy Policy link is visible | ⬜ | |
| 14.2 | Clicking it opens the policy page | ⬜ | |
| 14.3 | It opens in a new tab (not inside the popup) | ⬜ | |

---

## Part E: Cleanup (Test 15)

### Test 15: Uninstall clears data
1. Note the current storage: go to `chrome://extensions`, find the extension, click "Details"
2. Click "Inspect views: popup" if available → go to Application tab → Storage → Local
3. Note what data is stored
4. Remove the extension (click "Remove")
5. Reinstall (Load unpacked from dist/)
6. Go to Settings — all previous data (API key, profile, settings) should be gone

| # | Test | Result | Notes |
|---|------|--------|-------|
| 15.1 | Extension can be uninstalled | ⬜ | |
| 15.2 | After reinstall, no previous data remains | ⬜ | |

---

## Summary

| Section | Tests | Passed | Failed | Skipped |
|---------|-------|--------|--------|---------|
| Preparation | 1 | | | |
| A: Core Generation | 6 | | | |
| B: Settings | 4 | | | |
| C: Error Handling | 2 | | | |
| D: Additional Features | 2 | | | |
| E: Cleanup | 1 | | | |
| **Total** | **16** | | | |

---

**Overall Result:** ⬜ All Passed / ❌ Some Failed

**Tester Signature:** _______________  **Date:** ___________
