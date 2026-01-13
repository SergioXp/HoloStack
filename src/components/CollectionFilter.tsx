"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronDown, LayoutGrid, Sparkles, Table } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CollectionItemManager from "./CollectionItemManager";
import CollectionTableView from "./CollectionTableView";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface CollectionFilterProps {
    cards: any[];
    collectionId: string;
    ownershipData: Record<string, Record<string, { quantity: number; id: string }>>;
    totalCardsCount: number;
    isMultiSet: boolean;
    setNames: Record<string, string>;
    defaultSort: string;
    showPrices: boolean;
    userCurrency: "EUR" | "USD";
    isEditMode?: boolean;
    selectedCards?: Set<string>;
    onToggleSelection?: (cardId: string) => void;
}

const RARITY_RANK: Record<string, number> = {
    "Common": 1,
    "Uncommon": 2,
    "Rare": 3,
    "Double Rare": 4,
    "Ultra Rare": 5,
    "Illustration Rare": 6,
    "Special Illustration Rare": 7,
    "Secret Rare": 8,
    "Hyper Rare": 9,
    "SIR": 10
};

export default function CollectionFilter({
    cards,
    collectionId,
    ownershipData,
    totalCardsCount,
    isMultiSet,
    setNames,
    defaultSort,
    showPrices,
    userCurrency,
    isEditMode,
    selectedCards,
    onToggleSelection
}: CollectionFilterProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSet, setSelectedSet] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"all" | "owned" | "missing">("all");
    const [gridColumns, setGridColumns] = useState(5);
    const [displayMode, setDisplayMode] = useState<"grid" | "table">("grid");
    const [refreshKey, setRefreshKey] = useState(0);

    // -- Wishlist Loading (Batch) --
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch("/api/wishlist")
            .then(res => res.json())
            .then((data: any[]) => {
                if (Array.isArray(data)) {
                    setWishlist(new Set(data.map(item => item.cardId)));
                }
            })
            .catch(console.error);
    }, []);

    const toggleWishlist = async (cardId: string) => {
        const isIn = wishlist.has(cardId);
        const newSet = new Set(wishlist);
        if (isIn) newSet.delete(cardId);
        else newSet.add(cardId);

        setWishlist(newSet); // Optimistic

        try {
            if (isIn) await fetch(`/api/wishlist?cardId=${cardId}`, { method: 'DELETE' });
            else await fetch('/api/wishlist', { method: 'POST', body: JSON.stringify({ cardId }) });
        } catch {
            setWishlist(wishlist); // Revert
        }
    };

    const handleDataChanged = () => {
        router.refresh();
        setRefreshKey(k => k + 1);
    };

    // -- Stats --
    const stats = useMemo(() => {
        let ownedCount = 0;
        let totalOwnedItems = 0;
        const rarityOwned: Record<string, number> = {};
        const rarityTotal: Record<string, number> = {};

        cards.forEach(card => {
            const r = card.rarity || t("cardDetail.unknown"); // Usar unknown si no hay rareza
            if (!rarityTotal[r]) rarityTotal[r] = 0;
            rarityTotal[r]++;

            const ownedVars = ownershipData[card.id];
            const isOwned = ownedVars && Object.values(ownedVars).some(v => v.quantity > 0);

            if (isOwned && ownedVars) {
                ownedCount++;
                totalOwnedItems += Object.values(ownedVars).reduce((a, b) => a + b.quantity, 0);
                if (!rarityOwned[r]) rarityOwned[r] = 0;
                rarityOwned[r]++;
            }
        });

        const sortedRarities = Object.keys(rarityTotal).sort((a, b) => rarityTotal[b] - rarityTotal[a]);

        return {
            ownedCount,
            totalOwnedItems,
            percentage: totalCardsCount > 0 ? ((ownedCount / totalCardsCount) * 100).toFixed(1) : "0",
            rarityOwned,
            rarityTotal,
            sortedRarities
        };
    }, [cards, ownershipData, totalCardsCount, t]);

    // -- Unique Sets --
    const uniqueSets = useMemo(() => {
        const sets = new Map<string, string>();
        cards.forEach(card => {
            if (!sets.has(card.setId)) {
                sets.set(card.setId, setNames[card.setId] || card.setId);
            }
        });
        return Array.from(sets.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [cards, setNames]);

    // -- Filtered Cards --
    const filteredCards = useMemo(() => {
        const filteredList = cards.filter(card => {
            const matchesName = searchQuery === "" ||
                card.name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesSet = selectedSet === null || card.setId === selectedSet;

            let matchesView = true;
            const ownedVars = ownershipData[card.id];
            const isOwned = ownedVars && Object.values(ownedVars).some(v => v.quantity > 0);

            if (viewMode === "owned") matchesView = !!isOwned;
            if (viewMode === "missing") matchesView = !isOwned;

            return matchesName && matchesSet && matchesView;
        });

        // Apply Sorting
        const sorted = [...filteredList];

        if (defaultSort === "pokedex") {
            // Pokedex sort is handled by the server component `CollectionPage`
            // and `cards` prop should already be sorted if `defaultSort` is "pokedex".
            // No client-side re-sorting needed for pokedex here.
        } else if (defaultSort === "name") {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else if (defaultSort === "rarity") {
            sorted.sort((a, b) => {
                const rA = RARITY_RANK[a.rarity] || 0;
                const rB = RARITY_RANK[b.rarity] || 0;
                return rB - rA; // High rarity first
            });
        } else if (defaultSort === "price") {
            sorted.sort((a, b) => {
                const priceA = a.tcgplayerPrices?.marketPrice || 0;
                const priceB = b.tcgplayerPrices?.marketPrice || 0;
                return priceB - priceA; // High price first
            });
        }

        return sorted;
    }, [cards, searchQuery, selectedSet, viewMode, ownershipData, defaultSort]);

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedSet(null);
        setViewMode("all");
    };

    const hasActiveFilters = searchQuery !== "" || selectedSet !== null || viewMode !== "all";

    const getOwnedVariants = (cardId: string): Map<string, { quantity: number; id: string }> => {
        const data = ownershipData[cardId];
        if (!data) return new Map();
        return new Map(Object.entries(data));
    };

    const gridColsClass: Record<number, string> = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        7: "grid-cols-7",
        8: "grid-cols-8",
    };

    const isComplete = parseFloat(stats.percentage) === 100;

    return (

        <div className="space-y-6">
            {/* Stats Dashboard */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col gap-6">
                    {/* Main Stats */}
                    <div className="flex flex-wrap gap-8 items-center">
                        <div className="text-center">
                            <div className={`text-5xl font-black leading-none ${isComplete ? "text-emerald-400" : "text-white"}`}>
                                {stats.percentage}%
                            </div>
                            <div className="text-sm text-slate-400 uppercase tracking-wider font-medium mt-2">{t("collections.completed")}</div>
                        </div>

                        <div className="h-12 w-px bg-slate-700" />

                        <div className="text-center">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-emerald-400">{stats.ownedCount}</span>
                                <span className="text-slate-500 text-xl">/ {totalCardsCount}</span>
                            </div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">{t("collections.uniqueCards")}</div>
                        </div>

                        <div className="h-12 w-px bg-slate-700" />

                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400">{stats.totalOwnedItems}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">{t("collections.totalCopies")}</div>
                        </div>
                    </div>

                    {/* Rarity Breakdown */}
                    <div className="border-t border-slate-800 pt-6">
                        <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            {t("collectionDetail.progressByRarity")}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {stats.sortedRarities.slice(0, 12).map((r) => {
                                const owned = stats.rarityOwned[r] || 0;
                                const total = stats.rarityTotal[r] || 0;
                                const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
                                const rarityComplete = pct === 100;

                                return (
                                    <div key={r} className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs text-slate-300 font-medium truncate pr-2 flex-1" title={r}>{r}</span>
                                            <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 shrink-0 ${rarityComplete
                                                ? "bg-emerald-500/20 text-emerald-300"
                                                : "bg-slate-700 text-slate-400"
                                                }`}>
                                                {pct}%
                                            </Badge>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-1">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${rarityComplete
                                                    ? "bg-linear-to-r from-emerald-500 to-green-400"
                                                    : "bg-linear-to-r from-purple-500 to-blue-500"
                                                    }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-slate-500 text-right">{owned}/{total}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-900/30 backdrop-blur-sm p-4 rounded-xl border border-slate-800/50">
                {/* Search & Filters */}
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            type="text"
                            placeholder={t("collectionDetail.searchCard")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-900 border-slate-700 text-white h-10 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {isMultiSet && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-10 rounded-xl">
                                    <span className="truncate max-w-[120px]">
                                        {selectedSet ? setNames[selectedSet] || selectedSet : t("collectionDetail.allSets")}
                                    </span>
                                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-900 border-slate-700 text-white max-h-[300px] overflow-y-auto">
                                <DropdownMenuItem onClick={() => setSelectedSet(null)} className="hover:bg-slate-800">
                                    {t("collectionDetail.allSets")}
                                </DropdownMenuItem>
                                {uniqueSets.map(([id, name]) => (
                                    <DropdownMenuItem key={id} onClick={() => setSelectedSet(id)} className="hover:bg-slate-800">
                                        {name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* View Mode Tabs */}
                <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 inline-flex">
                    {(["all", "owned", "missing"] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setViewMode(m)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === m
                                ? "bg-linear-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                        >
                            {m === "all" ? t("collectionDetail.showAll") : m === "owned" ? t("collectionDetail.showOwned") : t("collectionDetail.showMissing")}
                        </button>
                    ))}
                </div>

                {/* Display Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => setDisplayMode("grid")}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            displayMode === "grid"
                                ? "bg-purple-500/20 text-purple-400"
                                : "text-slate-400 hover:text-white"
                        )}
                        title={t("common.gridView")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setDisplayMode("table")}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            displayMode === "table"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "text-slate-400 hover:text-white"
                        )}
                        title={t("common.tableView")}
                    >
                        <Table className="h-4 w-4" />
                    </button>
                </div>

                {/* Grid Size (solo en modo grid) */}
                {displayMode === "grid" && (
                    <div className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
                        <LayoutGrid className="h-4 w-4 text-slate-500" />
                        <input
                            type="range"
                            min="2" max="8" step="1"
                            value={gridColumns}
                            onChange={(e) => setGridColumns(parseInt(e.target.value))}
                            className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <span className="text-xs text-slate-400 w-4">{gridColumns}</span>
                    </div>
                )}
            </div>

            {/* Content - Grid o Table */}
            {displayMode === "table" ? (
                <CollectionTableView
                    key={refreshKey}
                    cards={filteredCards}
                    collectionId={collectionId}
                    ownershipData={ownershipData}
                    setNames={setNames}
                    onDataImported={handleDataChanged}
                />
            ) : (
                <>
                    {/* Results Info */}
                    <div className="flex justify-between items-center text-sm px-1">
                        <span className="text-slate-400">
                            {t("collectionDetail.showing")} <span className="text-white font-medium">{filteredCards.length}</span> {t("common.cards").toLowerCase()}
                        </span>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors">
                                <X className="h-4 w-4" />
                                {t("collectionDetail.clearFilters")}
                            </button>
                        )}
                    </div>

                    {/* Cards Grid */}
                    {filteredCards.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-lg font-semibold text-white mb-2">{t("collectionDetail.noResults.title")}</h3>
                            <p className="text-slate-500">{t("collectionDetail.noResults.description")}</p>
                        </div>
                    ) : (
                        <div className={`grid gap-4 ${gridColsClass[gridColumns] || "grid-cols-5"}`}>
                            {filteredCards.map(card => (
                                <CollectionItemManager
                                    key={card.id}
                                    card={card}
                                    collectionId={collectionId}
                                    ownedData={getOwnedVariants(card.id)}
                                    totalInSet={totalCardsCount}
                                    showSetInfo={isMultiSet}
                                    setName={setNames[card.setId] || card.setId}
                                    isInWishlist={wishlist.has(card.id)}
                                    onToggleWishlist={toggleWishlist}
                                    showPrices={showPrices}
                                    userCurrency={userCurrency}
                                    isEditMode={isEditMode}
                                    isSelected={selectedCards?.has(card.id)}
                                    onToggleSelection={() => onToggleSelection?.(card.id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
