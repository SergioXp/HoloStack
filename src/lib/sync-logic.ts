import { TCGdexCard } from "@/services/tcgdex";

export interface CollectionFilter {
    set?: string;
    series?: string | string[];
    name?: string;
    names?: string[];
    rarity?: string | string[];
    supertype?: string;
    subtypes?: string | string[];
}

/**
 * Filter cards in memory based on complex criteria.
 * This is used when the source API doesn't support fine-grained filtering (or we combined multiple sources).
 */
export function filterCardsInMemory(cards: TCGdexCard[], filters: CollectionFilter): TCGdexCard[] {
    return cards.filter(card => {
        // Name filter (Array)
        if (filters.names) {
            const nameMatch = filters.names.some(n => card.name.toLowerCase().includes(n.toLowerCase()));
            if (!nameMatch) return false;
        }
        // Name filter (Single)
        if (filters.name) {
            if (!card.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
        }

        // Series Filter
        // Note: TCGdexCard usually has `set: { id, name }`, but not always `series`.
        // However, if we filtered by series upstream or fetched by series, this check is redundant but safe.
        // If we strictly rely on series check here, we might fail if `card` object lacks context.
        // We generally assume that the candidate source (fetching stategy) is correct.
        // But if provided, we can try to check if we can infer it (we can't easily without fetching set details).
        // Since the Sync Route logic comment said "Logic: if filters.series is present, we used Priority 2...",
        // we will implement it such that strict filtering is only applied if we HAVE the info.
        // BUT, for unit testing, if we pass a card without series info, it might slip through?
        // Let's copy the logic I saw in the route: it essentially ignored series filter inside the loop 
        // because it relied on the "Source Strategy" to have handled it.
        // "if (filters.series) { ... // Logic: ... it will fetch via series strategy ... }"
        // So I will KEEP the comment or empty block, OR just omit it if it doesn't do anything.
        // The original code had a block that did nothing effective on variable `card`:

        /*
        // Series Filter (if checking strictly logic inside card, usually handled by source strategy but good to double check)
        if (filters.series) {
            // Logic commented out in original file effectively meant pass-through
        }
        */

        // Rarity Filter
        if (filters.rarity) {
            const rList = Array.isArray(filters.rarity) ? filters.rarity : [filters.rarity];
            const cardRarity = card.rarity?.toLowerCase() || "";
            // Fuzzy match for rarity types ("Illustration Rare" matches "Special Illustration Rare"?)
            const rarityMatch = rList.some(r => cardRarity.includes(r.toLowerCase()));
            if (!rarityMatch) return false;
        }

        // Supertype
        if (filters.supertype && card.category.toLowerCase() !== filters.supertype.toLowerCase()) return false;

        // Subtypes (Array)
        if (filters.subtypes) {
            const subsList = Array.isArray(filters.subtypes) ? filters.subtypes : [filters.subtypes];
            // Implementation note: TCGdex doesn't expose subtypes easily in the Card interface used here.
            // The original code passed through because it couldn't check easily without `subtypes` prop.
            // If we want to support it, we need to map `stage` or check name.
            // For now, mirroring strict behavior: if we can't check, do we pass or fail?
            // Original code had empty check block effectively passing.
            // Let's implement it if we can, otherwise leave as pass-through.
            // "if (filters.subtypes) { ... // For now, ignore subtypes strict check ... }"
        }

        return true;
    });
}
