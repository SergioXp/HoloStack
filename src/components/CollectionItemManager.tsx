"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateCollectionItem } from "@/app/actions/collection";
import { getAvailableVariants } from "@/lib/card-utils";
import { useI18n } from "@/lib/i18n";
import { TagManager } from "@/components/TagManager";
import { CardDetailModal, CardDetailTrigger } from "./CardDetailModal";
import { convertCurrency, formatPrice, type Currency } from "@/lib/prices";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Sparkles, Heart, CheckCircle2, Circle, Pencil, Save, X } from "lucide-react";

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
    ownedData: Map<string, { quantity: number; id: string; notes?: string | null }>;
    totalInSet: number;
    showSetInfo?: boolean;
    setName?: string;
    onUpdate?: (variant: string, quantity: number, notes?: string | null) => void;
    isInWishlist?: boolean;
    onToggleWishlist?: (cardId: string) => void;
    variant?: 'default' | 'binder' | 'minimal';
    showPrices?: boolean;
    userCurrency?: Currency;
    isEditMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: () => void;
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
    onToggleWishlist,
    showPrices,
    userCurrency = "EUR",
    isEditMode = false,
    isSelected = false,
    onToggleSelection
}: CollectionItemManagerProps) {
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [editingNotes, setEditingNotes] = useState<string | null>(null); // variant name if editing
    const [notesValue, setNotesValue] = useState("");

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

    const handleUpdate = async (variantName: string, newQuantity: number, notes?: string | null) => {
        // Optimistic update via callback if provided
        if (onUpdate) {
            onUpdate(variantName, newQuantity, notes);
        }

        setIsLoading(true);
        try {
            await updateCollectionItem(collectionId, card.id, variantName, newQuantity, notes);
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

    const renderPrice = () => {
        try {
            let price: number | null = null;
            let sourceCurrency: Currency = "USD";

            // Try TCGPlayer prices first (USD)
            const tcgPrices = typeof card.tcgplayerPrices === 'string'
                ? JSON.parse(card.tcgplayerPrices)
                : card.tcgplayerPrices;

            const tcgPrice = tcgPrices?.marketPrice ||
                tcgPrices?.holofoil?.marketPrice ||
                tcgPrices?.normal?.marketPrice ||
                tcgPrices?.reverseHolofoil?.marketPrice;

            if (tcgPrice > 0) {
                price = tcgPrice;
                sourceCurrency = "USD";
            } else {
                // If no TCGPlayer price, try Cardmarket (EUR)
                const cmPrices = typeof card.cardmarketPrices === 'string'
                    ? JSON.parse(card.cardmarketPrices)
                    : card.cardmarketPrices;

                const cmPrice = cmPrices?.avg || cmPrices?.trend || cmPrices?.low;

                if (cmPrice > 0) {
                    price = cmPrice;
                    sourceCurrency = "EUR";
                }
            }

            if (price && price > 0) {
                // Convert to user's preferred currency
                const converted = convertCurrency(price, sourceCurrency, userCurrency);
                return (
                    <span className="text-emerald-400">
                        {formatPrice(converted, userCurrency)}
                    </span>
                );
            }

            return null;
        } catch (e) {
            return null;
        }
    };

    const renderTrigger = () => {
        if (variant === 'minimal') {
            return (
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white border-slate-700 shadow-xl backdrop-blur-md transition-all hover:scale-110"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                    }}
                    title={t("cardItem.manageVariants")}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            );
        }

        return (
            <div
                className={cn(
                    "relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group",
                    isOwned
                        ? "bg-secondary/50 border-primary/20"
                        : "bg-muted/30 border-transparent",
                    !isOwned && "grayscale opacity-50 hover:grayscale-0 hover:opacity-100",
                    isHovered && !isEditMode && "scale-[1.03] z-10",
                    isEditMode && isSelected ? "ring-2 ring-blue-500 scale-95 opacity-100 grayscale-0" : "",
                    isEditMode && !isSelected ? "opacity-60 hover:opacity-100" : "",
                    variant === 'binder' ? "h-full w-full border-0 rounded-md bg-transparent m-0 p-0" : ""
                )}
                onMouseEnter={() => !isEditMode && setIsHovered(true)}
                onMouseLeave={() => !isEditMode && setIsHovered(false)}
                onClick={(e) => {
                    if (isEditMode) {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleSelection?.();
                    }
                }}
            >
                {/* Edit Mode Selection Indicator */}
                {isEditMode && (
                    <div className="absolute top-2 right-2 z-30">
                        {isSelected ? (
                            <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                                <CheckCircle2 className="h-5 w-5 fill-current" />
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 text-slate-400 rounded-full p-1 border border-slate-600">
                                <Circle className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                )}
                {/* Glow Effect for Special Cards */}
                {isOwned && isSpecialRarity && variant !== 'binder' && (
                    <div className="absolute inset-0 bg-linear-to-br from-yellow-500/10 via-transparent to-purple-500/10 z-0" />
                )}

                <div className={cn("relative", variant === 'default' && "p-2", variant === 'binder' && "h-full p-0 flex items-center justify-center")}>
                    {/* Card Image */}
                    <div className={cn(
                        "relative overflow-hidden transition-all duration-300",
                        variant === 'default' && "aspect-[2.5/3.5] rounded-lg mb-2",
                        variant === 'binder' && "aspect-63/88 h-full w-auto max-w-full mx-auto rounded-sm shadow-md",
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

                        {/* Quick Action Overlay (Hidden in Edit Mode) */}
                        {!isEditMode && (
                            <div
                                className={cn(
                                    "absolute bg-slate-950/90 backdrop-blur-md rounded-xl transition-all duration-300 ease-out border border-white/10 shadow-xl",
                                    variant === 'binder' ? "bottom-2 left-2 right-2 p-1.5" : "bottom-2 left-2 right-2 p-2",
                                    isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <CardDetailTrigger
                                        onClick={() => setDetailOpen(true)}
                                        className={cn("bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white", variant === 'binder' ? "h-6 w-6" : "h-8 w-8")}
                                    />
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
                        )}
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
                            {showPrices && (
                                <div className="text-[10px] font-mono mt-0.5">
                                    {renderPrice()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <Popover open={!isEditMode && isOpen} onOpenChange={!isEditMode ? setIsOpen : undefined}>
                <PopoverTrigger asChild>
                    {renderTrigger()}
                </PopoverTrigger>

                <PopoverContent className="w-72 bg-slate-900 border-slate-700 text-white p-0 overflow-hidden shadow-2xl">
                    <div className="bg-slate-800/50 p-4 border-b border-slate-700">
                        <h4 className="font-bold text-base">{card.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{t("cardItem.manageVariants")}</p>
                    </div>

                    <div className="p-4 space-y-3">
                        {possibleVariants.map(v => {
                            const data = ownedData.get(v);
                            const quantity = data?.quantity || 0;
                            const itemId = data?.id;
                            const isActive = quantity > 0;

                            return (
                                <div
                                    key={v}
                                    className={cn(
                                        "p-3 rounded-xl transition-colors space-y-3",
                                        isActive ? "bg-slate-800/80" : "bg-slate-800/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-sm",
                                            isActive ? "text-white font-medium" : "text-slate-400"
                                        )}>
                                            {t(`variants.${v}`) || v}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7 border-slate-600 bg-slate-700 hover:bg-slate-600 rounded-lg"
                                                onClick={() => handleUpdate(v, Math.max(0, quantity - 1), data?.notes)}
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
                                                onClick={() => handleUpdate(v, quantity + 1, data?.notes)}
                                                disabled={isLoading}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>

                                            {isActive && itemId && (
                                                <TagManager itemId={itemId} variantName={v} />
                                            )}
                                        </div>
                                    </div>

                                    {isActive && (
                                        <div className="pt-2 border-t border-slate-700/50">
                                            {editingNotes === v ? (
                                                <div className="space-y-2">
                                                    <Textarea
                                                        value={notesValue}
                                                        onChange={(e) => setNotesValue(e.target.value)}
                                                        placeholder={t("collectionDetail.notesPlaceholder") || "Notas privadas..."}
                                                        className="min-h-[60px] text-xs bg-slate-900 border-slate-700 text-white"
                                                        autoFocus
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 px-2 text-[10px] text-slate-400"
                                                            onClick={() => setEditingNotes(null)}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            {t("common.cancel")}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-7 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-500"
                                                            onClick={async () => {
                                                                await handleUpdate(v, quantity, notesValue);
                                                                setEditingNotes(null);
                                                            }}
                                                        >
                                                            <Save className="h-3 w-3 mr-1" />
                                                            {t("common.save")}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="group/note flex items-start justify-between gap-2 cursor-pointer hover:bg-slate-700/30 p-1.5 rounded-lg transition-colors"
                                                    onClick={() => {
                                                        setEditingNotes(v);
                                                        setNotesValue(data?.notes || "");
                                                    }}
                                                >
                                                    <p className={cn(
                                                        "text-[10px] flex-1 line-clamp-2 italic",
                                                        data?.notes ? "text-slate-300" : "text-slate-500"
                                                    )}>
                                                        {data?.notes || t("collectionDetail.addNotes") || "Añadir notas..."}
                                                    </p>
                                                    <Pencil className="h-3 w-3 text-slate-500 opacity-0 group-hover/note:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                    quantity: totalOwned,
                    notesMap: Object.fromEntries(
                        Array.from(ownedData.entries()).map(([variantName, data]) => [variantName, data.notes || null])
                    )
                }}
            />
        </>
    );
}
