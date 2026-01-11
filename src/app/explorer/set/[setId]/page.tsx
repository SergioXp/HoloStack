import Link from "next/link";
import { db } from "@/db";
import { sets, cards } from "@/db/schema";
import { eq } from "drizzle-orm";
import SetCardsClientPage from "@/components/SetCardsClientPage";

interface PageProps {
    params: Promise<{ setId: string }>;
}

// Obtener información del set desde DB
async function getSet(setId: string) {
    return await db.select().from(sets).where(eq(sets.id, setId)).get();
}

// Obtener cartas del set
async function getCardsBySet(setId: string) {
    // Primero intentar desde la DB
    const dbCards = await db.select().from(cards).where(eq(cards.setId, setId));

    if (dbCards.length > 0) {
        return dbCards;
    }

    // Si no hay cartas en DB, obtener de TCGdex
    try {
        const response = await fetch(
            `https://api.tcgdex.net/v2/en/sets/${setId}`,
            { next: { revalidate: 3600 } }
        );

        if (!response.ok) {
            return [];
        }

        const set = await response.json();

        if (!set.cards || set.cards.length === 0) {
            return [];
        }

        // Mapear cartas del set (datos básicos)
        return set.cards.map((card: any) => ({
            id: card.id,
            name: card.name,
            number: card.localId,
            rarity: null,
            supertype: "Pokémon",
            subtypes: JSON.stringify([]),
            types: JSON.stringify([]),
            hp: null,
            artist: null,
            evolvesFrom: null, // Basic set info doesn't have this, requires full fetch which we don't do here on fallback
            tcgplayerPrices: null,
            cardmarketPrices: null,
            images: JSON.stringify({
                small: card.image ? `${card.image}/low.webp` : null,
                large: card.image ? `${card.image}/high.webp` : null,
            }),
        }));
    } catch {
        return [];
    }
}

export default async function SetCardsPage({ params }: PageProps) {
    const { setId } = await params;

    // Fetch en paralelo
    const [set, cardsData] = await Promise.all([
        getSet(setId),
        getCardsBySet(setId),
    ]);

    if (!set) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 mb-4">Set no encontrado</p>
                    <Link href="/explorer" className="text-blue-400 hover:text-blue-300">
                        Volver al explorador
                    </Link>
                </div>
            </div>
        );
    }

    return <SetCardsClientPage setKeywords={set} cards={cardsData} />;
}
