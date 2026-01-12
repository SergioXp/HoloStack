import { NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems, cards, sets } from "@/db/schema";
import { eq, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Primero obtener todos los items de colección con cantidad > 0
        const allItems = await db.query.collectionItems.findMany({
            where: gt(collectionItems.quantity, 0),
        });

        if (!allItems || allItems.length === 0) {
            return NextResponse.json([]);
        }

        // Obtener los IDs de cartas únicos
        const cardIds = [...new Set(allItems.map(i => i.cardId))];

        // Obtener la información de las cartas
        const cardsData = await db.query.cards.findMany({
            where: (cards, { inArray }) => inArray(cards.id, cardIds),
        });

        const cardsMap = new Map(cardsData.map(c => [c.id, c]));

        // Obtener los nombres de sets
        const setIds = [...new Set(cardsData.map(c => c.setId).filter(Boolean))];
        const setsData = setIds.length > 0
            ? await db.query.sets.findMany({
                where: (sets, { inArray }) => inArray(sets.id, setIds as string[]),
            })
            : [];

        const setNames = new Map(setsData.map(s => [s.id, s.name]));

        // Verificar qué cartas tienen precios obsoletos (>24h)
        const MAX_AGE_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const staleCardIds: string[] = [];

        const isPriceStale = (syncedAt: Date | null): boolean => {
            if (!syncedAt) return true;
            return now - syncedAt.getTime() > MAX_AGE_MS;
        };

        // Formatear respuesta
        const portfolio = allItems.map(item => {
            const card = cardsMap.get(item.cardId);
            if (!card) return null;

            // Verificar si el precio está obsoleto
            if (isPriceStale(card.syncedAt)) {
                staleCardIds.push(card.id);
            }

            return {
                cardId: card.id,
                cardName: card.name,
                cardNumber: card.number,
                cardImages: card.images,
                cardRarity: card.rarity || "Unknown",
                setId: card.setId,
                setName: setNames.get(card.setId || "") || card.setId || "Unknown",
                variant: item.variant,
                quantity: item.quantity || 0,
                tcgplayerPrices: card.tcgplayerPrices,
                cardmarketPrices: card.cardmarketPrices,
            };
        }).filter(Boolean);

        // Devolver también los IDs de cartas con precios obsoletos
        return NextResponse.json({
            items: portfolio,
            staleCardIds: [...new Set(staleCardIds)], // Únicos
        });
    } catch (error) {
        console.error("Error fetching portfolio:", error);
        return NextResponse.json({ error: "Error fetching portfolio" }, { status: 500 });
    }
}
