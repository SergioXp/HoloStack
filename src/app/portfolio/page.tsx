"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    Loader2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    Layers,
    Award,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { formatPrice, getBestPrice, getAllPrices, getMarketUrl, type Currency } from "@/lib/prices";
import { CardDetailModal } from "@/components/CardDetailModal";

interface PortfolioCard {
    cardId: string;
    cardName: string;
    cardNumber: string;
    cardImages: string;
    cardRarity: string;
    setId: string;
    setName: string;
    variant: string;
    quantity: number;
    tcgplayerPrices: string | null;
    cardmarketPrices: string | null;
}

interface PortfolioStats {
    totalCards: number;
    uniqueCards: number;
    totalValue: number;
    topCards: {
        card: PortfolioCard;
        value: number;
        source: string | null;
    }[];
    byRarity: Record<string, { count: number; value: number }>;
    bySet: Record<string, { count: number; value: number }>;
}

export default function PortfolioPage() {
    const { t } = useI18n();
    const [items, setItems] = useState<PortfolioCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currency, setCurrency] = useState<Currency>("EUR");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [staleCount, setStaleCount] = useState(0);
    const [selectedCard, setSelectedCard] = useState<PortfolioCard | null>(null);



    // Función para cargar portfolio
    const loadPortfolio = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            // Primero cargar preferencias del usuario
            const profileRes = await fetch("/api/profile");
            if (profileRes.ok) {
                const profile = await profileRes.json();
                setCurrency((profile.preferredCurrency as Currency) || "EUR");
            }

            // Cargar portfolio completo desde la API
            const portfolioRes = await fetch("/api/portfolio");
            if (portfolioRes.ok) {
                const data = await portfolioRes.json();

                // Nuevo formato: {items, staleCardIds}
                const portfolioItems = data.items || (Array.isArray(data) ? data : []);
                setItems(portfolioItems);

                // Si hay precios obsoletos (>24h), refrescarlos
                if (data.staleCardIds && data.staleCardIds.length > 0) {
                    setStaleCount(data.staleCardIds.length);
                    setIsRefreshing(true);

                    try {
                        const refreshRes = await fetch("/api/prices/refresh", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ cardIds: data.staleCardIds }),
                        });

                        if (refreshRes.ok) {
                            // Esperar un momento y recargar los datos actualizados
                            await new Promise(resolve => setTimeout(resolve, 500));
                            const updatedRes = await fetch("/api/portfolio");
                            if (updatedRes.ok) {
                                const updatedData = await updatedRes.json();
                                const updatedItems = updatedData.items || (Array.isArray(updatedData) ? updatedData : []);
                                setItems(updatedItems);
                            }
                        }
                    } catch (error) {
                        console.error("Error refreshing prices:", error);
                    } finally {
                        setIsRefreshing(false);
                        setStaleCount(0);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading portfolio:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Cargar todas las cartas del usuario
    useEffect(() => {
        loadPortfolio();
    }, []);

    // Calcular estadísticas
    const stats = useMemo<PortfolioStats>(() => {
        let totalValue = 0;
        const byRarity: Record<string, { count: number; value: number }> = {};
        const bySet: Record<string, { count: number; value: number }> = {};
        const cardValues: { card: PortfolioCard; value: number; source: string | null }[] = [];
        const uniqueCardIds = new Set<string>();

        for (const item of items) {
            uniqueCardIds.add(`${item.cardId}-${item.variant}`);

            const priceInfo = getBestPrice(
                item.tcgplayerPrices,
                item.cardmarketPrices,
                item.variant as any,
                currency
            );
            const itemValue = priceInfo ? priceInfo.price * item.quantity : 0;
            totalValue += itemValue;

            cardValues.push({ card: item, value: priceInfo?.price || 0, source: priceInfo?.source || null });

            // Por rareza
            if (!byRarity[item.cardRarity]) {
                byRarity[item.cardRarity] = { count: 0, value: 0 };
            }
            byRarity[item.cardRarity].count += item.quantity;
            byRarity[item.cardRarity].value += itemValue;

            // Por set
            if (!bySet[item.setName]) {
                bySet[item.setName] = { count: 0, value: 0 };
            }
            bySet[item.setName].count += item.quantity;
            bySet[item.setName].value += itemValue;
        }

        // Top 10 cartas más valiosas
        cardValues.sort((a, b) => b.value - a.value);
        const topCards = cardValues.slice(0, 10);

        return {
            totalCards: items.reduce((acc, i) => acc + i.quantity, 0),
            uniqueCards: uniqueCardIds.size,
            totalValue,
            topCards,
            byRarity,
            bySet,
        };
    }, [items, currency]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
                    <p className="text-slate-400">{t("portfolio.loading")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-400" />
                        {t("portfolio.title")}
                    </h1>
                    {/* Indicador de actualización de precios */}
                    {isRefreshing && (
                        <div className="flex items-center gap-2 text-amber-400 text-sm animate-pulse">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Actualizando {staleCount} precio{staleCount !== 1 ? "s" : ""}...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {(["EUR", "USD", "GBP"] as Currency[]).map((curr) => (
                        <Button
                            key={curr}
                            variant={currency === curr ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrency(curr)}
                            className={currency === curr
                                ? "bg-emerald-600 hover:bg-emerald-500"
                                : "border-slate-700 text-slate-400"
                            }
                        >
                            {curr}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-400" />
                                {t("portfolio.totalValue")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">
                                {formatPrice(stats.totalValue, currency)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-blue-400" />
                                {t("portfolio.totalCards")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">{stats.totalCards}</p>
                            <p className="text-sm text-slate-500">{stats.uniqueCards} {t("portfolio.unique")}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                                <Award className="h-4 w-4 text-purple-400" />
                                {t("portfolio.avgCardValue")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">
                                {formatPrice(stats.uniqueCards > 0 ? stats.totalValue / stats.uniqueCards : 0, currency)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-amber-400" />
                                {t("portfolio.setsOwned")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-white">{Object.keys(stats.bySet).length}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Cards */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                            {t("portfolio.topCards")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.topCards.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">{t("portfolio.noCards")}</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {stats.topCards.map(({ card, value, source }, index) => {
                                    const images = card.cardImages ? JSON.parse(card.cardImages) : {};
                                    const allPrices = getAllPrices(
                                        card.tcgplayerPrices,
                                        card.cardmarketPrices,
                                        card.variant as any
                                    );
                                    return (
                                        <div
                                            key={`${card.cardId}-${card.variant}-${index}`}
                                            className="relative group cursor-pointer"
                                            onClick={() => setSelectedCard(card)}
                                        >
                                            <div className="aspect-[63/88] rounded-lg overflow-hidden bg-slate-800 relative transition-transform group-hover:scale-105">
                                                {images.small && (
                                                    <Image
                                                        src={images.small}
                                                        alt={card.cardName}
                                                        fill
                                                        className="object-cover"
                                                        sizes="150px"
                                                    />
                                                )}
                                                {/* Rank Badge */}
                                                <div className="absolute top-1 left-1 bg-linear-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                                    #{index + 1}
                                                </div>
                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-xs font-medium">Ver detalle</span>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <p className="text-sm font-medium text-white truncate">{card.cardName}</p>
                                                <p className="text-xs text-slate-400 mb-1">{card.setName}</p>
                                                {/* Precios con links */}
                                                <div className="flex flex-col gap-0.5 text-xs">
                                                    {allPrices.cardmarket !== null && (
                                                        <a
                                                            href={getMarketUrl("cardmarket", card.cardName)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300 hover:underline"
                                                        >
                                                            CM: €{allPrices.cardmarket.toFixed(2)}
                                                        </a>
                                                    )}
                                                    {allPrices.tcgplayer !== null && (
                                                        <a
                                                            href={getMarketUrl("tcgplayer", card.cardName)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-purple-400 hover:text-purple-300 hover:underline"
                                                        >
                                                            TCG: ${allPrices.tcgplayer.toFixed(2)}
                                                        </a>
                                                    )}
                                                    {allPrices.cardmarket === null && allPrices.tcgplayer === null && (
                                                        <span className="text-slate-500">Sin precio</span>
                                                    )}
                                                </div>
                                                {card.quantity > 1 && (
                                                    <Badge variant="secondary" className="text-xs mt-1">x{card.quantity}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Value by Rarity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white">{t("portfolio.byRarity")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(stats.byRarity)
                                    .sort((a, b) => b[1].value - a[1].value)
                                    .slice(0, 8)
                                    .map(([rarity, data]) => (
                                        <div key={rarity} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-300">{rarity}</span>
                                                <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                                                    {data.count}
                                                </Badge>
                                            </div>
                                            <span className="text-emerald-400 font-medium">{formatPrice(data.value, currency)}</span>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800">
                        <CardHeader>
                            <CardTitle className="text-white">{t("portfolio.bySet")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(stats.bySet)
                                    .sort((a, b) => b[1].value - a[1].value)
                                    .slice(0, 8)
                                    .map(([setName, data]) => (
                                        <div key={setName} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-slate-300 truncate">{setName}</span>
                                                <Badge variant="outline" className="text-xs border-slate-700 text-slate-500 shrink-0">
                                                    {data.count}
                                                </Badge>
                                            </div>
                                            <span className="text-emerald-400 font-medium shrink-0 ml-2">{formatPrice(data.value, currency)}</span>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal de detalle de carta */}
            <CardDetailModal
                card={selectedCard}
                open={!!selectedCard}
                onOpenChange={(open) => !open && setSelectedCard(null)}
                currency={currency}
            />
        </div>
    );
}
