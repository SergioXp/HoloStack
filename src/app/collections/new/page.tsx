import { db } from "@/db";
import { sets } from "@/db/schema";
import { desc } from "drizzle-orm";
import CreateCollectionForm from "@/components/CreateCollectionForm";

export const dynamic = "force-dynamic";

export default async function NewCollectionPage() {
    const allSets = await db.select({
        id: sets.id,
        name: sets.name,
        total: sets.total,
        printedTotal: sets.printedTotal,
        images: sets.images
    })
        .from(sets)
        .orderBy(desc(sets.releaseDate));

    return <CreateCollectionForm availableSets={allSets} />;
}
