import { db } from "@/db";
import { collectionItems, cards, sets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBestPrice, type Variant } from "@/lib/prices";

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
                tcgplayerPrices: cards.tcgplayerPrices,
                cardmarketPrices: cards.cardmarketPrices,
                images: cards.images,
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

            // Calcular valor usando el módulo de precios centralizado
            const priceInfo = getBestPrice(
                item.tcgplayerPrices,
                item.cardmarketPrices,
                (item.variant || "normal") as Variant,
                "EUR" // Usar EUR por defecto para stats
            );

            const price = priceInfo?.price || 0;
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
            uniqueSeries: seriesMap.size,
            rarityData,
            seriesData,
            topCards
        });

    } catch (error) {
        console.error("Error fetching stats:", error);
        return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
