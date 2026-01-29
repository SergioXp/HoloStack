/**
 * TCGdex API Service
 * 
 * API Documentation: https://tcgdex.dev/
 * Base URL: https://api.tcgdex.net/v2
 * 
 * Features:
 * - No API key required
 * - Fast response times (~50ms)
 * - Includes prices (TCGPlayer + Cardmarket)
 * - Multilingual support
 */

const BASE_URL = "https://api.tcgdex.net/v2";
const DEFAULT_LANG = "en"; // English has most complete data

// ==========================================
// TYPES
// ==========================================

export interface TCGdexSet {
    id: string;
    name: string;
    symbol?: string;
    logo?: string;
    cardCount: {
        total: number;
        official: number;
    };
    releaseDate?: string;
    serie?: {
        id: string;
        name: string;
    };
    legal?: {
        standard: boolean;
        expanded: boolean;
    };
    cards?: TCGdexCardBrief[];
}

export interface TCGdexCardBrief {
    id: string;
    localId: string;
    name: string;
    image?: string;
}

export interface TCGdexCard {
    id: string;
    localId: string;
    name: string;
    image?: string;
    category: string;
    illustrator?: string;
    rarity?: string;
    hp?: number;
    types?: string[];
    evolveFrom?: string;
    stage?: string;
    abilities?: {
        type: string;
        name: string;
        effect: string;
    }[];
    attacks?: {
        cost: string[];
        name: string;
        effect?: string;
        damage?: number | string;
    }[];
    weaknesses?: {
        type: string;
        value: string;
    }[];
    resistances?: {
        type: string;
        value: string;
    }[];
    retreat?: number;
    set: {
        id: string;
        name: string;
        logo?: string;
        symbol?: string;
        cardCount?: {
            official: number;
            total: number;
        };
    };
    legal?: {
        standard: boolean;
        expanded: boolean;
    };
    pricing?: {
        cardmarket?: {
            updated: string;
            unit: string;
            avg?: number;
            low?: number;
            trend?: number;
            avg1?: number;
            avg7?: number;
            avg30?: number;
        };
        tcgplayer?: {
            updated: string;
            unit: string;
            holofoil?: {
                lowPrice?: number;
                midPrice?: number;
                highPrice?: number;
                marketPrice?: number;
            };
            normal?: {
                lowPrice?: number;
                midPrice?: number;
                highPrice?: number;
                marketPrice?: number;
            };
        };
    };
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * Fetch with error handling
 */
async function tcgdexFetch<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}/${DEFAULT_LANG}${endpoint}`;
    // console.log(`[TCGdex] Fetching: ${url}`); // Reducir ruido si es necesario, o mantener debug

    try {
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
            throw new Error(`TCGdex API error: ${res.status} ${res.statusText}`);
        }

        return res.json();
    } catch (error) {
        console.error(`[TCGdex] Fetch Error for ${url}:`, error);
        throw error;
    }
}

/**
 * Get cards by Name query (summary list)
 */
export async function fetchCardsByName(name: string): Promise<TCGdexCardBrief[]> {
    const data = await tcgdexFetch<TCGdexCardBrief[]>(`/cards?name=${encodeURIComponent(name)}`);
    return data || [];
}

/**
 * Get list of all sets (summary only)
 * Optionally enrich with series info by fetching series detailed data
 */
export async function fetchAllSets(enrichWithSeries = false): Promise<TCGdexSet[]> {
    const sets = await tcgdexFetch<TCGdexSet[]>("/sets");

    if (enrichWithSeries) {
        try {
            // Fetch all series to map sets to their series
            const seriesList = await fetchSeries();
            const setSeriesMap = new Map<string, string>(); // SetID -> SeriesName

            // Fetch details for each series to know which sets belong to it
            // We do this in parallel but with a concurrency limit if needed, though TCGdex handles it well
            await Promise.all(seriesList.map(async (serie) => {
                try {
                    const details = await fetchSeriesDetails(serie.id);
                    if (details.sets) {
                        details.sets.forEach((s: any) => {
                            setSeriesMap.set(s.id, serie.name);
                        });
                    }
                } catch (e) {
                    console.error(`Failed to fetch series details for ${serie.id}`, e);
                }
            }));

            // Enrich sets
            return sets.map(set => ({
                ...set,
                serie: setSeriesMap.has(set.id) ? { id: "", name: setSeriesMap.get(set.id)! } : set.serie
            }));

        } catch (error) {
            console.error("Error enriching sets with series info:", error);
            return sets; // Fallback to raw sets
        }
    }

    return sets;
}

/**
 * Get list of all series
 */
export async function fetchSeries(): Promise<any[]> {
    return tcgdexFetch<any[]>("/series");
}

/**
 * Get details of a specific series (includes list of sets)
 */
export async function fetchSeriesDetails(seriesId: string): Promise<any> {
    return tcgdexFetch<any>(`/series/${seriesId}`);
}

/**
 * Get a specific set with all its cards
 */
export async function fetchSet(setId: string): Promise<TCGdexSet> {
    return tcgdexFetch<TCGdexSet>(`/sets/${setId}`);
}

/**
 * Get a specific card with full details
 */
export async function fetchCard(cardId: string): Promise<TCGdexCard> {
    return tcgdexFetch<TCGdexCard>(`/cards/${cardId}`);
}

/**
 * Get all cards from a set with full details
 * This fetches each card individually for complete data
 * Returns both the full set metadata and the detailed cards
 */
export async function fetchSetCardsDetailed(setId: string): Promise<{ set: TCGdexSet, cards: TCGdexCard[] }> {
    // First get the set to get card IDs and Metadata
    let set: TCGdexSet;
    try {
        set = await fetchSet(setId);
    } catch (e: any) {
        // Si el set da 404 (común en sets futuros listados pero sin datos), devolver vacío
        if (e.message.includes("404")) {
            console.warn(`[TCGdex] Set ${setId} returns 404 (probably future set), returning empty.`);
            return {
                set: { id: setId, name: "Unknown", cardCount: { total: 0, official: 0 } },
                cards: []
            };
        }
        throw e;
    }

    if (!set.cards || set.cards.length === 0) {
        console.log(`[TCGdex] Set ${setId} has no cards`);
        return { set, cards: [] };
    }

    console.log(`[TCGdex] Fetching ${set.cards.length} cards from ${setId}`);

    // Fetch all cards in batches to avoid network saturation / socket exhaustion
    // Sets can have 200+ cards, firing 200 requests at once helps no one.
    const BATCH_SIZE = 20;
    const cards: (TCGdexCard | null)[] = [];

    for (let i = 0; i < set.cards.length; i += BATCH_SIZE) {
        const batch = set.cards.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(card => fetchCard(card.id).catch(err => {
            if (err.message.includes("404")) {
                console.warn(`[TCGdex] Card ${card.id} not found (404), skipping...`);
            } else {
                console.error(`[TCGdex] Error fetching card ${card.id}:`, err);
            }
            return null;
        }));

        const batchResults = await Promise.all(batchPromises);
        cards.push(...batchResults);
    }

    const validCards = cards.filter((c): c is TCGdexCard => c !== null);
    return { set, cards: validCards };
}

/**
 * Get all cards by Rarity (summary list)
 */
export async function fetchCardsByRarity(rarity: string): Promise<TCGdexCardBrief[]> {
    const data = await tcgdexFetch<any>(`/rarities/${encodeURIComponent(rarity)}`);
    return data.cards || [];
}

/**
 * Get all cards by Category/Supertype (summary list)
 */
export async function fetchCardsByCategory(category: string): Promise<TCGdexCardBrief[]> {
    const data = await tcgdexFetch<any>(`/categories/${encodeURIComponent(category)}`);
    return data.cards || [];
}

/**
 * Get all cards by Name query (summary list)
 * Note: TCGdex doesn't have a direct "search by name" endpoint that returns a list in the same format easily documented
 * but often /cards?name=... works. Let's verify.
 * Actually, checking docs, it scans. For now let's skip strict Name global search support via TCGdex API directly in this helper
 * if not sure. But strict name exact match is just filtering.
 * Let's assume we can fetch by name or filter later.
 * 
 * UPDATE: To robustly hydrate a list of brief cards into detailed cards:
 */
export async function fetchDetailedCards(briefs: TCGdexCardBrief[]): Promise<TCGdexCard[]> {
    const details: TCGdexCard[] = [];
    const BATCH_SIZE = 10; // Process in small batches

    console.log(`[TCGdex] Hydrating ${briefs.length} cards...`);

    for (let i = 0; i < briefs.length; i += BATCH_SIZE) {
        const batch = briefs.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (b) => {
            try {
                return await fetchCard(b.id);
            } catch (error) {
                console.warn(`[TCGdex] Failed to fetch card detail for ${b.id}:`, error);
                return null;
            }
        });

        const results = await Promise.all(promises);
        results.forEach(r => {
            if (r) details.push(r);
        });

        // Small delay between batches
        if (i + BATCH_SIZE < briefs.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return details;
}

// ==========================================
// TRANSFORMATION HELPERS
// ==========================================

/**
 * Transform TCGdex card to our DB schema format
 */
export function transformCardToSchema(card: TCGdexCard) {
    return {
        id: card.id,
        name: card.name,
        supertype: card.category || "Pokémon",
        subtypes: JSON.stringify([card.stage || "Basic"]),
        hp: card.hp ? String(card.hp) : null,
        types: JSON.stringify(card.types || []),
        evolvesFrom: card.evolveFrom || null,

        // Gameplay Fields mapping
        attacks: card.attacks ? JSON.stringify(card.attacks) : null,
        abilities: card.abilities ? JSON.stringify(card.abilities) : null,
        weaknesses: card.weaknesses ? JSON.stringify(card.weaknesses) : null,
        retreatCost: card.retreat ? JSON.stringify(Array(card.retreat).fill("Colorless")) : null, // TCGdex gives number, converting to array representation if needed or just storing number? Schema says json. Let's store as is or convert. Proxy usually needs cost array. TCGdex gives number. Let's start with null if undefined. Wait, TextProxyCard expects string[] for retreatCost.
        // TCGdex "retreat" is a number (e.g. 2). TextProxyCard expects string[].
        // Let's converting number to array of "Colorless".

        setId: card.set.id,
        number: card.localId,
        artist: card.illustrator || null,
        rarity: card.rarity || null,
        // legalities removed
        images: JSON.stringify({
            small: card.image ? `${card.image}/low.webp` : null,
            large: card.image ? `${card.image}/high.webp` : null,
        }),
        tcgplayerPrices: JSON.stringify(card.pricing?.tcgplayer || {}),
        cardmarketPrices: JSON.stringify(card.pricing?.cardmarket || {}),
        isPartial: false,
        syncedAt: new Date(),
    };
}

/**
 * Transform TCGdex set to our DB schema format
 */
export function transformSetToSchema(set: TCGdexSet) {
    return {
        id: set.id,
        name: set.name,
        series: set.serie?.name || "Unknown",
        printedTotal: set.cardCount.official,
        total: set.cardCount.total,
        // legalities removed
        releaseDate: set.releaseDate || null,
        syncedAt: new Date(),
        images: JSON.stringify({
            symbol: set.symbol ? `${set.symbol}.webp` : null,
            logo: set.logo ? `${set.logo}.webp` : null,
        }),
    };
}
