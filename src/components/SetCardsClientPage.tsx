"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Layers, Heart } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

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
                                    <div className="relative h-16 w-48 flex-shrink-0">
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
                                    <div className="relative h-12 w-12 flex-shrink-0 bg-slate-800/50 rounded-xl p-2">
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
                    <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
                        <DialogContent className="bg-slate-950 border-slate-800 text-white sm:max-w-5xl w-full p-0 overflow-hidden shadow-2xl">
                            {selectedCard && (
                                <div className="flex flex-col md:flex-row max-h-[90vh]">
                                    {/* Left Column: Image */}
                                    <div className="bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-8 flex items-center justify-center md:w-2/5 relative overflow-hidden">
                                        {/* Background Glow */}
                                        <div className="absolute inset-0 opacity-30">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
                                        </div>

                                        {(() => {
                                            const imgs = selectedCard.images ? JSON.parse(selectedCard.images) : null;
                                            return imgs?.large || imgs?.small ? (
                                                <div className="relative group">
                                                    <div className="relative h-[420px] w-[300px] rounded-xl overflow-hidden shadow-2xl shadow-black/50 transition-transform duration-500 group-hover:scale-105">
                                                        <Image
                                                            src={imgs.large || imgs.small}
                                                            alt={selectedCard.name}
                                                            fill
                                                            className="object-contain"
                                                            sizes="300px"
                                                            priority
                                                        />
                                                    </div>
                                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-8 bg-linear-to-t from-purple-500/10 to-transparent blur-xl" />
                                                </div>
                                            ) : (
                                                <div className="h-[400px] w-[280px] bg-slate-800 flex items-center justify-center rounded-xl border border-slate-700">
                                                    <span className="text-slate-500">{t("cardItem.noImage")}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Right Column: Info */}
                                    <div className="p-8 md:w-3/5 overflow-y-auto max-h-[80vh] bg-slate-900/50">
                                        <DialogHeader className="mb-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <DialogTitle className="text-3xl font-bold mb-2 text-white leading-tight">
                                                        {selectedCard.name}
                                                    </DialogTitle>
                                                    <DialogDescription className="text-slate-400 text-base flex flex-wrap items-center gap-2">
                                                        <Badge className="bg-slate-800 text-slate-300 border-0">
                                                            {selectedCard.supertype}
                                                        </Badge>
                                                        {selectedCard.subtypes && JSON.parse(selectedCard.subtypes).map((st: string) => (
                                                            <Badge key={st} variant="outline" className="border-slate-700 text-slate-400">
                                                                {st}
                                                            </Badge>
                                                        ))}
                                                    </DialogDescription>
                                                    {selectedCard.evolvesFrom && (
                                                        <p className="text-sm text-blue-400 mt-2 flex items-center gap-1">
                                                            <span>↩</span> {t("cardDetail.evolvesFrom")} <span className="font-semibold">{selectedCard.evolvesFrom}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedCard.hp && (
                                                    <div className="text-right shrink-0">
                                                        <div className="text-4xl font-black text-red-500 leading-none">{selectedCard.hp}</div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wider">HP</div>
                                                    </div>
                                                )}
                                            </div>
                                        </DialogHeader>

                                        {/* Flavor Text */}
                                        {selectedCard.flavorText && (
                                            <div className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-purple-500 mb-6 italic text-slate-300 text-sm leading-relaxed">
                                                &quot;{selectedCard.flavorText}&quot;
                                            </div>
                                        )}

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="bg-slate-800/40 rounded-xl p-4">
                                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("cardDetail.number")}</h4>
                                                <p className="font-bold text-white text-lg">{selectedCard.number}/{set.total}</p>
                                            </div>
                                            <div className="bg-slate-800/40 rounded-xl p-4">
                                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("cardDetail.rarity")}</h4>
                                                {selectedCard.rarity ? (
                                                    <Badge className="bg-linear-to-r from-yellow-600/20 to-orange-600/20 text-yellow-300 border border-yellow-600/30">
                                                        {selectedCard.rarity}
                                                    </Badge>
                                                ) : <span className="text-slate-500">-</span>}
                                            </div>
                                            <div className="bg-slate-800/40 rounded-xl p-4">
                                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("cardDetail.artist")}</h4>
                                                <p className="text-white text-sm">{selectedCard.artist || t("cardDetail.unknown")}</p>
                                            </div>
                                            <div className="bg-slate-800/40 rounded-xl p-4">
                                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-1">{t("cardDetail.types")}</h4>
                                                <div className="flex gap-1 flex-wrap">
                                                    {selectedCard.types ? JSON.parse(selectedCard.types).map((t: string) => (
                                                        <Badge key={t} className="bg-slate-700 text-slate-200 text-xs">{t}</Badge>
                                                    )) : <span className="text-slate-500">N/A</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Prices Section */}
                                        <div className="border-t border-slate-800 pt-6">
                                            <h4 className="text-white font-bold mb-4 flex items-center gap-2 text-lg">
                                                <span className="text-xl">💰</span> {t("cardDetail.marketPrices")}
                                            </h4>

                                            <div className="space-y-3">
                                                {selectedCard.tcgplayerPrices && (() => {
                                                    try {
                                                        const prices = JSON.parse(selectedCard.tcgplayerPrices);
                                                        return Object.entries(prices).map(([type, data]: [string, any]) => {
                                                            if (!data || !data.market) return null;
                                                            return (
                                                                <div key={type} className="bg-linear-to-r from-green-950/40 to-emerald-950/20 border border-green-700/30 p-4 rounded-xl flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-green-400 font-bold">TCGPlayer</span>
                                                                        <Badge variant="outline" className="text-xs border-green-600/50 text-green-300/80 capitalize">
                                                                            {type.replace(/([A-Z])/g, ' $1').trim()}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-2xl font-bold text-white">${data.market?.toFixed(2)}</p>
                                                                        <p className="text-xs text-slate-500">{t("cardDetail.market")}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    } catch { return null; }
                                                })()}

                                                {selectedCard.cardmarketPrices && (() => {
                                                    try {
                                                        const prices = JSON.parse(selectedCard.cardmarketPrices);
                                                        return (
                                                            <div className="bg-linear-to-r from-blue-950/40 to-cyan-950/20 border border-blue-700/30 p-4 rounded-xl flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-blue-400 font-bold">Cardmarket</span>
                                                                    <Badge variant="outline" className="text-xs border-blue-600/50 text-blue-300/80">
                                                                        Trend
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-bold text-white">€{prices.trendPrice?.toFixed(2)}</p>
                                                                    <p className="text-xs text-slate-500">{t("cardDetail.trend")}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    } catch { return null; }
                                                })()}

                                                {!selectedCard.tcgplayerPrices && !selectedCard.cardmarketPrices && (
                                                    <div className="text-center py-6 text-slate-500 bg-slate-800/30 rounded-xl">
                                                        <p className="text-sm">{t("cardDetail.noPrices")}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-8 pt-6 border-t border-slate-800">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button variant="outline" className="h-12 bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-white rounded-xl">
                                                    🌐 {t("cardDetail.viewOnTCGPlayer")}
                                                </Button>
                                                <Button className="h-12 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl">
                                                    ➕ {t("cardDetail.addToCollection")}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
