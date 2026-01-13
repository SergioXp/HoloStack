"use client";

import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import Image from "next/image";
import { Plus, Search, Check, AlertCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CardSearchModal from "@/components/CardSearchModal";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface GenericCollectionGridProps {
    collectionId: string;
    savedCards: any[]; // Cards already added to the collection
    isEditMode: boolean;
    userCurrency: "EUR" | "USD";
    pokemonList: { id: number; name: string }[];
}

export default function GenericCollectionGrid({ collectionId, savedCards, isEditMode, userCurrency, pokemonList }: GenericCollectionGridProps) {
    const { t } = useI18n();
    const [selectedSlot, setSelectedSlot] = useState<{ id: number; name: string } | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Map saved cards to their Pokemon name slots
    const slotMap = new Map<number, any>();
    const usedCardIds = new Set<string>();

    pokemonList.forEach(poke => {
        // Find cards in savedCards that matches this pokemon
        const matches = savedCards.filter(c =>
            !usedCardIds.has(c.id) &&
            c.name.toLowerCase().includes(poke.name.toLowerCase())
        );

        // If matches found, take the last one (newest)
        if (matches.length > 0) {
            const selected = matches[matches.length - 1];
            slotMap.set(poke.id, selected);
            usedCardIds.add(selected.id);
        }
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
            // Check if slot already has a card assigned
            const existingCard = slotMap.get(selectedSlot.id);
            if (existingCard) {
                // If it's the exact same card ID, do nothing
                if (existingCard.id === card.id) {
                    setIsSearchOpen(false);
                    return;
                }

                await fetch(`/api/collections/${collectionId}/items`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cardIds: [existingCard.id] }),
                });
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {pokemonList.map((poke) => {
                    const assignedCard = slotMap.get(poke.id);
                    const images = assignedCard ? JSON.parse(assignedCard.images || "{}") : null;
                    // Prices are already strictly typed objects due to schema { mode: "json" }, no need to parse if they are not strings.
                    // However, we should be safe.
                    const prices = typeof assignedCard?.cardmarketPrices === 'string'
                        ? JSON.parse(assignedCard.cardmarketPrices)
                        : assignedCard?.cardmarketPrices
                            ? assignedCard.cardmarketPrices
                            : (typeof assignedCard?.tcgplayerPrices === 'string'
                                ? JSON.parse(assignedCard.tcgplayerPrices)
                                : assignedCard?.tcgplayerPrices);

                    const price = prices ? (userCurrency === "EUR" ? prices.averageSellPrice || prices.avg30 : prices.market) : null;

                    return (
                        <div
                            key={poke.id}
                            className={cn(
                                "aspect-[2.5/3.5] rounded-xl border-2 transition-all relative group overflow-hidden",
                                assignedCard
                                    ? "border-slate-800 bg-slate-900 shadow-lg"
                                    : "border-dashed border-slate-700 bg-slate-800/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer"
                            )}
                            onClick={!assignedCard ? () => handleSlotClick(poke) : undefined}
                        >
                            {/* Slot Number */}
                            <div className={cn(
                                "absolute top-2 right-2 z-20 text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none",
                                assignedCard ? "bg-black/50 text-white backdrop-blur-md" : "bg-slate-700/50 text-slate-400"
                            )}>
                                #{poke.id.toString().padStart(3, '0')}
                            </div>

                            {/* Overlay Controls for Assigned Cards */}
                            {assignedCard && (
                                <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 flex flex-col items-center justify-center gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSlotClick(poke); }}
                                            className="p-2 bg-slate-800 text-white rounded-full hover:bg-emerald-600 transition-colors"
                                            title="Change Card"
                                        >
                                            <Search className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleRemoveCard(e, assignedCard.id)}
                                            className="p-2 bg-slate-800 text-red-400 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                                            title="Remove Card"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <Link
                                        href={`/cards/${assignedCard.id}?from=/collections/${collectionId}`}
                                        className="text-white text-xs hover:underline mt-2"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            )}

                            {assignedCard ? (
                                <>
                                    {/* Card Image */}
                                    <div className="relative w-full h-full">
                                        {images?.small ? (
                                            <Image
                                                src={images.small}
                                                alt={assignedCard.name}
                                                fill
                                                className="object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                <span className="text-slate-500 text-xs text-center px-1">{assignedCard.name}</span>
                                            </div>
                                        )}

                                        {/* Price Tag */}
                                        {price && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-1 text-center">
                                                <span className="text-xs font-mono text-emerald-400">
                                                    {userCurrency === "EUR" ? "€" : "$"}{price.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Empty Slot State */
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-600 group-hover:text-emerald-400 transition-colors gap-2">
                                    <span className="font-black text-2xl opacity-20 group-hover:opacity-40">?</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">{poke.name}</span>
                                    <div className="mt-2 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <CardSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelectCard={handleSelectCard}
                initialQuery={selectedSlot?.name || ""}
            />
        </>
    );
}
