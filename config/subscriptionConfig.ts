
export const TRIAL_KEY = "AIzaSyA9ux-xuov0oO50AKtN8LKEloM3l2zKsws"; // المفتاح المجاني المشترك
export const DAILY_FREE_LIMIT = 5; // عدد المحاولات المجانية اليومية

export interface SubscriptionState {
  hasUsedTrial: boolean; // Keep for legacy, but mainly rely on tier 0
  remainingCredits: number;
  currentTier: number; // 0 = Free, >0 = Paid
  activeApiKey: string;
  lastDailyReset?: string; // ISO Date String for the last time free credits were reset
}

export const getRandomKey = (keys: string[]) => {
  return keys[Math.floor(Math.random() * keys.length)];
};

// مفاتيح الفئات المختلفة
const KEYS_TIER_10 = [
  "AIzaSyAae4o9ihHx67bS9pOPYuL11dyVH-Oh3HM",
  "AIzaSyAP_iM9CblP21ExCUV5zUqCEkNU-3L-Vmc",
  "AIzaSyCtImuR1u22a-1EP9SKXS8j9AcPZdCSz7g"
];

const KEYS_TIER_20 = [
  "AIzaSyAfFuTMnZu7c0z3dpw8Zqb1W7U1QgrTlPU",
  "AIzaSyBd0Y849ZwNDLpqYXk7WxArx-zz5I0LRaM",
  "AIzaSyD_WzHJ3dVOlQD3IMnmRWi9-V0jWg5GUzA"
];

const KEYS_TIER_100 = [
  "AIzaSyA9ux-xuov0oO50AKtN8LKEloM3l2zKsws",
  "AIzaSyBm61u_xuIo3-Mb1hjySPZUazrwTtXJK0E",
  "AIzaSyB8lsM9oFPYJgS2ujxuVCthR58v7hezaeo"
];

// تعريف الأكواد المرتبطة بكل خطة
export const REDEMPTION_CODES: Record<string, { tier: number, credits: number, keys: string[] }> = {
  // --- فئة 10 جنيه (10 مشاريع) ---
  "EG10-A3B7": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-C6D1": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-E9F4": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-G2H5": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-J8K0": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-L1M3": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-N6P9": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-Q5R2": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-S4T7": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-U0V8": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-W1X5": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-Y7Z3": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-2A6B": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-4C8D": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-5E9F": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-3G7H": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-9J0K": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-8L2M": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-7N1P": { tier: 10, credits: 10, keys: KEYS_TIER_10 },
  "EG10-6Q0R": { tier: 10, credits: 10, keys: KEYS_TIER_10 },

  // --- فئة 20 جنيه (20 مشروع) ---
  "EG50-H0K4": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-F3J8": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-D7L1": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-B5M9": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-Z1P2": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-X6R7": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-V9S0": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-T2U3": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-R4W5": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-P8Y6": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-N0Z9": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-M1B3": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-L5C7": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-J9D2": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-G6E4": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-E8F0": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-C2H1": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-A4J5": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-9K3L": { tier: 20, credits: 20, keys: KEYS_TIER_20 },
  "EG50-7M6N": { tier: 20, credits: 20, keys: KEYS_TIER_20 },

  // --- فئة 100 جنيه (200 مشروع) ---
  "EG100-1Q4W": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-2E5R": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-3T6Y": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-4U7I": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-5O8P": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-6A9S": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-7D0F": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-8G1H": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-9J2K": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-0L3Z": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-1X4C": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-2V5B": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-3N6M": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-4Q7W": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-5E8R": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-6T9Y": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-7U0I": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-8O1P": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-9A2S": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
  "EG100-0D3F": { tier: 100, credits: 200, keys: KEYS_TIER_100 },
};
