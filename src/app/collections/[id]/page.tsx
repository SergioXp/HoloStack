import { notFound } from "next/navigation";
import { db } from "@/db";
import { collections, collectionItems, cards, sets, userProfiles } from "@/db/schema";
import { eq, and, sql, inArray, like, notInArray } from "drizzle-orm";
import CollectionDetailClient from "@/components/CollectionDetailClient";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const collection = await db.query.collections.findFirst({
        where: eq(collections.id, id),
    });

    if (!collection) {
        notFound();
    }

    const ownedItems = await db.select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, id));

    const ownershipMap = new Map<string, Map<string, { quantity: number, id: string, notes?: string | null }>>();

    ownedItems.forEach(item => {
        if (!ownershipMap.has(item.cardId)) {
            ownershipMap.set(item.cardId, new Map());
        }
        const variantsMap = ownershipMap.get(item.cardId)!;
        const currentData = variantsMap.get(item.variant);
        const newQuantity = (currentData?.quantity || 0) + (item.quantity || 0);

        variantsMap.set(item.variant, {
            quantity: newQuantity,
            id: item.id,
            notes: item.notes
        });
    });

    let displayCards: any[] = [];
    let totalCardsCount = 0;

    if (collection.type === "auto" && collection.filters) {
        const filters = JSON.parse(collection.filters);

        // We need to join with sets for Series filtering
        // We select cards.* to keep structure consistent
        const query = db.select({
            card: cards
        }).from(cards)
            .leftJoin(sets, eq(cards.setId, sets.id));

        const conditions = [];

        // 1. Set ID
        if (filters.set) {
            conditions.push(eq(cards.setId, filters.set));
        }

        // 2. Series (String or Array)
        if (filters.series) {
            const seriesList = Array.isArray(filters.series) ? filters.series : [filters.series];
            if (seriesList.length > 0) {
                conditions.push(inArray(sets.series, seriesList));
            }
        }

        // 3. Rarity (String or Array)
        if (filters.rarity) {
            const rList = Array.isArray(filters.rarity) ? filters.rarity : [filters.rarity];
            if (rList.length > 0) {
                // Database rarities might differ slightly from TCGDex filters (e.g. "Rare Ultra" vs "Ultra Rare")
                // TCGDex API might return "Ultra Rare" but DB stores "Rare Ultra" or vice versa depending on source.
                // Also, we want "Illustration Rare" to match if DB has "Illustration Rare" or similar.
                // Strict strict equality (inArray) fails if casing or exact string differs.
                // Let's try constructing an OR block of LIKEs for rarities to be safe?
                // Or stick to inArray but verify data.
                // User log shows filter: ['Illustration Rare', 'Special Illustration Rare', 'Rare Ultra', ...]
                // DB has: 'Ultra Rare', 'Secret Rare'.
                // Mismatch! Filter says 'Rare Ultra', DB says 'Ultra Rare'.

                // Strategy: Try to match both exact and "swapped words" or just standardizing.
                // Better yet, use OR Like for each rarity filter item to handle partials?
                // ex: filter "Rare Ultra" -> matches "%Rare%" AND "%Ultra%"? Too broad.

                // Let's use `or(...)` with multiple `eq` or `like`.
                // const rarityConditions = rList.map((r: string) => {
                //    return eq(cards.rarity, r);
                // });

                // Use case-insensitive comparison for rarities to match "Illustration rare" with "Illustration Rare"
                const orRarity = sql`(${sql.join(rList.map((r: string) => {
                    // Handle manual overrides if needed, but lower() should cover most
                    if (r === "Rare Ultra") return sql`lower(${cards.rarity}) = 'ultra rare' OR lower(${cards.rarity}) = 'rare ultra'`;
                    return sql`lower(${cards.rarity}) = ${r.toLowerCase()}`;
                }), sql` OR `)})`;

                conditions.push(orRarity);
            }
        }

        // 4. Name (Substring match - for "Pikachu" to match "Pikachu V")
        if (filters.name) {
            // Use like with simpler syntax for single condition
            conditions.push(like(sql`lower(${cards.name})`, `%${filters.name.toLowerCase()}%`));
        }

        // 5. Names List (Exact match - for 151 list)
        // 5. Names List (Array of exact names)
        if (filters.names && Array.isArray(filters.names) && filters.names.length > 0) {
            // "Bulbasaur" should match "Bulbasaur" exactly, but maybe "Uncommon" variants?
            // DB has "Bulbasaur", "Erika's Bulbasaur".
            // Original 151 list usually implies the Species.
            // If filter is ['Bulbasaur', ...], we want any card that IS a Bulbasaur?
            // "Erika's Bulbasaur" is a Bulbasaur card.
            // If we use `inArray`, "Erika's Bulbasaur" won't match "Bulbasaur".

            // If the user wants ALL variants of 151, we should use LIKE for each name.
            // This creates a huge query: name LIKE '%Bulbasaur%' OR name LIKE '%Ivysaur%' ...
            // Valid for SQL (LIMIT usually handles max expression depth). 151 ORs might be okay.

            // To ensure matches like "Erika's Bulbasaur" are included when searching for "Bulbasaur",
            // we must use LIKE. `inArray` only matches exact strings.
            // But 151 LIKEs is heavy. 
            // Is there a better way? 
            // If the collection is "Original 151", we probably want to see any card relating to them.
            // Let's iterate and build a massive OR condition. SQLite can handle it (default max expression tree depth is usually 1000). 151 is fine.

            const nameConditions = filters.names.map((n: string) => like(sql`lower(${cards.name})`, `%${n.toLowerCase()}%`));
            conditions.push(sql`(${sql.join(nameConditions, sql` OR `)})`);
        }

        // 6. Supertype
        if (filters.supertype) {
            conditions.push(eq(cards.supertype, filters.supertype));
        }

        // 7. Subtypes (if needed in future) - Array check logic is complex in JSON, skipping for now

        // 8. Excluded Cards (User manually removed from Auto collection)
        if (filters.excludedCardIds && Array.isArray(filters.excludedCardIds) && filters.excludedCardIds.length > 0) {
            conditions.push(notInArray(cards.id, filters.excludedCardIds));
        }

        if (conditions.length > 0) {
            // @ts-ignore
            const results = await query.where(and(...conditions));
            displayCards = results.map(r => r.card);
        } else {
            // No valid filters? Return empty to avoid showing all 20k cards accidentally
            displayCards = [];
        }

        // Custom sort for "Original 151" or Pokedex based collections
        // If sorting by "number", we usually mean Set Number.
        // But for "Original 151", users expect Pokedex order (Bulbasaur #1, Ivysaur #2...).
        // Since we don't store Pokedex Number in DB explicitly, we can infer it from the predefined list index!

        let pokedexOrderMap: Map<string, number> | null = null;
        if (filters.names && Array.isArray(filters.names) && filters.names.length > 1) {
            pokedexOrderMap = new Map();
            filters.names.forEach((n: string, i: number) => {
                pokedexOrderMap!.set(n.toLowerCase(), i + 1);
            });
        }

        const currentSortBy = collection.sortBy || "number";
        const subSort = filters.subSort || "number";

        const getPrice = (card: any) => {
            // Check TCGPlayer first
            let prices = card.tcgplayerPrices;
            if (prices) {
                try {
                    const p = typeof prices === 'string' ? JSON.parse(prices) : prices;
                    const price = p.marketPrice || p.holofoil?.marketPrice || p.normal?.marketPrice;
                    if (price > 0) return price;
                } catch { }
            }

            // Fallback to Cardmarket
            prices = card.cardmarketPrices;
            if (prices) {
                try {
                    const p = typeof prices === 'string' ? JSON.parse(prices) : prices;
                    const price = p.avg || p.trend || p.low;
                    if (price > 0) return price; // Note: Mixing currencies in raw sort, but usually consistently one source per card
                } catch { }
            }
            return 0;
        };

        displayCards.sort((a, b) => {
            // Price Sort (Primary)
            if (currentSortBy === "price") {
                return getPrice(b) - getPrice(a);
            }

            // Rarity Sort
            if (currentSortBy === "rarity") {
                const RARITY_RANK: Record<string, number> = {
                    "Common": 1,
                    "Uncommon": 2,
                    "Rare": 3,
                    "Double Rare": 4,
                    "Ultra Rare": 5,
                    "Illustration Rare": 6,
                    "Special Illustration Rare": 7,
                    "Secret Rare": 8,
                    "Hyper Rare": 9,
                    "SIR": 10
                };
                const rA = RARITY_RANK[a.rarity] || 0;
                const rB = RARITY_RANK[b.rarity] || 0;
                return rB - rA;
            }

            // Name Sort
            if (currentSortBy === "name") {
                return a.name.localeCompare(b.name);
            }

            // Pokedex Order Sort
            if (currentSortBy === "pokedex") {
                if (pokedexOrderMap) {
                    const getPokedexIndex = (cardName: string) => {
                        const lower = cardName.toLowerCase();
                        for (const [key, index] of pokedexOrderMap!.entries()) {
                            if (lower.includes(key)) return index;
                        }
                        return 9999;
                    };

                    const idxA = getPokedexIndex(a.name);
                    const idxB = getPokedexIndex(b.name);

                    if (idxA !== idxB) return idxA - idxB;

                    // Secondary Sort (SubSort)
                    if (subSort === "priceDesc") {
                        const priceDiff = getPrice(b) - getPrice(a);
                        if (priceDiff !== 0) return priceDiff;
                    }
                    if (subSort === "priceAsc") {
                        const priceDiff = getPrice(a) - getPrice(b);
                        if (priceDiff !== 0) return priceDiff;
                    }
                    if (subSort === "dateDesc") {
                        // Proxied by Set ID descend for now
                        if (a.setId !== b.setId) return b.setId.localeCompare(a.setId);
                    }
                }
            }

            // Fallback: Set ID
            if (a.setId !== b.setId) return a.setId.localeCompare(b.setId);

            // Fallback: Set Number
            const numA = parseInt(a.number.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.number.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        totalCardsCount = displayCards.length;

    } else {
        const items = await db.query.collectionItems.findMany({
            where: eq(collectionItems.collectionId, collection.id),
            with: {
                card: true
            }
        });
        displayCards = items.map(i => i.card);
        totalCardsCount = items.length;
    }

    const uniqueOwnedCount = displayCards.filter(c => ownershipMap.has(c.id)).length;
    const progress = totalCardsCount > 0 ? Math.round((uniqueOwnedCount / totalCardsCount) * 100) : 0;
    const isComplete = progress === 100;

    const uniqueSets = new Set(displayCards.map(c => c.setId));
    const isMultiSet = uniqueSets.size > 1;

    // Siempre cargar nombres de sets para la vista de tabla
    const setNameMap = new Map<string, string>();
    if (uniqueSets.size > 0) {
        const setIds = Array.from(uniqueSets);
        const setRecords = await db.select({ id: sets.id, name: sets.name })
            .from(sets)
            .where(sql`${sets.id} IN (${sql.join(setIds.map(id => sql`${id}`), sql`, `)})`);
        setRecords.forEach(s => setNameMap.set(s.id, s.name));
    }

    // Obtener moneda preferida del usuario
    const userProfile = await db.query.userProfiles.findFirst();
    const preferredCurrency = (userProfile?.preferredCurrency as "EUR" | "USD") || "EUR";

    // Serializar para Client Component
    const serializedCollection = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        type: collection.type,
        language: collection.language,
        showPrices: collection.showPrices ?? false,
        sortBy: collection.sortBy,
        filters: collection.filters,
        notes: collection.notes,
    };

    const serializedCards = displayCards.map(c => ({
        ...c,
        syncedAt: c.syncedAt ? c.syncedAt.toISOString() : null,
    }));

    return (
        <CollectionDetailClient
            collection={serializedCollection}
            displayCards={serializedCards}
            ownershipData={Object.fromEntries(
                Array.from(ownershipMap.entries()).map(([cardId, variantMap]) => [
                    cardId,
                    Object.fromEntries(variantMap.entries())
                ])
            )}
            totalCardsCount={totalCardsCount}
            uniqueOwnedCount={uniqueOwnedCount}
            progress={progress}
            isComplete={isComplete}
            isMultiSet={isMultiSet}
            setNames={Object.fromEntries(setNameMap.entries())}
            userCurrency={preferredCurrency}
        />
    );
}
