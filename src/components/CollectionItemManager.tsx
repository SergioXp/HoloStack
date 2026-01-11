"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Plus, Minus, Sparkles } from "lucide-react";
import { updateCollectionItem } from "@/app/actions/collection";
import { getAvailableVariants } from "@/lib/card-utils";

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
    ownedVariants: Map<string, number>;
    totalInSet: number;
    showSetInfo?: boolean;
    setName?: string;
}

export default function CollectionItemManager({
    card,
    collectionId,
    ownedVariants,
    totalInSet,
    showSetInfo = false,
    setName
}: CollectionItemManagerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const totalOwned = Array.from(ownedVariants.values()).reduce((a, b) => a + b, 0);
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

    const handleUpdate = async (variant: string, newQuantity: number) => {
        setIsLoading(true);
        await updateCollectionItem(collectionId, card.id, variant, newQuantity);
        setIsLoading(false);
    };

    // Determinar rareza para efectos visuales
    const isSpecialRarity = card.rarity?.toLowerCase().includes('rare') ||
        card.rarity?.toLowerCase().includes('holo') ||
        card.rarity?.toLowerCase().includes('illustration') ||
        card.rarity?.toLowerCase().includes('ultra') ||
        card.rarity?.toLowerCase().includes('secret');

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group",
                        isOwned
                            ? "bg-slate-800/50"
                            : "bg-slate-900/30",
                        !isOwned && "grayscale opacity-50 hover:grayscale-0 hover:opacity-100",
                        isHovered && "scale-[1.03] z-10"
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {/* Glow Effect for Special Cards */}
                    {isOwned && isSpecialRarity && (
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10 z-0" />
                    )}

                    <div className="relative p-2">
                        {/* Owned Badge */}
                        {isOwned && (
                            <div className="absolute top-3 right-3 z-20">
                                <div className="flex items-center gap-1 bg-emerald-500 text-black px-2 py-0.5 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/30">
                                    {isSpecialRarity && <Sparkles className="h-3 w-3" />}
                                    {totalOwned}
                                </div>
                            </div>
                        )}

                        {/* Card Image */}
                        <div className={cn(
                            "relative aspect-[2.5/3.5] rounded-lg overflow-hidden mb-2 transition-all duration-300",
                            isHovered && "shadow-xl shadow-black/50"
                        )}>
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
                                    <span className="text-slate-500 text-xs">Sin imagen</span>
                                </div>
                            )}

                            {/* Quick Action Overlay */}
                            <div
                                className={cn(
                                    "absolute bottom-2 left-2 right-2 p-2 bg-slate-950/90 backdrop-blur-md rounded-xl",
                                    "transform transition-all duration-300 ease-out",
                                    "border border-white/10 shadow-xl",
                                    isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const defaultVariant = possibleVariants[0];
                                            const currentQty = ownedVariants.get(defaultVariant) || 0;
                                            if (currentQty > 0) handleUpdate(defaultVariant, currentQty - 1);
                                        }}
                                        disabled={isLoading}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>

                                    <div className="text-center">
                                        <span className="text-white font-mono font-bold text-lg leading-none">
                                            {ownedVariants.get(possibleVariants[0]) || 0}
                                        </span>
                                        <p className="text-slate-500 text-[9px] uppercase tracking-wider">
                                            {possibleVariants[0].replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-950/50 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const defaultVariant = possibleVariants[0];
                                            const currentQty = ownedVariants.get(defaultVariant) || 0;
                                            handleUpdate(defaultVariant, currentQty + 1);
                                        }}
                                        disabled={isLoading}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Card Info */}
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
                    </div>
                </div>
            </PopoverTrigger>

            {/* Variants Popover - Premium Style */}
            <PopoverContent className="w-72 bg-slate-900 border-slate-700 text-white p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-800/50 p-4 border-b border-slate-700">
                    <h4 className="font-bold text-base">{card.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Gestionar todas las variantes</p>
                </div>

                {/* Variants List */}
                <div className="p-4 space-y-3">
                    {possibleVariants.map(variant => {
                        const quantity = ownedVariants.get(variant) || 0;
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
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="bg-slate-800/30 p-3 border-t border-slate-800">
                    <p className="text-center text-xs text-slate-500">
                        Total: <span className="text-white font-bold">{totalOwned}</span> copias
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
