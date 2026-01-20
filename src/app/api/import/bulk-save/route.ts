import { NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems, expenses, cards } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CardmarketItem } from "@/lib/import/cardmarket-parser";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, collectionId, budgetId, variant } = body as {
            items: CardmarketItem[],
            collectionId?: string,
            budgetId?: string,
            variant?: string
        };

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No items provided" }, { status: 400 });
        }

        const results = {
            addedToCollection: 0,
            expensesCreated: 0,
            errors: [] as string[]
        };

        // 1. Process Items (Collection & Budget)
        for (const item of items) {
            const targetCollectionId = item.collectionId || collectionId;
            const targetBudgetId = item.budgetId || budgetId;

            // Add into Collection
            if (targetCollectionId && item.cardId) {
                try {
                    // 1. Fetch Request Card to Validate Variant
                    const card = await db.query.cards.findFirst({
                        where: eq(cards.id, item.cardId),
                        columns: {
                            id: true,
                            rarity: true,
                            tcgplayerPrices: true
                        }
                    });

                    let finalVariant = item.variant || variant || "normal";

                    if (card && card.tcgplayerPrices) {
                        try {
                            const prices = typeof card.tcgplayerPrices === 'string'
                                ? JSON.parse(card.tcgplayerPrices)
                                : card.tcgplayerPrices;

                            const validVariants = Object.keys(prices);

                            // Map UI variants to TCGPlayer keys if needed
                            // UI: 'normal', 'holo', 'reverse holo', 'first edition'
                            // TCGPlayer keys usually: 'normal', 'holofoil', 'reverseHolofoil', '1stEditionHolofoil', '1stEditionNormal'

                            const variantMap: Record<string, string> = {
                                "normal": "normal",
                                "holo": "holofoil",
                                "reverse holo": "reverseHolofoil",
                                "first edition": "1stEditionHolofoil" // or 1stEditionNormal, tricky but acceptable default
                            };

                            const targetKey = variantMap[finalVariant] || finalVariant;

                            // Check if exact match exists
                            if (!validVariants.includes(targetKey)) {
                                // Variant INVALID for this card. Auto-correct.
                                if (validVariants.length > 0) {
                                    // Priority: Normal > Holofoil > ReverseHolofoil > Whatever is first
                                    if (validVariants.includes("normal")) finalVariant = "normal";
                                    else if (validVariants.includes("holofoil")) finalVariant = "holofoil";
                                    else if (validVariants.includes("reverseHolofoil")) finalVariant = "reverseHolofoil";
                                    else {
                                        // Fallback to first available
                                        const first = validVariants[0];
                                        finalVariant = first; // Use exact key from price data
                                    }
                                } else if (card.rarity) {
                                    // No price data but we have Rarity. Use heuristics.
                                    const r = card.rarity.toLowerCase();
                                    const isHighRarity = r.includes("double") || r.includes("ultra") || r.includes("secret") ||
                                        r.includes("illustration") || r.includes("full art") || r.includes("v") || r.includes("ex") || r.includes("gx");

                                    if (isHighRarity) {
                                        finalVariant = "holofoil"; // High rarity is almost always holo - use schema key
                                    }
                                    // Else keep original request (likely 'normal' or 'reverse') as we can't disprove it
                                }
                            }
                        } catch (e) {
                            console.warn("Error parsing prices for variant validtion", e);
                        }
                    }

                    await db.insert(collectionItems).values({
                        collectionId: targetCollectionId,
                        cardId: item.cardId,
                        quantity: item.quantity,
                        variant: finalVariant,
                        addedAt: new Date(),
                        notes: `Imported from Cardmarket - ${item.condition} - ${item.language}${item.userNotes ? ` - Notes: ${item.userNotes}` : ''}`
                    });
                    results.addedToCollection++;
                } catch (e: any) {
                    console.error("Error adding to collection", e);
                    results.errors.push(`Failed to add ${item.name}: ${e.message}`);
                }
            }

            // Create Expense
            if (targetBudgetId && item.price > 0) {
                try {
                    await db.insert(expenses).values({
                        budgetId: targetBudgetId,
                        date: item.orderDate || new Date().toISOString().split('T')[0],
                        description: item.isShipping
                            ? `Envío Cardmarket${item.seller ? ` (${item.seller})` : ''} - ${item.price.toFixed(2)}€`
                            : `${item.name} (${item.setName})${item.seller ? ` - ${item.seller}` : ''} - ${item.price.toFixed(2)}€`,
                        category: item.isShipping ? "other" : "single_card",
                        amount: item.price,
                        currency: "EUR",
                        notes: item.originalText,
                        cardId: item.cardId || null,
                        seller: item.seller || null,
                        platform: "cardmarket"
                    });
                    results.expensesCreated++;
                } catch (e: any) {
                    console.error("Error creating expense", e);
                    results.errors.push(`Failed to expense ${item.name}: ${e.message}`);
                }
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Bulk save error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
