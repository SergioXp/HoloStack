"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Library, Sparkles, Globe, Pencil, Trash2, X, CheckSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import CollectionHydrator from "@/components/CollectionHydrator";
import CollectionFilter from "@/components/CollectionFilter";
import CollectionSettings from "@/components/CollectionSettings";
import RefreshPricesButton from "@/components/RefreshPricesButton";
// Specialized grid for 151 collection
import GenericCollectionGrid from "./GenericCollectionGrid";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { getPokemonListByGeneration } from "@/lib/constants/pokemon-generations";

interface CollectionDetailClientProps {
    collection: {
        id: string;
        name: string;
        description: string | null;
        type: string;
        language: string | null;
        showPrices: boolean;
        sortBy: string | null;
        filters: string | null;
        notes: string | null;
    };
    displayCards: any[];
    ownershipData: Record<string, Record<string, { quantity: number; id: string; notes?: string | null }>>;
    totalCardsCount: number;
    uniqueOwnedCount: number;
    progress: number;
    isComplete: boolean;
    isMultiSet: boolean;
    setNames: Record<string, string>;
    userCurrency: "EUR" | "USD";
}

export default function CollectionDetailClient({
    collection,
    displayCards,
    ownershipData,
    totalCardsCount,
    uniqueOwnedCount,
    progress,
    isComplete,
    isMultiSet,
    setNames,
    userCurrency
}: CollectionDetailClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    // Override stats for Generic 151


    // ... (existing helper function imports if any, keeping it clean)

    // Inside component
    // Override stats for Generic 151 / Flexible Collections
    let isGenericCollection = collection.type === "generic_151";
    let pokemonList: { id: number, name: string }[] = [];

    // Hoist genId so we can use it in the UI label
    let currentGenId = "gen1";

    if (isGenericCollection) {
        // Parse generation from filters or default to Gen 1
        if (collection.filters) {
            try {
                const parsed = JSON.parse(collection.filters);
                if (parsed.generation) currentGenId = parsed.generation;
            } catch (e) {
                // Ignore parse error
            }
        }

        pokemonList = getPokemonListByGeneration(currentGenId);
        totalCardsCount = pokemonList.length;

        // Count how many of the slots have at least one UNIQUE card assigned
        const usedCardIds = new Set<string>();
        uniqueOwnedCount = 0;

        pokemonList.forEach((p) => {
            // Find available match (not already used)
            const match = displayCards.find((c: any) =>
                !usedCardIds.has(c.id) &&
                c.name.toLowerCase().includes(p.name.toLowerCase())
            );
            if (match) {
                uniqueOwnedCount++;
                usedCardIds.add(match.id);
            }
        });

        // Use more precision for generic binders to avoid "0%" on large lists
        progress = totalCardsCount > 0 ? (uniqueOwnedCount / totalCardsCount) * 100 : 0;
        isComplete = uniqueOwnedCount === totalCardsCount && totalCardsCount > 0;
    }

    const toggleSelection = (cardId: string) => {
        const newSelected = new Set(selectedCards);
        if (newSelected.has(cardId)) {
            newSelected.delete(cardId);
        } else {
            newSelected.add(cardId);
        }
        setSelectedCards(newSelected);
    };

    const handleDeleteSelected = async () => {
        if (selectedCards.size === 0) return;

        if (!confirm(t("collectionDetail.deleteConfirm", { count: selectedCards.size }))) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/collections/${collection.id}/items`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardIds: Array.from(selectedCards) }),
            });

            if (!res.ok) throw new Error("Failed to delete items");

            // toast.success(t("collectionDetail.deleteSuccess"));
            alert(t("collectionDetail.deleteSuccess"));
            setSelectedCards(new Set());
            setIsEditMode(false);
            router.refresh();
        } catch (error) {
            console.error("Error deleting items:", error);
            // toast.error(t("collectionDetail.deleteError"));
            alert(t("collectionDetail.deleteError"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-br from-purple-900/10 via-slate-950 to-blue-900/10" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <Link href="/collections" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("collectionDetail.backToCollections")}
                        </Link>

                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isComplete
                                        ? "bg-linear-to-br from-emerald-500 to-green-500 shadow-emerald-500/20"
                                        : "bg-linear-to-br from-purple-500 to-pink-500 shadow-purple-500/20"
                                        }`}>
                                        {isComplete ? (
                                            <Sparkles className="h-7 w-7 text-white" />
                                        ) : (
                                            <Library className="h-7 w-7 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h1 className="text-3xl font-bold text-white tracking-tight">{collection.name}</h1>
                                            {!isEditMode && (
                                                <>
                                                    <CollectionSettings collection={collection} />
                                                    <RefreshPricesButton cardIds={displayCards.map(c => c.id)} />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setIsEditMode(true)}
                                                        className="text-slate-400 hover:text-white hover:bg-white/10"
                                                        title={t("collectionDetail.editModeTooltip")}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>

                                        {isEditMode && (
                                            <div className="flex items-center gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setIsEditMode(false)}
                                                    className="h-8 gap-2"
                                                >
                                                    <X className="h-3 w-3" />
                                                    {t("common.cancel")}
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={selectedCards.size === 0 || isDeleting}
                                                    onClick={handleDeleteSelected}
                                                    className="h-8 gap-2 bg-red-500 hover:bg-red-600 border-red-600"
                                                >
                                                    {isDeleting ? (
                                                        <Sparkles className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3 w-3" />
                                                    )}
                                                    {t("collectionDetail.deleteSelected", { count: selectedCards.size })}
                                                </Button>
                                                <div className="ml-auto text-xs text-red-200 font-medium px-2">
                                                    {t("collectionDetail.editMode")}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            <Badge variant="outline" className={`capitalize border-0 ${collection.type === "auto"
                                                ? "bg-purple-500/10 text-purple-300"
                                                : collection.type === "generic_151"
                                                    ? "bg-emerald-500/10 text-emerald-300"
                                                    : "bg-blue-500/10 text-blue-300"
                                                }`}>
                                                {collection.type === "auto"
                                                    ? t("collections.auto")
                                                    : collection.type === "generic_151"
                                                        ? isGenericCollection && currentGenId // Check to ensure we have the ID
                                                            // @ts-ignore - dynamic key access
                                                            ? t(`generations.${currentGenId}`)
                                                            : "151 Genérica"
                                                        : t("collections.manual")}
                                            </Badge>
                                            {collection.language && (
                                                <Badge variant="outline" className="capitalize border-0 bg-emerald-500/10 text-emerald-300">
                                                    <Globe className="h-3 w-3 mr-1" />
                                                    {collection.language.toUpperCase()}
                                                </Badge>
                                            )}
                                            <span className="text-slate-500 text-sm">
                                                {uniqueOwnedCount} / {displayCards.length} {t("collectionDetail.cards")}
                                            </span>
                                        </div>
                                        {collection.description && (
                                            <p className="text-slate-400 text-sm mt-3 max-w-xl">
                                                {collection.description}
                                            </p>
                                        )}
                                        {collection.notes && (
                                            <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl max-w-xl">
                                                <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    {t("collectionDetail.privateNotes") || "Notas Privadas"}
                                                </div>
                                                <p className="text-slate-300 text-sm italic whitespace-pre-wrap">
                                                    {collection.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Section */}
                            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 min-w-[200px]">
                                <div className="text-center mb-4">
                                    <div className={`text-5xl font-black ${isComplete ? "text-emerald-400" : "text-white"}`}>
                                        {Number(progress).toFixed(1).replace(/\.0$/, "")}%
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                                        {isComplete ? t("collectionDetail.completed") : t("collectionDetail.progress")}
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${isComplete
                                            ? "bg-linear-to-r from-emerald-500 to-green-400"
                                            : "bg-linear-to-r from-purple-500 to-pink-500"
                                            }`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {collection.type === "generic_151" ? (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <GenericCollectionGrid
                                collectionId={collection.id}
                                savedCards={displayCards}
                                ownershipData={ownershipData}
                                isEditMode={isEditMode}
                                userCurrency={userCurrency}
                                pokemonList={pokemonList}
                            />
                        </div>
                    ) : displayCards.length === 0 ? (
                        collection.type === "auto" ? (
                            <CollectionHydrator collectionId={collection.id} hasFilters={!!collection.filters} />
                        ) : (
                            <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                                <div className="text-5xl mb-4">📦</div>
                                <h3 className="text-xl font-bold text-white mb-2">{t("collectionDetail.emptyManual.title")}</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    {t("collectionDetail.emptyManual.description")}
                                </p>
                            </div>
                        )
                    ) : (
                        <CollectionFilter
                            cards={displayCards}
                            collectionId={collection.id}
                            ownershipData={ownershipData}
                            totalCardsCount={totalCardsCount}
                            isMultiSet={isMultiSet}
                            setNames={setNames}
                            defaultSort={collection.sortBy || "number"}
                            showPrices={collection.showPrices}
                            userCurrency={userCurrency}
                            isEditMode={isEditMode}
                            selectedCards={selectedCards}
                            onToggleSelection={toggleSelection}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
