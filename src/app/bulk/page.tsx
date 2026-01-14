
import { Suspense } from "react";
import { db } from "@/db";
import { sets } from "@/db/schema";
import { desc } from "drizzle-orm";
import { BulkEntryClient } from "@/components/BulkEntryClient";
import { BulkDuplicatesClient } from "@/components/BulkDuplicatesClient";
import { Loader2, PackageOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function BulkPage() {
    // Fetch all sets for the dropdown
    const allSets = await db.select({
        id: sets.id,
        name: sets.name,
        total: sets.total,
        images: sets.images
    })
        .from(sets)
        .orderBy(desc(sets.releaseDate));

    // Normalize sets for proper rendering
    const normalizedSets = allSets.map(s => {
        let logo = undefined;
        try {
            if (s.images) {
                const imgs = JSON.parse(s.images);
                logo = imgs.logo || imgs.symbol;
            }
        } catch { }

        return {
            id: s.id,
            name: s.name,
            total: s.total,
            logo: logo,
            image: s.images || undefined
        };
    });

    // Fetch user collections
    const myCollections = await db.query.collections.findMany({
        columns: {
            id: true,
            name: true,
            type: true
        },
        orderBy: (collections, { desc }) => [desc(collections.updatedAt)]
    });

    return (
        <main className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                {/* Header */}
                <PageHeader
                    title="Bulk Entry Mode"
                    description="Gestión masiva de inventario y apertura de sobres."
                    icon={PackageOpen}
                    iconColor="from-blue-500 to-cyan-500"
                />

                <Suspense fallback={
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                }>
                    <Tabs defaultValue="entry" className="space-y-8">
                        <TabsList className="bg-slate-900 border border-slate-800 p-1 h-auto grid grid-cols-2 w-full md:w-[400px]">
                            <TabsTrigger
                                value="entry"
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white h-10 transition-all"
                            >
                                Entrada Masiva
                            </TabsTrigger>
                            <TabsTrigger
                                value="duplicates"
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white h-10 transition-all"
                            >
                                Duplicados
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="entry" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <BulkEntryClient sets={normalizedSets} collections={myCollections} />
                        </TabsContent>

                        <TabsContent value="duplicates" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <BulkDuplicatesClient collections={myCollections} />
                        </TabsContent>
                    </Tabs>
                </Suspense>
            </div>
        </main>
    );
}
