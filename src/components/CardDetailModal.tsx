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
    const [activeTab, setActiveTab] = useState("prices");

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
            <DialogContent className="bg-slate-950/95 border-slate-800 text-white w-[95vw] md:w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[85vh] p-0 overflow-hidden shadow-2xl backdrop-blur-xl sm:max-w-5xl">
                <div className="flex flex-col md:flex-row h-full">
                    {/* Columna Izquierda: Imagen (más prominente) */}
                    <div className="w-full md:w-[45%] bg-slate-900/50 p-6 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
                        <div className="relative w-full max-w-[360px] aspect-[63/88] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 group animate-in fade-in zoom-in duration-300">
                            {images.large || images.small ? (
                                <Image
                                    src={images.large || images.small}
                                    alt={card.cardName}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, 400px"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <Package className="h-16 w-16 text-slate-700" />
                                </div>
                            )}

                            {/* Rarity Badge Overlay */}
                            {card.cardRarity && (
                                <div className="absolute top-3 right-3">
                                    <Badge className="bg-black/60 backdrop-blur border-white/10 text-xs font-semibold hover:bg-black/80">
                                        {card.cardRarity}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Contenido */}
                    <div className="flex-1 flex flex-col h-full overflow-y-auto">

                        {/* Header */}
                        <div className="p-6 pb-2">
                            <h2 className="text-2xl font-bold flex items-center gap-2 mb-1 text-white">
                                {card.cardName}
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <span className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-full border border-slate-800">
                                    <Layers className="h-3.5 w-3.5" />
                                    {card.setName || card.setId || "Desconocido"}
                                </span>
                                <span className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-full border border-slate-800">
                                    <Hash className="h-3.5 w-3.5" />
                                    {card.cardNumber || "# --"}
                                </span>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="px-6 mt-2">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="bg-slate-900/50 p-1 border border-slate-800 w-full grid grid-cols-2 h-10">
                                    <TabsTrigger
                                        value="prices"
                                        className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 font-medium"
                                    >
                                        Mercado
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="details"
                                        className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 font-medium"
                                    >
                                        Detalles
                                    </TabsTrigger>
                                </TabsList>

                                <div className="mt-6 space-y-6">
                                    <TabsContent value="prices" className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">

                                        {/* Estado del Tiempo */}
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                <Calendar className="h-3 w-3" />
                                                Actualizado: {priceAge}
                                            </div>
                                            {trend && (
                                                <Badge variant="outline" className={`${trend === "up" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : trend === "down" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                                                    {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                                    {trend === "up" ? "Tendencia Alcista" : "Tendencia Bajista"}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Cardmarket Card */}
                                        {allPrices.cardmarket !== null && (
                                            <div className="bg-linear-to-br from-blue-950/30 to-slate-900 border border-blue-900/30 rounded-xl p-5 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <TrendingUp className="h-24 w-24 text-blue-500" />
                                                </div>

                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div>
                                                        <h3 className="text-blue-400 font-semibold mb-1">Cardmarket</h3>
                                                        <p className="text-xs text-slate-400">Principal referencia europea</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-400">Tendencia</p>
                                                        <p className="text-3xl font-bold text-white tracking-tight">
                                                            €{allPrices.cardmarket.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mt-2 relative z-10">
                                                    <div className="bg-slate-950/50 rounded-lg p-3 border border-indigo-500/10">
                                                        <p className="text-xs text-slate-500 mb-1">Precio Mínimo</p>
                                                        <p className="font-semibold text-lg text-slate-200">
                                                            €{cmData?.low?.toFixed(2) || "-"}
                                                        </p>
                                                    </div>
                                                    <div className="bg-slate-950/50 rounded-lg p-3 border border-indigo-500/10">
                                                        <p className="text-xs text-slate-500 mb-1">Media 30 días</p>
                                                        <p className="font-semibold text-lg text-slate-200">
                                                            €{cmData?.avg30?.toFixed(2) || "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TCGPlayer Card */}
                                        {allPrices.tcgplayer !== null && (
                                            <div className="bg-linear-to-br from-purple-950/30 to-slate-900 border border-purple-900/30 rounded-xl p-5 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-purple-400 font-semibold mb-1">TCGPlayer</h3>
                                                    <p className="text-xs text-slate-400">Mercado USD</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-400">Market Price</p>
                                                    <p className="text-2xl font-bold text-white">
                                                        ${allPrices.tcgplayer.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="details" className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                                <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">Propiedades</h3>
                                                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                                    <div>
                                                        <dt className="text-slate-500 mb-1">Set</dt>
                                                        <dd className="font-medium text-slate-200">{card.setName || card.setId}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-slate-500 mb-1">Rareza</dt>
                                                        <dd className="font-medium text-slate-200">{card.cardRarity || "-"}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-slate-500 mb-1">Número</dt>
                                                        <dd className="font-medium text-slate-200">{card.cardNumber || "-"}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-slate-500 mb-1">Variante</dt>
                                                        <dd className="font-medium text-slate-200 capitalize">{card.variant?.replace("-", " ") || "Normal"}</dd>
                                                    </div>
                                                </dl>
                                            </div>

                                            {card.quantity !== undefined && card.quantity > 0 && (
                                                <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-900/30 flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-emerald-500 font-medium">En tu colección</p>
                                                        <p className="text-xl font-bold text-emerald-400">
                                                            {card.quantity} {card.quantity === 1 ? "copia" : "copias"}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>

                        {/* Footer (Sticky bottom) */}
                        <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/30 backdrop-blur-sm">
                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20"
                                    asChild
                                >
                                    <a href={getMarketUrl("cardmarket", card.cardName)} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Cardmarket
                                    </a>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300"
                                    asChild
                                >
                                    <a href={getMarketUrl("ebay", card.cardName)} target="_blank" rel="noopener noreferrer">
                                        Buscar en eBay
                                    </a>
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default CardDetailModal;
