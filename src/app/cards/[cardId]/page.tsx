import { db } from "@/db";
import { cards, sets, priceHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import CardDetailClientPage from "@/components/CardDetailClientPage";

interface CardDetailPageProps {
    params: Promise<{ cardId: string }>;
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
    const { cardId } = await params;

    // Obtener datos de la carta
    const card = await db.query.cards.findFirst({
        where: eq(cards.id, cardId),
    });

    if (!card) {
        notFound();
    }

    // Obtener datos del set
    const set = await db.query.sets.findFirst({
        where: eq(sets.id, card.setId),
    });

    // Obtener historial de precios (últimos 90 días)
    const priceHistoryData = await db.select()
        .from(priceHistory)
        .where(eq(priceHistory.cardId, cardId))
        .orderBy(desc(priceHistory.date))
        .limit(90);

    // Parsear datos JSON de la carta para el precio actual
    const tcgplayerPrices = card.tcgplayerPrices ? JSON.parse(card.tcgplayerPrices) : null;

    // Precio actual (del JSON de la carta)
    const getCurrentPrice = () => {
        if (!tcgplayerPrices) return null;
        const variants = Object.entries(tcgplayerPrices);
        for (const [variant, prices] of variants) {
            if ((prices as any).market) {
                return { variant, price: (prices as any).market };
            }
        }
        return null;
    };
    const currentPrice = getCurrentPrice();

    // Formatear historial para serialización
    const formattedPriceHistory = priceHistoryData.map(h => ({
        date: h.date,
        marketPrice: h.marketPrice,
        source: h.source
    }));

    return (
        <CardDetailClientPage
            card={card}
            set={set ? { name: set.name, printedTotal: set.printedTotal } : null}
            currentPrice={currentPrice}
            priceHistoryData={formattedPriceHistory}
        />
    );
}
