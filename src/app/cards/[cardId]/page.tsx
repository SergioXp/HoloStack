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
    const tcgplayerPrices = card.tcgplayerPrices as any;
    const cardmarketPrices = card.cardmarketPrices as any;

    // Precio actual (Prioridad: Cardmarket > TCGPlayer)
    const getCurrentPrice = () => {
        // 1. Cardmarket
        if (cardmarketPrices) {
            const price = cardmarketPrices.avg30 || cardmarketPrices.trendPrice || cardmarketPrices.averageSellPrice;
            if (price) {
                return { variant: "Cardmarket", price: Number(price) };
            }
        }

        // 2. TCGPlayer
        if (tcgplayerPrices) {
            const variants = Object.entries(tcgplayerPrices);
            for (const [variant, prices] of variants) {
                if ((prices as any).market) {
                    return { variant, price: (prices as any).market };
                }
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

    // Fallback: Si no hay historial en DB, intentar construirlo desde Cardmarket
    if (formattedPriceHistory.length === 0 && cardmarketPrices) {
        const today = new Date();
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        if (cardmarketPrices.avg30) {
            const d = new Date(today); d.setDate(d.getDate() - 30);
            formattedPriceHistory.push({ date: formatDate(d), marketPrice: Number(cardmarketPrices.avg30), source: 'Cardmarket (Avg30)' });
        }
        if (cardmarketPrices.avg7) {
            const d = new Date(today); d.setDate(d.getDate() - 7);
            formattedPriceHistory.push({ date: formatDate(d), marketPrice: Number(cardmarketPrices.avg7), source: 'Cardmarket (Avg7)' });
        }
        if (cardmarketPrices.avg1) {
            const d = new Date(today); d.setDate(d.getDate() - 1);
            formattedPriceHistory.push({ date: formatDate(d), marketPrice: Number(cardmarketPrices.avg1), source: 'Cardmarket (Avg1)' });
        }

        // Añadir precio actual si existe y viene de Cardmarket
        if (currentPrice && currentPrice.variant === 'Cardmarket') {
            formattedPriceHistory.push({ date: formatDate(today), marketPrice: currentPrice.price, source: 'Cardmarket (Current)' });
        }

        formattedPriceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return (
        <CardDetailClientPage
            card={card}
            set={set ? { name: set.name, printedTotal: set.printedTotal } : null}
            currentPrice={currentPrice}
            priceHistoryData={formattedPriceHistory}
        />
    );
}
