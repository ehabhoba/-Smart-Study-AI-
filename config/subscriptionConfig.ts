
export interface SubscriptionState {
  hasUsedTrial: boolean;
  remainingCredits: number;
  currentTier: number; // 0 = Free, >0 = Paid
  activeApiKey: string;
  lastDailyReset?: string;
}

export const getRandomKey = (keys: string[]) => {
  if (!keys || keys.length === 0) return "";
  return keys[Math.floor(Math.random() * keys.length)];
};

// --- FREE TIER POOL (Shared Keys) ---
// These keys are rotated daily for free users to balance load.
export const FREE_KEYS_POOL = [
  "AIzaSyAP_iM9CblP21ExCUV5zUqCEkNU-3L-Vmc",
  "AIzaSyCtImuR1u22a-1EP9SKXS8j9AcPZdCSz7g",
  "AIzaSyAfFuTMnZu7c0z3dpw8Zqb1W7U1QgrTlPU",
  "AIzaSyBd0Y849ZwNDLpqYXk7WxArx-zz5I0LRaM",
  "AIzaSyD_WzHJ3dVOlQD3IMnmRWi9-V0jWg5GUzA",
  "AIzaSyA9ux-xuov0oO50AKtN8LKEloM3l2zKsws",
  "AIzaSyBm61u_xuIo3-Mb1hjySPZUazrwTtXJK0E",
  "AIzaSyB8lsM9oFPYJgS2ujxuVCthR58v7hezaeo"
];

// Initial trial key
export const TRIAL_KEY = getRandomKey(FREE_KEYS_POOL);

export const DAILY_FREE_LIMIT = 5; // Daily projects for free tier

// --- PAID KEYS POOLS (Dedicated High Limit Keys) ---
// IMPORTANT: Replace placeholders with valid Google Gemini API Keys from Google AI Studio.
const KEYS_TIER_10 = [
  "AIzaSyAP_iM9CblP21ExCUV5zUqCEkNU-3L-Vmc", // Placeholder - Add Real Keys
  "AIzaSyCtImuR1u22a-1EP9SKXS8j9AcPZdCSz7g"  // Placeholder - Add Real Keys
];

const KEYS_TIER_20 = [
  "AIzaSyAfFuTMnZu7c0z3dpw8Zqb1W7U1QgrTlPU", // Placeholder - Add Real Keys
  "AIzaSyBd0Y849ZwNDLpqYXk7WxArx-zz5I0LRaM"  // Placeholder - Add Real Keys
];

const KEYS_TIER_100 = [
  "AIzaSyD_WzHJ3dVOlQD3IMnmRWi9-V0jWg5GUzA", // Placeholder - Add Real Keys
  "AIzaSyA9ux-xuov0oO50AKtN8LKEloM3l2zKsws"  // Placeholder - Add Real Keys
];

// --- REDEMPTION CODES SYSTEM ---
// Send these codes to customers manually after payment.
export const REDEMPTION_CODES: Record<string, { tier: number, credits: number, keys: string[] }> = {
  // BUNDLE: 10 EGP (10 Projects)
  "EG10-A3B7": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-C6D1": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-E9F4": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-G2H5": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-J8K0": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  
  // BUNDLE: 20 EGP (20 Projects)
  "EG20-H0K4": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG20-F3J8": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG20-D7L1": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG20-B5M9": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG20-Z1P2": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  
  // BUNDLE: 100 EGP (200 Projects)
  "EG100-1Q4W": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-2E5R": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-3T6Y": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-SUPER": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
};

/**
 * Robustly checks the subscription state from local storage,
 * performs validation, and executes the daily reset logic if needed.
 * Returns the sanitized and up-to-date subscription state.
 */
export const checkAndResetSubscription = (): SubscriptionState => {
  const defaultState: SubscriptionState = {
    hasUsedTrial: false,
    remainingCredits: 0,
    currentTier: 0,
    activeApiKey: '',
    lastDailyReset: undefined
  };

  let state = defaultState;
  let hasChanges = false;
  let isResetNeeded = false;

  // 1. Load from Storage
  try {
    const saved = localStorage.getItem('smart_study_sub');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure roughly
      if (typeof parsed === 'object' && parsed !== null) {
        state = { ...defaultState, ...parsed };
      }
    }
  } catch (e) {
    console.error("Error parsing subscription state", e);
    // If corrupted, we fall back to defaultState
  }

  // 2. Logic for Free Tier Daily Reset
  // We only reset if the user is on the Free Tier (Tier 0)
  if (state.currentTier === 0) {
    const now = new Date();
    
    // Parse last reset date safely
    let lastResetDate = state.lastDailyReset ? new Date(state.lastDailyReset) : null;
    if (lastResetDate && isNaN(lastResetDate.getTime())) {
       lastResetDate = null; // Treat invalid date as null
    }

    // Condition A: New user (never reset) -> Give 5 credits immediately
    if (!lastResetDate) {
       isResetNeeded = true;
    } 
    // Condition B: 24 Hours passed since last reset
    else {
       const diffMs = now.getTime() - lastResetDate.getTime();
       const diffHours = diffMs / (1000 * 60 * 60);
       
       if (diffHours >= 24) {
          isResetNeeded = true;
       }
    }

    if (isResetNeeded) {
       // Pick a fresh key from the pool on every reset to balance load
       const freshKey = getRandomKey(FREE_KEYS_POOL);
       
       state = {
         ...state,
         remainingCredits: DAILY_FREE_LIMIT,
         activeApiKey: freshKey, 
         lastDailyReset: now.toISOString(),
         hasUsedTrial: true
       };
       hasChanges = true;
       console.log("Daily free tier reset executed. Credits replenished.");
    }
  }

  // 3. Save if modified during check
  if (hasChanges) {
    try {
      localStorage.setItem('smart_study_sub', JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save reset state", e);
    }
  }

  return state;
};
