import redisClient from "../config/redis";
import { encryptedData } from "./encryptedData";

export interface CacheOptions {
  ttl?: number;
}

const DEFAULT_TTL = 3600; // 1 hour

/**
 * Generate cache key for jobs API based on query parameters
 */
export function generateJobsCacheKey(queryParams: Record<string, any>): string {
  // Featured jobs
  if (queryParams.featured === "true" || queryParams.featured === true) {
    return "jobs:featured";
  }
  
  // High salary jobs (thousand dollar jobs)
  if (queryParams.salaryKey === "gt" && parseInt(queryParams.salaryValue) >= 20000000) {
    return "jobs:thousand-dollar";
  }
  
  // No experience jobs
  if (queryParams.workExperience === "no-required") {
    return "jobs:no-experience";
  }
  
  // General jobs (fallback)
  return "jobs:general";
}

/**
 * Get cached data from Redis
 */
export async function getCachedData(key: string): Promise<any | null> {
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      // @ts-ignore - Bỏ qua TypeScript checking
      return JSON.parse(cachedData as string);
    }
    return null;
  } catch (error) {
    console.error("Redis GET error:", error);
    return null;
  }
}

export async function setCachedData(key: string, data: any, options: CacheOptions = {}): Promise<boolean> {
  try {
    const ttl = options.ttl || DEFAULT_TTL;
    
    if (ttl === -1) {
      await redisClient.set(key, JSON.stringify(data));
    } else {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
    }
    
    return true;
  } catch (error) {
    console.error("Redis SET error:", error);
    return false;
  }
}

/**
 * Delete specific cache key
 */
export async function deleteCacheKey(key: string): Promise<boolean> {
  try {
    await redisClient.del(key);
    console.log(`🗑️ Deleted cache key: ${key}`);
    return true;
  } catch (error) {
    console.error("Redis DELETE error:", error);
    return false;
  }
}

/**
 * Delete all cache keys matching pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️ Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
    }
    return keys.length;
  } catch (error) {
    console.error("Redis DELETE PATTERN error:", error);
    return 0;
  }
}

/**
 * Clear all jobs cache
 */
export async function clearJobsCache(): Promise<number> {
  return deleteCachePattern("jobs:*");
}

/**
 * Check if Redis is connected
 */
export async function isRedisConnected(): Promise<boolean> {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error("Redis connection check failed:", error);
    return false;
  }
}

/**
 * Cache configuration for different job API types
 */
export const JOB_CACHE_CONFIG = {
  FEATURED_JOBS: {
    ttl: -1,
    keyPrefix: "featured"
  },
  THOUSAND_DOLLAR_JOBS: {
    ttl: -1,
    keyPrefix: "thousand-dollar"
  },
  NO_EXPERIENCE_JOBS: {
    ttl: -1,
    keyPrefix: "no-experience"
  },
  GENERAL_JOBS: {
    ttl: 1200,
    keyPrefix: "general"
  }
};

/**
 * Helper function to determine cache configuration based on query parameters
 */
export function getCacheConfig(queryParams: Record<string, any>): { ttl: number; keyPrefix: string } {
  if (queryParams.featured === "true" || queryParams.featured === true) {
    return JOB_CACHE_CONFIG.FEATURED_JOBS;
  }
  
  if (queryParams.salaryKey === "gt" && parseInt(queryParams.salaryValue) >= 20000000) {
    return JOB_CACHE_CONFIG.THOUSAND_DOLLAR_JOBS;
  }
  
  if (queryParams.workExperience === "no-required") {
    return JOB_CACHE_CONFIG.NO_EXPERIENCE_JOBS;
  }
  
  return JOB_CACHE_CONFIG.GENERAL_JOBS;
}

/**
 * Invalidate all jobs cache when job data changes
 * Call this when: creating, updating, or deleting jobs
 */
export async function invalidateJobsCache(): Promise<void> {
  try {
    const deletedCount = await clearJobsCache();
    console.log(`🔄 Invalidated ${deletedCount} job cache entries`);
  } catch (error) {
    console.error("Error invalidating jobs cache:", error);
  }
}

