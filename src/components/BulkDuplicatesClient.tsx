"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, Layers, ArrowUpRight, Copy, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import CardDetailModal from "@/components/CardDetailModal";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CollectionOption {
    id: string;
    name: string;
    type: string;
}

interface DuplicateItem {
    itemId: string;
    cardId: string;
    variant: string;
    quantity: number;
    excess: number;
    card: {
        name: string;
        number: string;
        rarity: string;
        images: string;
        setId: string;
        tcgplayerPrices?: string;
        cardmarketPrices?: string;
    };
}

interface BulkDuplicatesClientProps {
    collections: CollectionOption[];
}

import { useI18n } from "@/lib/i18n";

export function BulkDuplicatesClient({ collections }: BulkDuplicatesClientProps) {
    const { t } = useI18n();
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || "");
    const [threshold, setThreshold] = useState<number>(4);
    const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCard, setSelectedCard] = useState<any>(null);

    useEffect(() => {
        if (!selectedCollectionId) return;
        fetchDuplicates();
    }, [selectedCollectionId, threshold]);

    const fetchDuplicates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/bulk/duplicates?collectionId=${selectedCollectionId}&threshold=${threshold}`);
            if (res.ok) {
                const data = await res.json();
                setDuplicates(data.duplicates || []);
            }
        } catch (error) {
            console.error("Error fetching duplicates", error);
        } finally {
            setIsLoading(false);
        }
    };

    const totalExcess = duplicates.reduce((acc, curr) => acc + curr.excess, 0);

    return (
        <div className="space-y-6">
            {selectedCard && (
                <CardDetailModal
                    card={selectedCard}
                    open={!!selectedCard}
                    onOpenChange={(open) => !open && setSelectedCard(null)}
                />
            )}

            {/* Controls */}
            <Card className="p-6 bg-slate-900/50 border-slate-800 backdrop-blur-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label className="text-slate-400">{t("bulk.duplicates.collectionLabel")}</Label>
                        <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                <SelectValue placeholder={t("bulk.duplicates.selectPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                {collections.map(col => (
                                    <SelectItem key={col.id} value={col.id}>
                                        {col.name} <span className="text-slate-500 text-xs">({col.type})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-400">{t("bulk.duplicates.thresholdLabel")}</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="number"
                                min={1}
                                max={50}
                                value={threshold}
                                onChange={(e) => setThreshold(parseInt(e.target.value) || 4)}
                                className="bg-slate-950 border-slate-800 text-white w-24"
                            />
                            <span className="text-xs text-slate-500">
                                {t("bulk.duplicates.thresholdHelp", { threshold: threshold })}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between border border-slate-700">
                        <span className="text-slate-400 text-sm">{t("bulk.duplicates.excessLabel")}</span>
                        <span className="text-2xl font-bold text-white">{totalExcess}</span>
                    </div>
                </div>
            </Card>

            {/* Results Grid */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : duplicates.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                        <div className="text-4xl mb-4">✨</div>
                        <h3 className="text-lg font-medium text-white">{t("bulk.duplicates.emptyState.title")}</h3>
                        <p className="text-slate-500">{t("bulk.duplicates.emptyState.description")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {duplicates.map((item) => {
                            const images = item.card.images ? JSON.parse(item.card.images) : {};

                            // Transform item.card for Modal (it expects certain structure)
                            const modalData = {
                                cardId: item.cardId,
                                cardName: item.card.name,
                                cardNumber: item.card.number,
                                cardRarity: item.card.rarity,
                                setId: item.card.setId,
                                setName: item.card.setId, // Fallback if name not available in this view
                                variant: item.variant,
                                quantity: item.quantity,
                                cardImages: item.card.images,
                                tcgplayerPrices: item.card.tcgplayerPrices,
                                cardmarketPrices: item.card.cardmarketPrices
                            };

                            return (
                                <Card key={item.itemId} className="bg-slate-900 border-slate-800 overflow-hidden group hover:border-slate-600 transition-colors flex flex-col">
                                    {/* Image Area */}
                                    <div
                                        className="relative aspect-[2.5/3.5] bg-slate-950 cursor-pointer overflow-hidden"
                                        onClick={() => setSelectedCard(modalData)}
                                    >
                                        {images.small ? (
                                            <Image
                                                src={images.small}
                                                alt={item.card.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                <Layers className="h-12 w-12" />
                                            </div>
                                        )}

                                        {/* Overlay Variant Badge */}
                                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                                            {item.variant !== 'normal' && (
                                                <Badge className={cn(
                                                    "text-[10px] uppercase h-5 px-1.5 shadow-lg",
                                                    item.variant === 'holofoil' ? "bg-yellow-500/90 hover:bg-yellow-500 text-black" : "bg-blue-500/90 hover:bg-blue-500 text-white"
                                                )}>
                                                    {item.variant === 'holofoil' ? 'Holo' : 'Rev'}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Quick View Overlay */}
                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                                            <Badge variant="secondary" className="gap-1 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md">
                                                <Eye className="w-3 h-3" /> {t("bulk.duplicates.manageView")}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-3 flex flex-col gap-2 flex-1">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-white text-sm line-clamp-1" title={item.card.name}>
                                                    {item.card.name}
                                                </h4>
                                                <span className="text-[10px] text-slate-500 font-mono">#{item.card.number}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <span>{t("bulk.duplicates.total")}: <span className="text-white font-medium">{item.quantity}</span></span>
                                                <span>•</span>
                                                <span className="text-orange-400">+{item.excess} {t("bulk.duplicates.extra")}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-2 border-t border-slate-800">
                                            <Link
                                                href={`/collections/${selectedCollectionId}?search=${encodeURIComponent(item.card.name)}`}
                                                className="flex items-center justify-center gap-2 text-xs w-full py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                {t("bulk.duplicates.manage")}
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
