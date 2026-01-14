
/**
 * Utility functions for date and price freshness.
 */

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks if a price is stale relative to a given reference date (defaults to now).
 */
export function isPriceStale(syncedAt: Date | null | string, referenceDate: Date = new Date()): boolean {
    if (!syncedAt) return true;

    const syncedDate = typeof syncedAt === 'string' ? new Date(syncedAt) : syncedAt;

    // Check for invalid date
    if (isNaN(syncedDate.getTime())) return true;

    const diff = referenceDate.getTime() - syncedDate.getTime();
    return diff > MAX_AGE_MS;
}
