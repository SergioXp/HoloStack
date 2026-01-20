"use client";

import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import Image from "next/image";
import { Plus, Search, Check, AlertCircle, Trash2, FileText, Eye, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CardSearchModal from "@/components/CardSearchModal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CollectionItemManager from "./CollectionItemManager";
import { CardDetailModal } from "./CardDetailModal";

interface GenericCollectionGridProps {
    collectionId: string;
    savedCards: any[]; // Cards already added to the collection
    isEditMode: boolean;
    userCurrency: "EUR" | "USD";
    pokemonList: { id: number; name: string }[];
    ownershipData: Record<string, Record<string, { quantity: number; id: string; notes?: string | null }>>;
}

export default function GenericCollectionGrid({ collectionId, savedCards, isEditMode, userCurrency, pokemonList, ownershipData }: GenericCollectionGridProps) {
    const { t } = useI18n();
    const [selectedSlot, setSelectedSlot] = useState<{ id: number; name: string } | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"all" | "owned" | "missing">("all");
    const [selectedDetailCard, setSelectedDetailCard] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Deduplicate savedCards to ensure uniqueness and prevet key errors
    const uniqueSavedCards = Array.from(new Map(savedCards.map(item => [item.id, item])).values());

    // Map saved cards to their Pokemon name slots
    const slotMap = new Map<number, any[]>();
    const usedCardIds = new Set<string>();

    pokemonList.forEach(poke => {
        // Find ALL cards in savedCards that matches this pokemon
        const matches = uniqueSavedCards.filter(c =>
            !usedCardIds.has(c.id) &&
            c.name.toLowerCase().includes(poke.name.toLowerCase())
        );

        if (matches.length > 0) {
            slotMap.set(poke.id, matches);
            matches.forEach(m => usedCardIds.add(m.id));
        }
    });

    const filteredList = pokemonList.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toString().includes(searchQuery) ||
            p.id.toString().padStart(3, '0').includes(searchQuery);

        if (!matchesSearch) return false;

        const isOwned = slotMap.has(p.id);
        if (viewMode === "owned") return isOwned;
        if (viewMode === "missing") return !isOwned;
        return true;
    });

    const handleSlotClick = (poke: { id: number; name: string }) => {
        // Always allow opening to swap if has card, or add if empty
        setSelectedSlot(poke);
        setIsSearchOpen(true);
    };

    const handleRemoveCard = async (e: React.MouseEvent, cardId: string) => {
        e.stopPropagation();
        if (!confirm(t("collectionDetail.deleteConfirm", { count: 1 }))) return;

        try {
            const res = await fetch(`/api/collections/${collectionId}/items`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardIds: [cardId] }),
            });

            if (!res.ok) throw new Error("Failed to delete items");
            window.location.reload();
        } catch (error) {
            console.error("Error deleting card:", error);
            alert(t("collectionDetail.deleteError"));
        }
    };

    const handleSelectCard = async (card: any) => {
        if (!selectedSlot) return;

        // Validation: Verify if the card name includes the slot name
        if (!card.name.toLowerCase().includes(selectedSlot.name.toLowerCase())) {
            const confirmMismatch = confirm(
                `Warning: You are adding "${card.name}" to the "${selectedSlot.name}" slot. It might appear in a different slot or not at all if names don't match. Do you want to proceed?`
            );
            if (!confirmMismatch) return;
        }

        try {
            // Check if slot already has this exact card ID assigned somewhere in the collection (optional, but keep it for now)
            const existingCards = slotMap.get(selectedSlot.id) || [];
            if (existingCards.some(c => c.id === card.id)) {
                setIsSearchOpen(false);
                return;
            }

            // Add to collection API
            const res = await fetch(`/api/collections/${collectionId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardId: card.id }),
            });

            if (!res.ok) throw new Error("Failed to add card");

            window.location.reload();
        } catch (error) {
            console.error("Error adding card:", error);
            alert(t("common.error"));
        }
    };

    return (
        <>
            <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder={t("collectionDetail.searchCard")}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 inline-flex shadow-inner">
                    {(["all", "owned", "missing"] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => setViewMode(m)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-tight ${viewMode === m
                                ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                                : "text-slate-500 hover:text-white hover:bg-slate-800"
                                }`}
                        >
                            {m === "all" ? t("collectionDetail.showAll") : m === "owned" ? t("collectionDetail.showOwned") : t("collectionDetail.showMissing")}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
                {filteredList.map((poke) => (
                    <GenericCollectionSlot
                        key={poke.id}
                        poke={poke}
                        assignedCards={slotMap.get(poke.id) || []}
                        ownershipData={ownershipData}
                        collectionId={collectionId}
                        userCurrency={userCurrency}
                        handleSlotClick={handleSlotClick}
                        handleRemoveCard={handleRemoveCard}
                        setSelectedDetailCard={setSelectedDetailCard}
                        setIsDetailOpen={setIsDetailOpen}
                        t={t}
                    />
                ))}
            </div>

            {/* Unmatched Cards Section (Trainers, Energy, etc.) */}
            {(() => {
                const unmatchedCards = uniqueSavedCards.filter(c => !usedCardIds.has(c.id));
                if (unmatchedCards.length === 0) return null;

                return (
                    <div className="mt-12 pt-8 border-t border-slate-800">
                        <h3 className="text-lg font-bold text-slate-300 mb-6 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            {t("collectionDetail.otherItems") || "Otros Items / Entrenadores / Energías"}
                            <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-900 px-2 py-1 rounded-full border border-slate-800">
                                {unmatchedCards.length}
                            </span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
                            {unmatchedCards.map(card => (
                                <GenericCollectionSlot
                                    key={card.id}
                                    poke={{ id: 0, name: card.name }} // Dummy poke for layout
                                    assignedCards={[card]}
                                    ownershipData={ownershipData}
                                    collectionId={collectionId}
                                    userCurrency={userCurrency}
                                    handleSlotClick={() => { }} // No specific slot action for unmatched
                                    handleRemoveCard={handleRemoveCard}
                                    setSelectedDetailCard={setSelectedDetailCard}
                                    setIsDetailOpen={setIsDetailOpen}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                );
            })()}

            <CardSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelectCard={handleSelectCard}
                initialQuery={selectedSlot?.name || ""}
            />

            {selectedDetailCard && (
                <CardDetailModal
                    open={isDetailOpen}
                    onOpenChange={setIsDetailOpen}
                    card={{
                        cardId: selectedDetailCard.id,
                        cardName: selectedDetailCard.name,
                        cardNumber: selectedDetailCard.number,
                        setId: selectedDetailCard.setId,
                        cardImages: selectedDetailCard.images,
                        cardRarity: selectedDetailCard.rarity,
                        tcgplayerPrices: selectedDetailCard.tcgplayerPrices,
                        cardmarketPrices: selectedDetailCard.cardmarketPrices,
                        quantity: Object.values((ownershipData[selectedDetailCard.id] || {}) as Record<string, any>).reduce((a, b: any) => a + (b.quantity || 0), 0),
                        notesMap: Object.fromEntries(
                            Object.entries((ownershipData[selectedDetailCard.id] || {}) as Record<string, any>).map(([v, d]: [string, any]) => [v, d.notes || null])
                        )
                    }}
                />
            )}
        </>
    );
}

function GenericCollectionSlot({
    poke,
    assignedCards,
    ownershipData,
    collectionId,
    userCurrency,
    handleSlotClick,
    handleRemoveCard,
    setSelectedDetailCard,
    setIsDetailOpen,
    t
}: any) {
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
    const isOwned = assignedCards.length > 0;

    return (
        <div
            className={cn(
                "flex flex-col group relative transition-all duration-300",
                isHovered && isOwned ? "z-50 scale-105" : "z-10"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setHoveredCardId(null);
            }}
        >
            <div
                className={cn(
                    "aspect-[2.5/3.5] rounded-xl border-2 transition-all relative flex items-center justify-center",
                    isOwned
                        ? "border-transparent"
                        : "border-dashed border-slate-700 bg-slate-800/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer"
                )}
                onClick={!isOwned ? () => handleSlotClick(poke) : undefined}
            >
                {/* Cards Container - For the fan effect */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {assignedCards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-slate-700/50 group-hover:text-emerald-500/70 transition-all duration-300">
                            <span className="text-3xl font-black opacity-10 group-hover:opacity-20 transition-opacity select-none">
                                {poke.id.toString().padStart(3, '0')}
                            </span>
                            <Plus className="h-8 w-8 stroke-[1px] relative z-10 group-hover:scale-125 transition-transform" />
                        </div>
                    ) : (
                        assignedCards.map((card: any, idx: number) => {
                            const images = JSON.parse(card.images || "{}");
                            const isMain = idx === assignedCards.length - 1;
                            const isFocused = hoveredCardId === card.id;

                            // Fan positions
                            const offset = isHovered ? (idx - (assignedCards.length - 1) / 2) * (isFocused ? 35 : 30) : 0;
                            const rotation = isHovered ? (isFocused ? 0 : (idx - (assignedCards.length - 1) / 2) * 8) : 0;
                            const translateY = isHovered ? (isFocused ? -45 : -15) : 0;
                            const scale = isFocused ? 1.15 : 1;

                            return (
                                <div
                                    key={card.id}
                                    onMouseEnter={() => setHoveredCardId(card.id)}
                                    className={cn(
                                        "absolute inset-0 transition-all duration-300 ease-out pointer-events-auto cursor-pointer",
                                        isOwned && "shadow-2xl shadow-black/50 overflow-hidden rounded-xl border-2 border-slate-800 bg-slate-900",
                                        isHovered && hoveredCardId && !isFocused && ""
                                    )}
                                    style={{
                                        zIndex: isFocused ? 100 : (isHovered ? idx + 50 : idx),
                                        transform: `translateX(${offset}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDetailCard(card);
                                        setIsDetailOpen(true);
                                    }}
                                >
                                    {/* Slot Number Overlay (Only for main card when not hovered, or all when hovered) */}
                                    {(isMain || isHovered) && (
                                        <div className="absolute top-1 right-1 z-20 text-[6px] font-bold px-1 py-0.5 rounded-full bg-black/70 text-white pointer-events-none uppercase">
                                            #{poke.id.toString().padStart(3, '0')}
                                        </div>
                                    )}

                                    {/* Indicator for multiple cards (Only on main card) */}
                                    {isMain && !isHovered && assignedCards.length > 1 && (
                                        <div className="absolute bottom-1 right-1 z-20 h-5 w-5 rounded-full bg-blue-600/90 text-[10px] font-bold flex items-center justify-center border border-white/20 shadow-lg text-white">
                                            +{assignedCards.length - 1}
                                        </div>
                                    )}

                                    {/* Notes indicator */}
                                    {(() => {
                                        const cardOwnership = (ownershipData[card.id] || {}) as Record<string, any>;
                                        const hasNotes = Object.values(cardOwnership).some(v => !!v.notes);
                                        if (!hasNotes) return null;
                                        return (
                                            <div className="absolute top-1 left-1 z-20 bg-amber-500 text-slate-950 p-0.5 rounded shadow-lg shadow-amber-500/20">
                                                <FileText className="h-2.5 w-2.5" />
                                            </div>
                                        );
                                    })()}

                                    <Image
                                        src={images.small}
                                        alt={card.name}
                                        fill
                                        className="object-cover"
                                        loading="lazy"
                                    />

                                    {/* Action Overlay inside each card for direct interaction */}
                                    <div className={cn(
                                        "absolute inset-0 transition-opacity duration-300 flex flex-col items-center justify-center gap-2",
                                        isFocused ? "opacity-100" : "opacity-0"
                                    )}>
                                        <div
                                            className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-full border border-white/10 shadow-xl scale-75"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsDetailOpen(true); setSelectedDetailCard(card); }}
                                                className="h-8 w-8 flex items-center justify-center bg-slate-800 text-emerald-400 rounded-full hover:bg-emerald-600 hover:text-white transition-all hover:scale-110 shadow-lg"
                                                title={t("common.viewDetail")}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleSlotClick(poke); }}
                                                className="h-8 w-8 flex items-center justify-center bg-slate-800 text-white rounded-full hover:bg-blue-600 transition-all hover:scale-110 shadow-lg"
                                                title={t("collectionDetail.changeCard")}
                                            >
                                                <Search className="h-3.5 w-3.5" />
                                            </button>

                                            <CollectionItemManager
                                                card={card}
                                                collectionId={collectionId}
                                                ownedData={new Map(Object.entries((ownershipData[card.id] || {}) as Record<string, any>))}
                                                userCurrency={userCurrency}
                                                totalInSet={100}
                                                variant="minimal"
                                            />

                                            <button
                                                onClick={(e) => handleRemoveCard(e, card.id)}
                                                className="h-8 w-8 flex items-center justify-center bg-slate-800 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-all hover:scale-110 shadow-lg"
                                                title={t("collectionDetail.removeCard")}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-[7px] text-white font-bold truncate w-[80%] text-center uppercase tracking-tighter">
                                            {card.setName}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Common Footer for the whole slot */}
            <div className={cn(
                "relative z-10 px-2 py-2 flex flex-col justify-center items-center gap-0.5 min-h-[52px] transition-all duration-300",
                isOwned ? "bg-slate-900/95" : "bg-slate-800/20",
                isHovered && isOwned ? "translate-y-4 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
            )}>
                <p className={cn(
                    "text-[10px] font-bold text-center uppercase tracking-tight leading-tight w-full truncate",
                    isOwned ? "text-white" : "text-slate-500"
                )}>
                    {poke.name}
                </p>
                <div className="flex items-center gap-2 opacity-60">
                    <div className="h-px w-3 bg-slate-700"></div>
                    <p className="text-[9px] text-slate-500 font-mono font-bold tracking-widest">
                        #{poke.id.toString().padStart(3, '0')}
                    </p>
                    <div className="h-px w-3 bg-slate-700"></div>
                </div>
            </div>
            {isHovered && isOwned && (
                <div className="absolute bottom-0.5 left-2 right-2 animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
                    <div className="bg-slate-900/95 py-1.5 rounded-lg border border-slate-700 text-center shadow-2xl backdrop-blur-sm">
                        <p className="text-[9px] font-black text-white uppercase truncate tracking-widest">
                            {assignedCards.length} {assignedCards.length === 1 ? t("common.card") : t("common.cards")}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