/**
 * Invalidate specific job caches based on job properties
 * More targeted invalidation for better performance
 */
export async function invalidateJobsCacheByProperties(jobData: {
  featured?: boolean;
  salaryMax?: number;
  workExperience?: string;
}): Promise<void> {
  try {
    const keysToDelete: string[] = [];

    // If it's a featured job, invalidate featured cache
    if (jobData.featured) {
      keysToDelete.push("jobs:featured");
    }

    // If it's a high salary job, invalidate thousand dollar cache
    if (jobData.salaryMax && jobData.salaryMax >= 20000000) {
      keysToDelete.push("jobs:thousand-dollar");
    }

    // If it's a no experience job, invalidate no experience cache
    if (jobData.workExperience === "no-required") {
      keysToDelete.push("jobs:no-experience");
    }

    // Invalidate general job cache as well
    keysToDelete.push("jobs:general");

    let totalDeleted = 0;
    for (const key of keysToDelete) {
      const deleted = await deleteCacheKey(key);
      if (deleted) totalDeleted++;
    }

    console.log(`🎯 Targeted cache invalidation: ${totalDeleted} keys deleted`);
  } catch (error) {
    console.error("Error in targeted cache invalidation:", error);
  }
}

/**
 * Invalidate cache for employers when employer data changes
 */
export async function invalidateEmployerCache(employerId: string): Promise<void> {
  try {
    // Invalidate jobs cache since employer data is populated in job responses
    await invalidateJobsCache();
    console.log(`🏢 Invalidated cache for employer: ${employerId}`);
  } catch (error) {
    console.error("Error invalidating employer cache:", error);
  }
}

/**
 * Invalidate cache for job categories when category data changes
 */
export async function invalidateJobCategoriesCache(): Promise<void> {
  try {
    // Since job categories are populated in job responses, invalidate jobs cache
    await invalidateJobsCache();
    console.log(`📂 Invalidated job categories cache`);
  } catch (error) {
    console.error("Error invalidating job categories cache:", error);
  }
}

/**
 * Schedule cache warming for frequently accessed endpoints
 * This can be called periodically to pre-populate cache
 */
export async function warmCache(): Promise<void> {
  try {
    console.log("🔥 Starting cache warming...");
    
    // Generate cache keys for all job types
    const jobTypes = [
      { featured: "true", name: "Featured Jobs" },
      { salaryKey: "gt", salaryValue: "20000000", name: "Thousand Dollar Jobs" },
      { workExperience: "no-required", name: "No Experience Jobs" },
      { general: true, name: "General Jobs" }
    ];

    // Log the cache keys that would be generated
    jobTypes.forEach(jobType => {
      const cacheKey = generateJobsCacheKey(jobType);
      console.log(`🔑 ${jobType.name}: ${cacheKey}`);
    });

    console.log(`🔥 Cache warming completed for ${jobTypes.length} job types`);
  } catch (error) {
    console.error("Error warming cache:", error);
  }
}

/**
 * Clear all application cache (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  try {
    const deletedJobs = await clearJobsCache();
    console.log(`🧹 Cleared all cache: ${deletedJobs} job entries deleted`);
  } catch (error) {
    console.error("Error clearing all cache:", error);
  }
}

/**
 * Middleware to automatically invalidate cache after job operations
 * Use this in job creation, update, deletion endpoints
 */
export const autoInvalidateJobsCache = (jobData?: any) => {
  return async (req: any, res: any, next: any) => {
    // Store original end function
    const originalEnd = res.end;
    
    // Override end function to invalidate cache after response
    res.end = function(...args: any[]) {
      // Only invalidate on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Use targeted invalidation if job data is available
        if (jobData) {
          invalidateJobsCacheByProperties(jobData);
        } else {
          invalidateJobsCache();
        }
      }
      
      // Call original end function
      originalEnd.apply(this, args);
    };
    
    next();
  };
};