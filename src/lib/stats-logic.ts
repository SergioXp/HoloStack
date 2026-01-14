
import { getBestPrice, type Variant } from "@/lib/prices";

export interface StatItem {
    cardId: string;
    cardNumber: string;
    setId: string;
    setName: string | null;
    variant: string | null;
    quantity: number | null;
    cardName: string | null;
    rarity: string | null;
    setSeries: string | null;
    tcgplayerPrices: any; // Raw JSON from DB
    cardmarketPrices: any; // Raw JSON from DB
    images: string | null; // JSON string
}

export interface StatsResult {
    totalValue: number;
    totalCards: number;
    uniqueSeries: number;
    rarityData: { name: string; value: number }[];
    seriesData: { name: string; value: number }[];
    topCards: any[];
}

/**
 * Pure function to calculate statistics from a list of collected items.
 */
export function calculateStats(allItems: StatItem[]): StatsResult {
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
        const source = priceInfo?.source || null;
        const itemTotalValue = price * qty;
        totalValue += itemTotalValue;

        if (price > 0) {
            valuableCards.push({
                id: item.cardId,
                name: item.cardName,
                number: item.cardNumber,
                setId: item.setId,
                setName: item.setName,
                rarity: item.rarity,
                value: price,
                source: source,
                image: item.images ? JSON.parse(item.images).small : null,
                tcgplayerPrices: item.tcgplayerPrices,
                cardmarketPrices: item.cardmarketPrices,
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

    return {
        totalValue,
        totalCards,
        uniqueSeries: seriesMap.size,
        rarityData,
        seriesData,
        topCards
    };
}
