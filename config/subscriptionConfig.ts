
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

// --- مفاتيح الباقة المجانية (Free Tier Pool) ---
// يتم اختيار مفتاح عشوائي عند كل إعادة تحميل أو تجديد يومي لتوزيع الحمل
const FREE_KEYS_POOL = [
  "AIzaSyAP_iM9CblP21ExCUV5zUqCEkNU-3L-Vmc",
  "AIzaSyCtImuR1u22a-1EP9SKXS8j9AcPZdCSz7g",
  "AIzaSyAfFuTMnZu7c0z3dpw8Zqb1W7U1QgrTlPU",
  "AIzaSyBd0Y849ZwNDLpqYXk7WxArx-zz5I0LRaM",
  "AIzaSyD_WzHJ3dVOlQD3IMnmRWi9-V0jWg5GUzA",
  "AIzaSyA9ux-xuov0oO50AKtN8LKEloM3l2zKsws",
  "AIzaSyBm61u_xuIo3-Mb1hjySPZUazrwTtXJK0E",
  "AIzaSyB8lsM9oFPYJgS2ujxuVCthR58v7hezaeo"
];

// اختيار مفتاح عشوائي للتجربة المجانية
export const TRIAL_KEY = getRandomKey(FREE_KEYS_POOL);

export const DAILY_FREE_LIMIT = 5; // عدد المحاولات المجانية اليومية

// ⚠️ مفاتيح الباقات المدفوعة (يجب أن تكون مختلفة لضمان الجودة للمشتركين)
// Get keys from: https://aistudio.google.com/
const KEYS_TIER_10 = [
  "PUT_YOUR_VALID_PAID_KEY_HERE_1",
  "PUT_YOUR_VALID_PAID_KEY_HERE_2"
];

const KEYS_TIER_20 = [
  "PUT_YOUR_VALID_PAID_KEY_HERE_3",
  "PUT_YOUR_VALID_PAID_KEY_HERE_4"
];

const KEYS_TIER_100 = [
  "PUT_YOUR_VALID_PAID_KEY_HERE_5",
  "PUT_YOUR_VALID_PAID_KEY_HERE_6"
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
};
