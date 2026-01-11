import { db } from "@/db";
import { sets } from "@/db/schema";
import { desc } from "drizzle-orm";
import CreateCollectionForm from "@/components/CreateCollectionForm";

export const dynamic = "force-dynamic";

export default async function NewCollectionPage() {
    const allSets = await db.select({
        id: sets.id,
        name: sets.name
    })
        .from(sets)
        .orderBy(desc(sets.releaseDate));

    return <CreateCollectionForm availableSets={allSets} />;
}
