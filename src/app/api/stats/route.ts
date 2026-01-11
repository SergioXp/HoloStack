import { db } from "@/db";
import { collectionItems, cards, sets } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Obtener todos los items con sus precios
        const allItems = await db
            .select({
                variant: collectionItems.variant,
                quantity: collectionItems.quantity,
                cardName: cards.name,
                rarity: cards.rarity,
                setSeries: sets.series,
                prices: cards.tcgplayerPrices, // JSON string
                images: cards.images, // JSON string
            })
            .from(collectionItems)
            .leftJoin(cards, eq(collectionItems.cardId, cards.id))
            .leftJoin(sets, eq(cards.setId, sets.id));

        let totalValue = 0;
        let totalCards = 0;
        const rarityMap = new Map<string, number>();
        const seriesMap = new Map<string, number>();
        const valuableCards: any[] = [];

        for (const item of allItems) {
            if (!item.cardName) continue; // Skip orphan items

            const qty = item.quantity || 1;
            totalCards += qty;

            // Calcular valor
            let price = 0;
            if (item.prices) {
                try {
                    const priceData = JSON.parse(item.prices);
                    // Intentar obtener precio según variante
                    if (item.variant === "holofoil" && priceData.holofoil) {
                        price = priceData.holofoil.market || priceData.holofoil.mid || 0;
                    } else if (item.variant === "reverseHolofoil" && priceData.reverseHolofoil) {
                        price = priceData.reverseHolofoil.market || priceData.reverseHolofoil.mid || 0;
                    } else {
                        // Normal u otros
                        price = priceData.normal?.market || priceData.normal?.mid || 0;
                    }
                } catch (e) { }
            }

            const itemTotalValue = price * qty;
            totalValue += itemTotalValue;

            if (price > 0) {
                valuableCards.push({
                    name: item.cardName,
                    rarity: item.rarity,
                    value: price,
                    image: item.images ? JSON.parse(item.images).small : null
                });
            }

            // Agregaciones
            const rarity = item.rarity || "Unknown";
            rarityMap.set(rarity, (rarityMap.get(rarity) || 0) + qty);

            const series = item.setSeries || "Other";
            seriesMap.set(series, (seriesMap.get(series) || 0) + qty);
        }

        // Formatear datos para gráficos
        const rarityData = Array.from(rarityMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const seriesData = Array.from(seriesMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Top 5 cartas
        valuableCards.sort((a, b) => b.value - a.value);
        const topCards = valuableCards.slice(0, 5);

        return Response.json({
            totalValue,
            totalCards,
            rarityData,
            seriesData,
            topCards
        });

    } catch (error) {
        console.error("Error fetching stats:", error);
        return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
