import { db } from "@/db";
import { collections, collectionItems, cards } from "@/db/schema";
import { sql, count, countDistinct } from "drizzle-orm";
import HomePageClient from "@/components/HomePageClient";

// Estadísticas globales del usuario
async function getGlobalStats() {
  try {
    const [cardStats] = await db.select({
      totalCards: count(cards.id),
      totalSets: countDistinct(cards.setId)
    }).from(cards);

    const [collectionStats] = await db.select({
      totalCollections: count(collections.id),
      totalOwnedCards: countDistinct(collectionItems.cardId)
    }).from(collections).leftJoin(collectionItems, sql`${collections.id} = ${collectionItems.collectionId}`);

    return {
      totalCards: cardStats?.totalCards || 0,
      totalSets: cardStats?.totalSets || 0,
      totalCollections: collectionStats?.totalCollections || 0,
      totalOwnedCards: collectionStats?.totalOwnedCards || 0
    };
  } catch {
    return { totalCards: 0, totalSets: 0, totalCollections: 0, totalOwnedCards: 0 };
  }
}

export default async function HomePage() {
  const stats = await getGlobalStats();

  return <HomePageClient stats={stats} />;
}
