import { db } from "@/db";
import { cards, collectionItems, collections, sets } from "@/db/schema";
import { sql, desc, eq, count, countDistinct } from "drizzle-orm";
import HomePageClient from "@/components/HomePageClient";
import { calculateTotalValue, Variant } from "@/lib/prices";

// Estadísticas globales del usuario
async function getGlobalStats() {
  try {
    const [cardStats] = await db.select({
      totalCards: count(cards.id),
      totalSets: countDistinct(cards.setId)
    }).from(cards);

    const [collectionStats] = await db.select({
      totalCollections: count(collections.id),
      totalOwnedCards: countDistinct(collectionItems.cardId),
      // Estimate total value only for cards where we have a price
      // Note: precise calculation would require iterating or more complex SQL if storing prices as JSON
    }).from(collections).leftJoin(collectionItems, sql`${collections.id} = ${collectionItems.collectionId} `);

    // Calculate total value by fetching all items with their card prices
    // This might be heavy for huge collections, but fine for personal use
    const allItems = await db.select({
      quantity: collectionItems.quantity,
      tcgplayerPrices: cards.tcgplayerPrices,
      cardmarketPrices: cards.cardmarketPrices,
      variant: collectionItems.variant
    }).from(collectionItems)
      .innerJoin(cards, eq(collectionItems.cardId, cards.id));

    const totalValue = calculateTotalValue(
      allItems.map(item => ({
        ...item,
        quantity: item.quantity || 1,
        variant: (item.variant || 'normal') as Variant
      })),
      'EUR' // Default currency for now
    );

    // Recent Acquisitions
    const recentCards = await db.select({
      id: cards.id,
      name: cards.name,
      images: cards.images,
      rarity: cards.rarity,
      set: sets.name,
      addedAt: collectionItems.addedAt
    })
      .from(collectionItems)
      .innerJoin(cards, eq(collectionItems.cardId, cards.id))
      .innerJoin(sets, eq(cards.setId, sets.id))
      .orderBy(desc(collectionItems.addedAt))
      .limit(5);

    return {
      totalCards: cardStats?.totalCards || 0,
      totalSets: cardStats?.totalSets || 0,
      totalCollections: collectionStats?.totalCollections || 0,
      totalOwnedCards: collectionStats?.totalOwnedCards || 0,
      totalValue,
      recentCards
    };
  } catch {
    return {
      totalCards: 0,
      totalSets: 0,
      totalCollections: 0,
      totalOwnedCards: 0,
      totalValue: 0,
      recentCards: []
    };
  }
}

export default async function HomePage() {
  const stats = await getGlobalStats();

  return <HomePageClient stats={stats} />;
}
