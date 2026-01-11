import { db } from "@/db";
import { sets, cards } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import SeriesDetailClient from "@/components/SeriesDetailClient";

interface PageProps {
    params: Promise<{ seriesName: string }>;
}

export default async function SeriesPage({ params }: PageProps) {
    const { seriesName } = await params;
    const decodedSeriesName = decodeURIComponent(seriesName);

    const seriesSets = await db.select().from(sets)
        .where(eq(sets.series, decodedSeriesName));

    seriesSets.sort((a, b) => {
        const dateA = a.releaseDate || "1999-01-01";
        const dateB = b.releaseDate || "1999-01-01";
        return dateB.localeCompare(dateA);
    });

    const counts = await db.select({
        setId: cards.setId,
        count: sql<number>`count(*)`
    })
        .from(cards)
        .groupBy(cards.setId);

    const countsMap: Record<string, number> = {};
    counts.forEach(c => {
        countsMap[c.setId] = c.count;
    });

    // Preparar datos para Client Component (sin Dates)
    const clientSets = seriesSets.map(s => ({
        id: s.id,
        name: s.name,
        series: s.series,
        printedTotal: s.printedTotal,
        total: s.total,
        releaseDate: s.releaseDate,
        images: s.images
    }));

    return (
        <SeriesDetailClient
            seriesName={decodedSeriesName}
            seriesSets={clientSets}
            countsMap={countsMap}
        />
    );
}
