"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ExternalLink,
    TrendingUp,
    TrendingDown,
    Package,
    Calendar,
    Sparkles,
    Hash,
    Layers,
    Search
} from "lucide-react";
import { getAllPrices, getMarketUrl, formatPrice, type Currency } from "@/lib/prices";
import { formatPriceAge } from "@/lib/price-refresh";

interface CardData {
    cardId: string;
    cardName: string;
    cardNumber?: string;
    cardImages?: string;
    cardRarity?: string;
    setId?: string;
    setName?: string;
    variant?: string;
    quantity?: number;
    tcgplayerPrices?: string | null;
    cardmarketPrices?: string | null;
}

interface CardDetailModalProps {
    card: CardData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currency?: Currency;
}

// Componente de botón para abrir el modal (lupa)
export function CardDetailTrigger({
    onClick,
    className = ""
}: {
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all ${className}`}
            title="Ver detalles"
        >
            <Search className="h-4 w-4" />
        </button>
    );
}

export function CardDetailModal({
    card,
    open,
    onOpenChange,
    currency = "EUR"
}: CardDetailModalProps) {
    const [activeTab, setActiveTab] = useState("info");

    if (!card) return null;

    const images = card.cardImages ? JSON.parse(card.cardImages) : {};
    const allPrices = getAllPrices(
        card.tcgplayerPrices,
        card.cardmarketPrices,
        (card.variant || "normal") as any
    );

    // Parsear datos adicionales de precios
    let cmData: any = null;
    let tcgData: any = null;

    try {
        if (card.cardmarketPrices) cmData = JSON.parse(card.cardmarketPrices);
    } catch { }
    try {
        if (card.tcgplayerPrices) tcgData = JSON.parse(card.tcgplayerPrices);
    } catch { }

    const priceAge = formatPriceAge(card.cardmarketPrices || card.tcgplayerPrices);

    // Calcular tendencia (si avg7 < avg30 está subiendo)
    const trend = cmData?.avg7 && cmData?.avg30
        ? cmData.avg7 > cmData.avg30 ? "up" : cmData.avg7 < cmData.avg30 ? "down" : "stable"
        : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                        {card.cardName}
                        {card.cardRarity && (
                            <Badge variant="outline" className="text-xs border-slate-600">
                                {card.cardRarity}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Imagen de la carta */}
                    <div className="flex justify-center">
                        <div className="relative w-64 aspect-[63/88] rounded-xl overflow-hidden shadow-2xl">
                            {images.large || images.small ? (
                                <Image
                                    src={images.large || images.small}
                                    alt={card.cardName}
                                    fill
                                    className="object-cover"
                                    sizes="256px"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <Package className="h-12 w-12 text-slate-600" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Información y precios */}
                    <div className="space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid grid-cols-2 bg-slate-800">
                                <TabsTrigger value="info" className="data-[state=active]:bg-emerald-600">
                                    Información
                                </TabsTrigger>
                                <TabsTrigger value="prices" className="data-[state=active]:bg-emerald-600">
                                    Precios
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="mt-4 space-y-3">
                                {/* Info básica */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                            <Layers className="h-4 w-4" />
                                            Set
                                        </div>
                                        <p className="font-medium">{card.setName || card.setId || "-"}</p>
                                    </div>
                                    <div className="p-3 bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                            <Hash className="h-4 w-4" />
                                            Número
                                        </div>
                                        <p className="font-medium">{card.cardNumber || "-"}</p>
                                    </div>
                                </div>

                                {card.variant && (
                                    <div className="p-3 bg-slate-800/50 rounded-lg">
                                        <div className="text-slate-400 text-sm mb-1">Variante</div>
                                        <Badge className="bg-purple-600">{card.variant}</Badge>
                                    </div>
                                )}

                                {card.quantity !== undefined && card.quantity > 0 && (
                                    <div className="p-3 bg-emerald-800/30 border border-emerald-700/50 rounded-lg">
                                        <div className="text-emerald-400 text-sm mb-1">En tu colección</div>
                                        <p className="text-2xl font-bold text-emerald-400">
                                            {card.quantity} {card.quantity === 1 ? "copia" : "copias"}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="prices" className="mt-4 space-y-3">
                                {/* Precios */}
                                <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        Última actualización: {priceAge}
                                    </span>
                                    {trend && (
                                        <span className={`flex items-center gap-1 ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400"}`}>
                                            {trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            {trend === "up" ? "Subiendo" : "Bajando"}
                                        </span>
                                    )}
                                </div>

                                {/* Cardmarket */}
                                {allPrices.cardmarket !== null && (
                                    <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-blue-400">Cardmarket</span>
                                            <a
                                                href={getMarketUrl("cardmarket", card.cardName)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                                            >
                                                Ver en web <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div>
                                                <div className="text-slate-400 text-xs">Mínimo</div>
                                                <div className="font-bold text-lg">€{cmData?.low?.toFixed(2) || "-"}</div>
                                            </div>
                                            <div className="bg-blue-800/30 rounded p-1">
                                                <div className="text-slate-400 text-xs">Tendencia</div>
                                                <div className="font-bold text-lg text-blue-400">
                                                    €{allPrices.cardmarket.toFixed(2)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-slate-400 text-xs">Media</div>
                                                <div className="font-bold text-lg">€{cmData?.avg?.toFixed(2) || "-"}</div>
                                            </div>
                                        </div>
                                        {cmData?.avg30 && (
                                            <div className="mt-2 text-center text-sm text-slate-400">
                                                Media 30 días: €{cmData.avg30.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TCGPlayer */}
                                {allPrices.tcgplayer !== null && (
                                    <div className="p-4 bg-purple-900/20 border border-purple-800/50 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-purple-400">TCGPlayer</span>
                                            <a
                                                href={getMarketUrl("tcgplayer", card.cardName)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm"
                                            >
                                                Ver en web <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-slate-400 text-xs">Precio de mercado</div>
                                            <div className="font-bold text-2xl text-purple-400">
                                                ${allPrices.tcgplayer.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {allPrices.cardmarket === null && allPrices.tcgplayer === null && (
                                    <div className="p-6 bg-slate-800/50 rounded-lg text-center">
                                        <Package className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                        <p className="text-slate-400">No hay información de precios disponible</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* Footer con links rápidos */}
                <div className="mt-6 pt-4 border-t border-slate-700 flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-slate-300 hover:text-white"
                        asChild
                    >
                        <a
                            href={getMarketUrl("cardmarket", card.cardName)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Comprar en Cardmarket <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-slate-300 hover:text-white"
                        asChild
                    >
                        <a
                            href={getMarketUrl("tcgplayer", card.cardName)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Comprar en TCGPlayer <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 text-slate-300 hover:text-white"
                        asChild
                    >
                        <a
                            href={getMarketUrl("ebay", card.cardName)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Buscar en eBay <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CardDetailModal;
