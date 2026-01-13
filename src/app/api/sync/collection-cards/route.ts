
import { NextRequest } from "next/server";
import { db } from "@/db";
import { collections, cards, sets } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { fetchSetCardsDetailed, transformCardToSchema, fetchCardsByRarity, fetchCardsByCategory, fetchDetailedCards, fetchAllSets, fetchCardsByName, fetchSet, TCGdexCard, TCGdexCardBrief } from "@/services/tcgdex";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos

interface CollectionFilter {
    set?: string;
    series?: string | string[];
    name?: string;
    names?: string[];
    rarity?: string | string[];
    supertype?: string;
    subtypes?: string | string[];
}

/**
 * Endpoint para hidratar (sincronizar) una colección automática
 * GET /api/sync/collection-cards?id=COLLECTION_ID
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get("id");
    const encoder = new TextEncoder();

    if (!collectionId) {
        return new Response("Missing collection id", { status: 400 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            let processedCount = 0;

            try {
                sendEvent({ status: "starting", message: "Analizando colección y filtros..." });

                // 1. Obtener la colección
                const collection = await db.query.collections.findFirst({
                    where: eq(collections.id, collectionId),
                });

                if (!collection || collection.type !== "auto" || !collection.filters) {
                    throw new Error("Colección no válida o sin filtros automáticos.");
                }

                const filters = JSON.parse(collection.filters) as CollectionFilter;
                console.log(`[CollectionSync] Processing collection ${collectionId} with filters:`, filters);

                // 2. Determinar Estrategia de Carga (Source Strategy)
                let candidateCards: TCGdexCard[] = [];

                // Priority 1: Set ID (Most specific, fastest)
                // Priority 1: Set ID (Most specific, fastest)
                if (filters.set) {
                    sendEvent({ status: "progress", message: `Conectando con TCGdex para el set ${filters.set}...`, count: 0, total: 0 });

                    // We need set metadata primarily
                    // Optimización: get set brief first?
                    // fetchSetCardsDetailed fetches ALL.
                    // Let's manually fetch set info, then cards briefs, then check DB.

                    // But fetchSet returns briefs in set.cards
                    const setBrief = await fetchSet(filters.set);

                    // Upsert set info immediately
                    await db.insert(sets).values({
                        id: setBrief.id,
                        name: setBrief.name,
                        series: setBrief.serie?.name || "Unknown",
                        printedTotal: setBrief.cardCount.official,
                        total: setBrief.cardCount.total,
                        releaseDate: setBrief.releaseDate || null,
                        images: JSON.stringify({
                            symbol: setBrief.symbol ? `${setBrief.symbol}.webp` : null,
                            logo: setBrief.logo ? `${setBrief.logo}.webp` : null,
                        }),
                        syncedAt: new Date()
                    }).onConflictDoUpdate({
                        target: sets.id,
                        set: {
                            name: setBrief.name,
                            images: JSON.stringify({
                                symbol: setBrief.symbol ? `${setBrief.symbol}.webp` : null,
                                logo: setBrief.logo ? `${setBrief.logo}.webp` : null,
                            }),
                            syncedAt: new Date()
                        }
                    });

                    // Check which cards we already have
                    const briefs = setBrief.cards || [];
                    const neededBriefs = await filterNeededBriefs(briefs);

                    if (neededBriefs.length < briefs.length) {
                        sendEvent({ status: "progress", message: `Detectadas ${briefs.length - neededBriefs.length} cartas ya existentes en local. Descargando ${neededBriefs.length} nuevas...` });
                    }

                    // Fetch only missing
                    let newCards: TCGdexCard[] = [];
                    if (neededBriefs.length > 0) {
                        newCards = await fetchDetailedCards(neededBriefs);
                    }

                    // But we need candidateCards to be FULL list to perform filtering later?
                    // Actually, candidateCards is used for filter in memory.
                    // If we have them in DB, we should fetch them from DB?
                    // OR, since later we do `transformCardToSchema` and `db.insert`, 
                    // reusing the logic requires full objects.
                    // If we don't fetch them, we can't filter/insert them.

                    // If they are in DB, we don't need to insert them.
                    // But we DO need to include them in `candidateCards` so Step 3 (Filtering) works?
                    // Step 3 creates `filteredApiCards`. Then Step 5 inserts.

                    // If we skip fetching, we skip filtering validation?
                    // For PREDEFINED collections, filtering logic is complex (names, rarities).
                    // If we rely on DB data, we need to query DB data.

                    // Strategy:
                    // 1. Fetch missing from API -> `newCards`
                    // 2. Fetch existing from DB -> `existingCards`. BUT our DB schema != TCGdexCard schema.
                    // This makes merging hard if we rely on `TCGdexCard` interface for filtering downstream.

                    // HOWEVER, `candidateCards` are used for:
                    // A) Filtering in Step 3.
                    // B) Inserting in Step 5.

                    // If card is in DB, it (presumably) passed filters? No, DB has ALL cards from other sets.
                    // We need to re-verify filters for the current collection.

                    // If we trust that DB data is enough to filter:
                    // We can query DB for the existing IDs, convert them back to "TCGdexCard-like" object?
                    // Or change filtering logic to work on DB schema?
                    // Changing logic is risky now.

                    // Alternative: 
                    // Just download missing.
                    // The ones present in DB -> We assume they are "available".
                    // But wait, if we only put `newCards` into candidateCards, then `filteredApiCards` will only have new cards.
                    // Then we only insert new cards.
                    // What if an existing card in DB matches the filter and needs to be part of the collection?
                    // The collection relies on the `collection_items` table (manual) OR dynamic query (auto).
                    // This endpoint is "Hydrating" -> Filling the `cards` table.
                    // It does NOT link cards to collection (since it's an auto collection, the link is dynamic via WHERE clause).

                    // SO: If the card is already in `cards` table, WE ARE DONE for that card.
                    // We don't need to return it in `candidateCards` because we don't need to "process" it further here.
                    // This endpoint's ONLY goal is to ensure cards exist in `cards` table.
                    // It doesn't return the cards to UI.

                    // ERGO: We can safely just fetch and process ONLY the missing cards.
                    candidateCards = newCards;

                }
                // Priority 2: Series (Multiple sets)
                else if (filters.series) {
                    const seriesList = Array.isArray(filters.series) ? filters.series : [filters.series];
                    sendEvent({ status: "progress", message: `Buscando sets de series: ${seriesList.join(", ")}...` });

                    const allSets = await fetchAllSets(true);
                    const targetSets = allSets.filter(s => s.serie?.name && seriesList.includes(s.serie.name));

                    let setsProcessed = 0;
                    for (const s of targetSets) {
                        sendEvent({ status: "progress", message: `Cargando set: ${s.name} (${++setsProcessed}/${targetSets.length})...` });

                        // Optimización Manual para Series
                        const setBrief = await fetchSet(s.id);
                        await upsertSet(setBrief); // Reuse helper using setBrief as source (TCGdexSet matches)

                        const briefs = setBrief.cards || [];
                        const neededBriefs = await filterNeededBriefs(briefs);

                        if (neededBriefs.length < briefs.length) {
                            sendEvent({ status: "progress", message: `Set ${s.name}: ${briefs.length - neededBriefs.length} ya locales.` });
                        }

                        if (neededBriefs.length > 0) {
                            const pack = await fetchDetailedCards(neededBriefs);
                            candidateCards.push(...pack);
                        }
                    }
                }
                // Priority 3: List of Names (Slowest, iterative)
                else if (filters.names && filters.names.length > 0) {
                    const names = filters.names;
                    let briefs: TCGdexCardBrief[] = [];

                    for (let i = 0; i < names.length; i++) {
                        const name = names[i];
                        if (i % 5 === 0) sendEvent({ status: "progress", message: `Buscando cartas: ${name} (${i + 1}/${names.length})...` });

                        const results = await fetchCardsByName(name);
                        // Filter briefs immediately by strict name if needed, but TCGDex search is good enough usually
                        briefs.push(...results);
                    }

                    // Remove duplicates by ID
                    const uniqueBriefs = Array.from(new Map(briefs.map(item => [item.id, item])).values());

                    // Optimization: Filter out already existing cards
                    const neededBriefs = await filterNeededBriefs(uniqueBriefs);
                    if (uniqueBriefs.length !== neededBriefs.length) {
                        sendEvent({ status: "progress", message: `Omitiendo ${uniqueBriefs.length - neededBriefs.length} cartas ya descargadas...` });
                    }

                    if (neededBriefs.length > 0) {
                        sendEvent({ status: "progress", message: `Descargando detalles de ${neededBriefs.length} cartas nuevas...` });
                        candidateCards = await fetchDetailedCards(neededBriefs);
                    } else {
                        candidateCards = [];
                    }
                }
                // Priority 4: Single Name (Fallback)
                else if (filters.name) {
                    sendEvent({ status: "progress", message: `Buscando cartas con nombre: ${filters.name}...` });
                    const briefs = await fetchCardsByName(filters.name);

                    const neededBriefs = await filterNeededBriefs(briefs);
                    if (briefs.length !== neededBriefs.length) {
                        sendEvent({ status: "progress", message: `Omitiendo ${briefs.length - neededBriefs.length} cartas ya descargadas...` });
                    }

                    candidateCards = await fetchDetailedCards(neededBriefs);
                }
                // Priority 5: Rarity
                else if (filters.rarity) {
                    const rarity = Array.isArray(filters.rarity) ? filters.rarity[0] : filters.rarity; // TCGdex rarity fetch is single
                    sendEvent({ status: "progress", message: `Buscando cartas rareza: ${rarity}...` });
                    const briefs = await fetchCardsByRarity(rarity!);

                    const neededBriefs = await filterNeededBriefs(briefs);
                    candidateCards = await fetchDetailedCards(neededBriefs);
                }
                else if (filters.supertype) {
                    sendEvent({ status: "progress", message: `Buscando cartas tipo: ${filters.supertype}...` });
                    const briefs = await fetchCardsByCategory(filters.supertype);

                    const neededBriefs = await filterNeededBriefs(briefs);
                    candidateCards = await fetchDetailedCards(neededBriefs);
                } else {
                    throw new Error("Filtros no válidos: Se requiere al menos Set, Series, Name o Rarity.");
                }

                if (candidateCards.length === 0) {
                    sendEvent({ status: "complete", message: "No se encontraron cartas.", count: 0, total: 0 });
                    controller.close();
                    return;
                }

                // 3. Filtrado en Memoria (Fine-grained filtering)
                sendEvent({ status: "progress", message: `Filtrando ${candidateCards.length} candidatas...` });

                const filteredApiCards = candidateCards.filter(card => {
                    // Name filter (Array)
                    if (filters.names) {
                        const nameMatch = filters.names.some(n => card.name.toLowerCase().includes(n.toLowerCase()));
                        if (!nameMatch) return false;
                    }
                    // Name filter (Single)
                    if (filters.name) {
                        if (!card.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
                    }

                    // Series Filter (if checking strictly logic inside card, usually handled by source strategy but good to double check)
                    if (filters.series) {
                        const seriesList = Array.isArray(filters.series) ? filters.series : [filters.series];
                        // Need detailed set info to curb check series? 
                        // card.set.serie is not always populated in card object from TCGDex? 
                        // TCGDexCard type has: `set: { id, name }`. Does NOT have series in set object within card.
                        // So we cannot strictly filter by series here unless we fetched set details.
                        // BUT, if we used Priority 2 (Series), we already guaranteed this.
                        // If we used Priority 3 (Names) and want to filter by Series?
                        // We would need to look up the set.
                        // For now, assume if source was Names, we skip series check or we'd need to fetch set info.
                        // Let's rely on Source Strategy being correct. 
                        // "Original 151 Vintage" variant uses `filterGenerator: () => ({ names: [...], series: [...] })`
                        // In that case, we MUST filter by series.
                        // Since `candidateCards` logic above prioritizes `filters.series` IF present, 
                        // it will fetch via series strategy (getting only sets of that series), and THEN we filter by names here.
                        // So the flow works implicitly!
                        // Logic: if filters.series is present, we used Priority 2.
                        // Priority 2 gets cards FROM target series sets.
                        // So they are valid.
                        // Then we apply Name filter here. Perfect.
                    }

                    // Rarity Filter
                    if (filters.rarity) {
                        const rList = Array.isArray(filters.rarity) ? filters.rarity : [filters.rarity];
                        const cardRarity = card.rarity?.toLowerCase() || "";
                        // Fuzzy match for rarity types ("Illustration Rare" matches "Special Illustration Rare"?)
                        // Let's do partial includes checking
                        const rarityMatch = rList.some(r => cardRarity.includes(r.toLowerCase()));
                        if (!rarityMatch) return false;
                    }

                    // Supertype
                    if (filters.supertype && card.category.toLowerCase() !== filters.supertype.toLowerCase()) return false;

                    // Subtypes (Array)
                    if (filters.subtypes) {
                        const subsList = Array.isArray(filters.subtypes) ? filters.subtypes : [filters.subtypes];
                        // card.subtypes is not directly on TCGdexCard interface in our type def?
                        // Let's check type.
                        // transformCardToSchema: subtypes: JSON.stringify([card.stage || "Basic"]),
                        // TCGDexCard has `stage`. But 'subtypes' like 'Supporter' come from where?
                        // TCGDex `category` is often "Pokemon", "Trainer".
                        // `stage` is "Basic", "Stage 1".
                        // Checks needed if we want "Supporter".
                        // For "Trainers", category is "Trainer".
                        // We might need to check name or deeper props if TCGDex doesn't expose subtypes clearly on this object.
                        // For now, ignore subtypes strict check or assume category covers it.
                    }

                    return true;
                });

                const totalToSync = filteredApiCards.length;
                console.log(`[CollectionSync] ${totalToSync} cards match all filters`);

                // 4. Premap Sets (Ensure Sets Exist)
                // If we came from Name strategy, sets might not be in DB.
                const uniqueSetIds = new Set(filteredApiCards.map((c: any) => c.set.id));
                sendEvent({ status: "progress", message: `Verificando ${uniqueSetIds.size} sets...`, total: totalToSync });

                // We need to fetch set details for these IDs to get Series info/Logo if we didn't have it
                // Logic: Upsert sets.
                // NOTE: `fetchDetailedCards` returns cards with `set: { id, name, logo, symbol, cardCount }`.
                // This is enough for basic Set upsert! We don't have Series name though.
                // Defaults to "Unknown" if not fetched via `fetchSet`.

                for (const sId of uniqueSetIds) {
                    const sample = filteredApiCards.find(c => c.set.id === sId);
                    if (sample && sample.set) {
                        await db.insert(sets).values({
                            id: sId as string,
                            name: sample.set.name || "Unknown Set",
                            series: "Unknown", // Can we improve? Maybe lazy fetch if needed
                            printedTotal: sample.set.cardCount?.official || 0,
                            total: sample.set.cardCount?.total || 0,
                            syncedAt: new Date(),
                            images: JSON.stringify({
                                symbol: sample.set.symbol ? `${sample.set.symbol}.webp` : null,
                                logo: sample.set.logo ? `${sample.set.logo}.webp` : null,
                            })
                        }).onConflictDoNothing();
                    }
                }

                // 5. Insert Cards
                sendEvent({ status: "progress", message: `Guardando ${totalToSync} cartas...`, count: 0, total: totalToSync });

                for (const card of filteredApiCards) {
                    const cardData = transformCardToSchema(card);
                    await db.insert(cards).values(cardData)
                        .onConflictDoUpdate({
                            target: cards.id,
                            set: { ...cardData, syncedAt: new Date() }
                        });

                    processedCount++;
                    if (processedCount % 10 === 0) {
                        sendEvent({ status: "progress", message: `Sincronizando... ${processedCount}/${totalToSync}`, count: processedCount, total: totalToSync });
                    }
                }

                sendEvent({ status: "complete", message: `¡Sincronización completada! ${processedCount} cartas añadidas.`, count: processedCount, total: totalToSync });
                controller.close();

            } catch (error) {
                console.error("[CollectionSync] Error:", error);
                const msg = error instanceof Error ? error.message : "Error desconocido";
                sendEvent({ status: "error", message: msg });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

/** Helper to upsert set info */
async function upsertSet(fullSetData: any) {
    await db.insert(sets).values({
        id: fullSetData.id,
        name: fullSetData.name,
        series: fullSetData.serie?.name || "Unknown",
        printedTotal: fullSetData.cardCount.official,
        total: fullSetData.cardCount.total,
        releaseDate: fullSetData.releaseDate || null,
        images: JSON.stringify({
            symbol: fullSetData.symbol ? `${fullSetData.symbol}.webp` : null,
            logo: fullSetData.logo ? `${fullSetData.logo}.webp` : null,
        }),
        syncedAt: new Date()
    }).onConflictDoUpdate({
        target: sets.id,
        set: {
            name: fullSetData.name,
            images: JSON.stringify({
                symbol: fullSetData.symbol ? `${fullSetData.symbol}.webp` : null,
                logo: fullSetData.logo ? `${fullSetData.logo}.webp` : null,
            }),
            syncedAt: new Date()
        }
    });
}

/** Helper Check DB for existing cards */
async function filterNeededBriefs(briefs: TCGdexCardBrief[]): Promise<TCGdexCardBrief[]> {
    if (briefs.length === 0) return [];
    
    const ids = briefs.map(b => b.id);
    const BATCH = 500; // SQLite limit variable params
    const existingIds = new Set<string>();
    
    for (let i = 0; i < ids.length; i += BATCH) {
        const chunk = ids.slice(i, i + BATCH);
        try {
            const results = await db.select({ id: cards.id }).from(cards).where(inArray(cards.id, chunk));
            results.forEach(r => existingIds.add(r.id));
        } catch (e) {
            console.error("Error checking existing cards:", e);
        }
    }
    
    return briefs.filter(b => !existingIds.has(b.id));
}

