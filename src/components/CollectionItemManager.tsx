"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Plus, Minus, Sparkles, Heart } from "lucide-react";
import { updateCollectionItem } from "@/app/actions/collection";
import { getAvailableVariants } from "@/lib/card-utils";
import { useI18n } from "@/lib/i18n";
import { TagManager } from "@/components/TagManager";
import { CardDetailModal, CardDetailTrigger } from "./CardDetailModal";

interface CardData {
    id: string;
    name: string;
    rarity: string;
    supertype: string;
    number: string;
    images: string; // JSON string
    [key: string]: any; // Allow other properties for now
}

interface CollectionItemManagerProps {
    card: CardData;
    collectionId: string;
    ownedData: Map<string, { quantity: number; id: string }>;
    totalInSet: number;
    showSetInfo?: boolean;
    setName?: string;
    onUpdate?: (variant: string, quantity: number) => void;
    isInWishlist?: boolean;
    onToggleWishlist?: (cardId: string) => void;
    variant?: 'default' | 'binder';
}

export default function CollectionItemManager({
    card,
    collectionId,
    ownedData,
    totalInSet,
    showSetInfo = false,
    setName,
    onUpdate,
    variant = 'default',
    isInWishlist: initialInWishlist,
    onToggleWishlist
}: CollectionItemManagerProps) {
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Internal state only used if prop is not provided (legacy behavior)
    const [internalInWishlist, setInternalInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    const isWishlist = initialInWishlist !== undefined ? initialInWishlist : internalInWishlist;

    // Load wishlist only if prop not provided (Legacy support, though we should avoid this path)
    useEffect(() => {
        if (initialInWishlist !== undefined) return;

        const checkWishlist = async () => {
            try {
                const res = await fetch(`/api/wishlist?check=${card.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setInternalInWishlist(data.inWishlist);
                }
            } catch (error) {
                console.error("Error checking wishlist:", error);
            }
        };
        checkWishlist();
    }, [card.id, initialInWishlist]);

    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // If parent handler provided, delegate logic
        if (onToggleWishlist) {
            onToggleWishlist(card.id);
            return;
        }

        // Fallback internal logic
        setWishlistLoading(true);
        const newState = !internalInWishlist;
        setInternalInWishlist(newState); // Optimistic

        try {
            await fetch("/api/wishlist", {
                method: newState ? "POST" : "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardId: card.id }),
            });
        } catch (error) {
            setInternalInWishlist(!newState);
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleUpdate = async (variant: string, newQuantity: number) => {
        // Optimistic update via callback if provided
        if (onUpdate) {
            onUpdate(variant, newQuantity);
        }

        setIsLoading(true);
        try {
            await updateCollectionItem(collectionId, card.id, variant, newQuantity);
        } catch (error) {
            console.error("Failed to update item", error);
        } finally {
            setIsLoading(false);
        }
    };

    const totalOwned = Array.from(ownedData.values()).reduce((a, b) => a + b.quantity, 0);
    const isOwned = totalOwned > 0;

    // Parsear variantes usando la lógica compartida
    const availableSet = getAvailableVariants(card.rarity || "Unknown", card.supertype);
    const possibleVariants = Array.from(availableSet);

    // Prioridad para ordenación
    const VARIANT_PRIORITY: Record<string, number> = {
        "normal": 1,
        "holofoil": 2,
        "reverseHolofoil": 3,
        "1stEditionHolofoil": 4,
        "1stEditionNormal": 5,
        "unlimitedHolofoil": 6
    };

    possibleVariants.sort((a, b) => {
        const priorityA = VARIANT_PRIORITY[a] || 99;
        const priorityB = VARIANT_PRIORITY[b] || 99;
        return priorityA - priorityB;
    });

    const cardImages = card.images ? JSON.parse(card.images) : null;

    // Determinar rareza para efectos visuales
    const isSpecialRarity = card.rarity?.toLowerCase().includes('rare') ||
        card.rarity?.toLowerCase().includes('holo') ||
        card.rarity?.toLowerCase().includes('illustration') ||
        card.rarity?.toLowerCase().includes('ultra') ||
        card.rarity?.toLowerCase().includes('secret');

    return (
        <>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <div
                        className={cn(
                            "relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group",
                            isOwned
                                ? "bg-secondary/50 border-primary/20"
                                : "bg-muted/30 border-transparent",
                            !isOwned && "grayscale opacity-50 hover:grayscale-0 hover:opacity-100",
                            isHovered && "scale-[1.03] z-10",
                            variant === 'binder' ? "h-full w-full border-0 rounded-md bg-transparent m-0 p-0" : ""
                        )}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {/* Glow Effect for Special Cards */}
                        {isOwned && isSpecialRarity && variant !== 'binder' && (
                            <div className="absolute inset-0 bg-linear-to-br from-yellow-500/10 via-transparent to-purple-500/10 z-0" />
                        )}

                        <div className={cn("relative", variant === 'default' && "p-2", variant === 'binder' && "h-full p-0 flex items-center justify-center")}>


                            {/* Card Image */}
                            <div className={cn(
                                "relative overflow-hidden transition-all duration-300",
                                variant === 'default' && "aspect-[2.5/3.5] rounded-lg mb-2",
                                variant === 'binder' && "aspect-[63/88] h-full w-auto max-w-full mx-auto rounded-sm shadow-md",
                                isHovered && "shadow-xl shadow-black/50"
                            )}>
                                {/* Owned Badge - Moved Inside */}
                                {isOwned && (
                                    <div className={cn(
                                        "absolute z-20",
                                        variant === 'binder' ? "top-1 right-1" : "top-3 right-3"
                                    )}>
                                        <div className={cn(
                                            "flex items-center gap-1 bg-emerald-500 text-black rounded-full font-bold shadow-lg shadow-emerald-500/30",
                                            variant === 'binder' ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
                                        )}>
                                            {isSpecialRarity && <Sparkles className={cn(variant === 'binder' ? "h-2 w-2" : "h-3 w-3")} />}
                                            {totalOwned}
                                        </div>
                                    </div>
                                )}
                                {cardImages?.small && !imageError ? (
                                    <Image
                                        src={cardImages.small}
                                        alt={card.name}
                                        fill
                                        className={cn(
                                            "object-cover transition-all duration-300",
                                            isOwned ? "brightness-100" : "brightness-75"
                                        )}
                                        sizes="(max-width: 640px) 50vw, 20vw"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-2">
                                        <span className="text-4xl">🃏</span>
                                        <span className="text-slate-500 text-xs">{t("cardItem.noImage")}</span>
                                    </div>
                                )}

                                {/* Quick Action Overlay */}
                                <div
                                    className={cn(
                                        "absolute bg-slate-950/90 backdrop-blur-md rounded-xl transition-all duration-300 ease-out border border-white/10 shadow-xl",
                                        variant === 'binder' ? "bottom-2 left-2 right-2 p-1.5" : "bottom-2 left-2 right-2 p-2",
                                        isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        {/* Detail Modal Trigger */}
                                        <CardDetailTrigger
                                            onClick={() => setDetailOpen(true)}
                                            className={cn("bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white", variant === 'binder' ? "h-6 w-6" : "h-8 w-8")}
                                        />

                                        {/* Wishlist Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "rounded-full",
                                                variant === 'binder' ? "h-6 w-6" : "h-8 w-8",
                                                isWishlist
                                                    ? "text-pink-500 bg-pink-500/10 hover:bg-pink-500/20"
                                                    : "text-muted-foreground hover:text-pink-400 hover:bg-pink-500/10"
                                            )}
                                            onClick={handleToggleWishlist}
                                            disabled={wishlistLoading}
                                        >
                                            <Heart className={cn(variant === 'binder' ? "h-3 w-3" : "h-4 w-4", isWishlist && "fill-current")} />
                                        </Button>

                                        <div className="w-px h-4 bg-slate-800 mx-1" />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-full", variant === 'binder' ? "h-6 w-6" : "h-8 w-8")}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const defaultVariant = possibleVariants[0];
                                                const currentData = ownedData.get(defaultVariant);
                                                const currentQty = currentData?.quantity || 0;
                                                if (currentQty > 0) handleUpdate(defaultVariant, currentQty - 1);
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Minus className={cn(variant === 'binder' ? "h-3 w-3" : "h-4 w-4")} />
                                        </Button>

                                        <div className="text-center min-w-[20px]">
                                            <span className={cn("text-white font-mono font-bold leading-none", variant === 'binder' ? "text-sm" : "text-lg")}>
                                                {(ownedData.get(possibleVariants[0])?.quantity || 0)}
                                            </span>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("text-green-400 hover:text-green-300 hover:bg-green-950/50 rounded-full", variant === 'binder' ? "h-6 w-6" : "h-8 w-8")}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const defaultVariant = possibleVariants[0];
                                                const currentData = ownedData.get(defaultVariant);
                                                const currentQty = currentData?.quantity || 0;
                                                handleUpdate(defaultVariant, currentQty + 1);
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Plus className={cn(variant === 'binder' ? "h-3 w-3" : "h-4 w-4")} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Card Info - Hidden in binder mode */}
                            {variant === 'default' && (
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className={cn(
                                            "font-semibold text-sm truncate leading-tight flex-1",
                                            isOwned ? "text-white" : "text-slate-500"
                                        )}>
                                            {card.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-mono">
                                            {card.number}/{totalInSet}
                                        </span>
                                        {card.rarity && (
                                            <span className={cn(
                                                "text-xs truncate max-w-[60%] text-right",
                                                isSpecialRarity ? "text-yellow-500/80" : "text-slate-600"
                                            )}>
                                                {card.rarity}
                                            </span>
                                        )}
                                    </div>
                                    {showSetInfo && setName && (
                                        <p className="text-[10px] text-slate-600 truncate">{setName}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverTrigger>

                {/* Variants Popover */}
                <PopoverContent className="w-72 bg-slate-900 border-slate-700 text-white p-0 overflow-hidden shadow-2xl">
                    <div className="bg-slate-800/50 p-4 border-b border-slate-700">
                        <h4 className="font-bold text-base">{card.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{t("cardItem.manageVariants")}</p>
                    </div>

                    <div className="p-4 space-y-3">
                        {possibleVariants.map(variant => {
                            const data = ownedData.get(variant);
                            const quantity = data?.quantity || 0;
                            const itemId = data?.id;
                            const isActive = quantity > 0;

                            return (
                                <div
                                    key={variant}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl transition-colors",
                                        isActive ? "bg-slate-800/80" : "bg-slate-800/30"
                                    )}
                                >
                                    <span className={cn(
                                        "text-sm capitalize",
                                        isActive ? "text-white font-medium" : "text-slate-400"
                                    )}>
                                        {variant.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 border-slate-600 bg-slate-700 hover:bg-slate-600 rounded-lg"
                                            onClick={() => handleUpdate(variant, Math.max(0, quantity - 1))}
                                            disabled={isLoading || quantity === 0}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>

                                        <span className={cn(
                                            "w-6 text-center text-sm font-mono font-bold",
                                            isActive ? "text-white" : "text-slate-500"
                                        )}>
                                            {quantity}
                                        </span>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 border-slate-600 bg-slate-700 hover:bg-slate-600 rounded-lg"
                                            onClick={() => handleUpdate(variant, quantity + 1)}
                                            disabled={isLoading}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>

                                        {isActive && itemId && (
                                            <TagManager itemId={itemId} variantName={variant} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-slate-800/30 p-3 border-t border-slate-800">
                        <p className="text-center text-xs text-slate-500">
                            {t("cardItem.total")}: <span className="text-white font-bold">{totalOwned}</span> {t("cardItem.copies")}
                        </p>
                    </div>
                </PopoverContent>
            </Popover>

            <CardDetailModal
                open={detailOpen}
                onOpenChange={setDetailOpen}
                card={{
                    cardId: card.id,
                    cardName: card.name,
                    cardNumber: card.number,
                    setId: card.setId,
                    setName: setName,
                    cardImages: card.images,
                    cardRarity: card.rarity,
                    tcgplayerPrices: card.tcgplayerPrices,
                    cardmarketPrices: card.cardmarketPrices,
                    quantity: totalOwned
                }}
            />
        </>
    );
}
