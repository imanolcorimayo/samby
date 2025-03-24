import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUOTA_CACHE_PATH = path.join(__dirname, "../.gemini_quota_cache.json");

class GeminiAiHandler {
  constructor(apiKey = process.env.GEMINIAI_API_KEY) {
    if (!apiKey) {
      throw new Error("GEMINIAI_API_KEY is not defined in .env file");
    }
    this.apiKey = apiKey;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    this.quotaCache = {
      requestCount: 0,
      dayStartTimestamp: Date.now(),
      lastCheckTimestamp: null,
      quotaExceeded: false
    };
    this.MAX_DAILY_REQUESTS = 200; // Free tier limit (adjust based on your plan)
  }

  /**
   * Load the quota cache from disk
   * @returns {Promise<void>}
   */
  async loadQuotaCache() {
    try {
      const fileExists = await fs
        .access(QUOTA_CACHE_PATH)
        .then(() => true)
        .catch(() => false);

      if (fileExists) {
        const cacheContent = await fs.readFile(QUOTA_CACHE_PATH, "utf8");
        const cache = JSON.parse(cacheContent);

        // Check if we should reset the daily counter
        const cachedDate = new Date(cache.dayStartTimestamp);
        const currentDate = new Date();

        // Reset counter if it's a new day
        if (
          cachedDate.getDate() !== currentDate.getDate() ||
          cachedDate.getMonth() !== currentDate.getMonth() ||
          cachedDate.getFullYear() !== currentDate.getFullYear()
        ) {
          this.quotaCache = {
            requestCount: 0,
            dayStartTimestamp: Date.now(),
            lastCheckTimestamp: null,
            quotaExceeded: false
          };
        } else {
          this.quotaCache = cache;
        }
      }
    } catch (error) {
      console.warn("Error loading quota cache (will create a new one):", error.message);
      // Initialize with default values if cache can't be loaded
      this.quotaCache = {
        requestCount: 0,
        dayStartTimestamp: Date.now(),
        lastCheckTimestamp: null,
        quotaExceeded: false
      };
    }
  }

  /**
   * Save the quota cache to disk
   * @returns {Promise<void>}
   */
  async saveQuotaCache() {
    try {
      await fs.writeFile(QUOTA_CACHE_PATH, JSON.stringify(this.quotaCache, null, 2));
    } catch (error) {
      console.error("Error saving quota cache:", error);
    }
  }

  /**
   * Check if we've exceeded the free tier quota
   * @returns {Promise<boolean>} True if quota is exceeded
   */
  async checkQuotaStatus() {
    // Load the latest quota cache
    await this.loadQuotaCache();

    // If we've already determined quota is exceeded, return early
    if (this.quotaCache.quotaExceeded) {
      return true;
    }

    // Check if we should increment the counter
    this.quotaCache.requestCount++;
    this.quotaCache.lastCheckTimestamp = Date.now();

    // Check if we've exceeded the limit
    const quotaExceeded = this.quotaCache.requestCount > this.MAX_DAILY_REQUESTS;
    this.quotaCache.quotaExceeded = quotaExceeded;

    // Save the updated cache
    await this.saveQuotaCache();

    return quotaExceeded;
  }

  /**
   * Generate content using Gemini AI
   * @param {string} prompt - The prompt to send to the API
   * @param {string} model - The model to use
   * @returns {Promise<Object>} - The API response
   */
  async generateContent(prompt, model = "gemini-2.0-flash") {
    // Check quota status before making the request
    const quotaExceeded = await this.checkQuotaStatus();
    if (quotaExceeded) {
      throw new Error("Daily Gemini AI free tier quota exceeded. Please try again tomorrow or upgrade your plan.");
    }

    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded - mark quota as exceeded
          this.quotaCache.quotaExceeded = true;
          await this.saveQuotaCache();
          throw new Error("Gemini AI rate limit exceeded. Please try again later.");
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error calling Gemini AI:", error);
      throw error;
    }
  }

  /**
   * Extract text from Gemini API response
   * @param {Object} response - The API response
   * @returns {string|null} - The extracted text or null
   */
  extractTextFromResponse(response) {
    try {
      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts[0].text;
      }
      return null;
    } catch (error) {
      console.error("Error extracting text from response:", error);
      return null;
    }
  }

  /**
   * Reset the quota counter (useful for manual override)
   * @returns {Promise<void>}
   */
  async resetQuotaCounter() {
    this.quotaCache = {
      requestCount: 0,
      dayStartTimestamp: Date.now(),
      lastCheckTimestamp: null,
      quotaExceeded: false
    };
    await this.saveQuotaCache();
    console.log("Gemini AI quota counter has been reset.");
  }

  /**
   * Get current quota usage stats
   * @returns {Promise<Object>} Quota usage statistics
   */
  async getQuotaStats() {
    await this.loadQuotaCache();
    return {
      requestCount: this.quotaCache.requestCount,
      maxDailyRequests: this.MAX_DAILY_REQUESTS,
      quotaExceeded: this.quotaCache.quotaExceeded,
      requestsRemaining: Math.max(0, this.MAX_DAILY_REQUESTS - this.quotaCache.requestCount),
      dayStarted: new Date(this.quotaCache.dayStartTimestamp).toISOString(),
      lastCheck: this.quotaCache.lastCheckTimestamp ? new Date(this.quotaCache.lastCheckTimestamp).toISOString() : null
    };
  }
}

export default GeminiAiHandler;
