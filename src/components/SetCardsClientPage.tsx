"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Layers, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CardDetailModal } from "@/components/CardDetailModal";

interface CardData {
    id: string;
    name: string;
    number: string;
    rarity: string | null;
    images: string | null;
    supertype: string | null;
    subtypes: string | null;
    types: string | null;
    hp: string | null;
    artist: string | null;
    evolvesFrom: string | null;
    flavorText?: string | null;
    tcgplayerPrices?: string | null;
    cardmarketPrices?: string | null;
}

interface SetData {
    id: string;
    name: string;
    series: string;
    total: number;
    images: string | null;
    releaseDate: string | null;
}

interface PageProps {
    setKeywords: SetData;
    cards: CardData[];
}

export default function SetCardsClientPage({ setKeywords: set, cards }: PageProps) {
    const { t, locale } = useI18n();
    const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [ownership, setOwnership] = useState<Record<string, number>>({});

    useEffect(() => {
        // Fetch wishlist
        fetch("/api/wishlist")
            .then(res => res.json())
            .then((data: any[]) => {
                if (Array.isArray(data)) {
                    setWishlist(new Set(data.map(item => item.cardId)));
                }
            })
            .catch(console.error);

        // Fetch ownership
        fetch("/api/collection/ownership")
            .then(res => res.json())
            .then(data => setOwnership(data))
            .catch(console.error);
    }, []);

    const toggleWishlist = async (e: React.MouseEvent, cardId: string) => {
        e.stopPropagation();
        const isInWishlist = wishlist.has(cardId);

        // Optimistic update
        const newWishlist = new Set(wishlist);
        if (isInWishlist) {
            newWishlist.delete(cardId);
        } else {
            newWishlist.add(cardId);
        }
        setWishlist(newWishlist);

        try {
            if (isInWishlist) {
                await fetch(`/api/wishlist?cardId=${cardId}`, { method: "DELETE" });
            } else {
                await fetch("/api/wishlist", {
                    method: "POST",
                    body: JSON.stringify({ cardId }),
                });
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error);
            // Revert on error
            setWishlist(wishlist);
        }
    };

    const setImages = set.images ? JSON.parse(set.images) : null;

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-b from-purple-900/10 via-slate-950 to-slate-950" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <Link
                            href={`/explorer/${encodeURIComponent(set.series)}`}
                            className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("explorer.set.backToSeries", { series: set.series })}
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            {/* Set Logo & Symbol */}
                            <div className="flex items-center gap-4">
                                {setImages?.logo && (
                                    <div className="relative h-16 w-48 shrink-0">
                                        <Image
                                            src={setImages.logo}
                                            alt={`${set.name} logo`}
                                            fill
                                            className="object-contain object-left"
                                            sizes="192px"
                                        />
                                    </div>
                                )}
                                {setImages?.symbol && (
                                    <div className="relative h-12 w-12 shrink-0 bg-slate-800/50 rounded-xl p-2">
                                        <Image
                                            src={setImages.symbol}
                                            alt={`${set.name} symbol`}
                                            fill
                                            className="object-contain p-1"
                                            sizes="48px"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                        <Layers className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-white tracking-tight">
                                            {set.name}
                                        </h1>
                                        <p className="text-slate-400">
                                            {t("explorer.set.cardsCount", { count: cards.length, total: set.total })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-3">
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 backdrop-blur-sm text-center">
                                    <span className="text-xl font-bold text-white">{cards.length}</span>
                                    <span className="text-slate-400 ml-2 text-sm">{t("common.cards")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    {cards.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {cards.map((card) => {
                                const cardImages = typeof card.images === "string"
                                    ? JSON.parse(card.images)
                                    : card.images;

                                const isSpecialRarity = card.rarity?.toLowerCase().includes('rare') ||
                                    card.rarity?.toLowerCase().includes('holo') ||
                                    card.rarity?.toLowerCase().includes('illustration') ||
                                    card.rarity?.toLowerCase().includes('ultra');

                                return (
                                    <Card
                                        key={card.id}
                                        className="border-slate-800 bg-slate-900/50 overflow-hidden group hover:scale-[1.03] hover:border-slate-600 transition-all duration-300 cursor-pointer backdrop-blur-sm hover:shadow-xl hover:shadow-purple-900/10"
                                        onClick={() => setSelectedCard(card)}
                                    >
                                        <CardContent className="p-2">
                                            {/* Card Image */}
                                            <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden mb-2">
                                                {cardImages?.small ? (
                                                    <Image
                                                        src={cardImages.small}
                                                        alt={card.name}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-1">
                                                        <span className="text-3xl">🃏</span>
                                                        <span className="text-slate-500 text-xs">{t("cardItem.noImage")}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Info */}
                                            <div className="space-y-1.5">
                                                <p className="text-white text-sm font-semibold truncate group-hover:text-purple-300 transition-colors" title={card.name}>
                                                    {card.name}
                                                </p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 font-mono">
                                                        {card.number}/{set.total}
                                                    </span>
                                                    {card.rarity && (
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-[9px] px-1.5 py-0 h-4 border-0 ${isSpecialRarity
                                                                ? "bg-yellow-600/20 text-yellow-300"
                                                                : "bg-slate-800 text-slate-400"
                                                                }`}
                                                        >
                                                            {card.rarity}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-white text-black hover:bg-slate-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCard(card);
                                                    }}
                                                >
                                                    Agregar a Colección
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className={`w-full ${wishlist.has(card.id) ? 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/30' : 'bg-slate-800/80 text-white hover:bg-slate-800'}`}
                                                    onClick={(e) => toggleWishlist(e, card.id)}
                                                >
                                                    <Heart className={`h-4 w-4 mr-2 ${wishlist.has(card.id) ? "fill-pink-500 text-pink-500" : ""}`} />
                                                    {wishlist.has(card.id) ? "En Wishlist" : "Wishlist"}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                            <div className="text-5xl mb-4">📦</div>
                            <h3 className="text-xl font-bold text-white mb-2">{t("explorer.set.noCards.title")}</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                {t("explorer.set.noCards.description")}
                            </p>
                        </div>
                    )}

                    {/* Card Detail Modal */}
                    <CardDetailModal
                        open={!!selectedCard}
                        onOpenChange={(open) => !open && setSelectedCard(null)}
                        card={selectedCard ? {
                            cardId: selectedCard.id,
                            cardName: selectedCard.name,
                            cardNumber: selectedCard.number,
                            cardImages: selectedCard.images || undefined,
                            cardRarity: selectedCard.rarity || undefined,
                            setId: set.id,
                            setName: set.name,
                            tcgplayerPrices: selectedCard.tcgplayerPrices,
                            cardmarketPrices: selectedCard.cardmarketPrices,
                            quantity: ownership[selectedCard.id] || 0,
                        } : null}
                        onWishlistChange={(isInWishlist) => {
                            if (selectedCard) {
                                const newWishlist = new Set(wishlist);
                                if (isInWishlist) {
                                    newWishlist.add(selectedCard.id);
                                } else {
                                    newWishlist.delete(selectedCard.id);
                                }
                                setWishlist(newWishlist);
                            }
                        }}
                        relatedCards={selectedCard ? cards
                            .filter(c => c.id !== selectedCard.id && (c.rarity === selectedCard.rarity || Math.random() > 0.7))
                            .slice(0, 6)
                            .map(c => ({
                                id: c.id,
                                name: c.name,
                                image: c.images ? JSON.parse(c.images).small : "",
                                rarity: c.rarity || undefined
                            })) : []}
                        onSelectRelated={(related) => {
                            const fullCard = cards.find(c => c.id === related.id);
                            if (fullCard) setSelectedCard(fullCard);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
