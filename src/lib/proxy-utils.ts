
/**
 * Utility functions for proxy card data processing.
 */

/**
 * Parses a value that could be a single item, an array, or a JSON string into an array.
 * Robustly handles varied data formats from different APIs.
 */
export function parseProxyList(val: any): any[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return [];

        try {
            // Handle JSON arrays
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                return JSON.parse(trimmed);
            }
            // Handle comma separated values if they don't look like objects
            if (trimmed.includes(",") && !trimmed.includes("{")) {
                return trimmed.split(",").map(s => s.trim());
            }
            // Single value
            return [trimmed];
        } catch {
            return [trimmed];
        }
    }
    // Handle objects by wrapping them
    if (typeof val === 'object') return [val];

    return [];
}

/**
 * Formats energy cost icons for text-based proxies.
 * e.g. ["Grass", "Grass", "Colorless"] -> [GG C]
 */
export function formatAttackCost(cost: string[]): string {
    if (!cost || cost.length === 0) return "";
    return `[${cost.map(c => c.substring(0, 1).toUpperCase()).join("")}]`;
}
