
/**
 * Utility functions for market price alerts and notifications.
 */

/**
 * Checks if a price drop exceeds a certain threshold percentage.
 */
export function isPriceDropSignificant(oldPrice: number, newPrice: number, thresholdPercent: number = 10): boolean {
    if (oldPrice <= 0 || newPrice <= 0) return false;
    if (newPrice >= oldPrice) return false;

    const drop = oldPrice - newPrice;
    const dropPercentage = (drop / oldPrice) * 100;

    return dropPercentage >= thresholdPercent;
}

/**
 * Formats a price change for display.
 */
export function formatPriceChange(oldPrice: number, newPrice: number): { diff: number, percent: number, isDrop: boolean } {
    const diff = newPrice - oldPrice;
    const percent = oldPrice > 0 ? (diff / oldPrice) * 100 : 0;
    return {
        diff: Number(diff.toFixed(2)),
        percent: Number(percent.toFixed(1)),
        isDrop: diff < 0
    };
}
