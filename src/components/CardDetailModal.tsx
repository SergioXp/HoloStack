"use client";

import { useState, useEffect } from "react";
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
    Search,
    Heart,
    Pencil
} from "lucide-react";
import { getAllPrices, getMarketUrl, formatPrice, type Currency } from "@/lib/prices";
import { formatPriceAge } from "@/lib/price-refresh";
import { useI18n } from "@/lib/i18n";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";

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
    notes?: string | null;
    notesMap?: Record<string, string | null>;
}

export interface RelatedCard {
    id: string;
    name: string;
    image: string;
    rarity?: string;
}

interface CardDetailModalProps {
    card: CardData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currency?: Currency;
    onWishlistChange?: (isInWishlist: boolean) => void;
    relatedCards?: RelatedCard[];
    onSelectRelated?: (card: RelatedCard) => void;
}

// Componente de botón para abrir el modal (lupa)
export function CardDetailTrigger({
    onClick,
    className = ""
}: {
    onClick: () => void;
    className?: string;
}) {
    const { t } = useI18n();
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all ${className}`}
            title={t("cardDetail.viewDetails")}
        >
            <Search className="h-4 w-4" />
        </button>
    );
}

export function CardDetailModal({
    card,
    open,
    onOpenChange,
    currency = "EUR",
    onWishlistChange,
    relatedCards = [],
    onSelectRelated
}: CardDetailModalProps) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState("prices");
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [priceHistory, setPriceHistory] = useState<any[]>([]);

    // Parallax state
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const box = card.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        const centerX = box.width / 2;
        const centerY = box.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        setRotate({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotate({ x: 0, y: 0 });
    };

    useEffect(() => {
        if (open && card?.cardId) {
            checkWishlistStatus();
            fetchPriceHistory();
        }
    }, [open, card?.cardId]);

    if (!card) return null;

    const fetchPriceHistory = async () => {
        if (!card?.cardId) return;
        try {
            const res = await fetch(`/api/prices/history?cardId=${card.cardId}`);
            if (res.ok) {
                const data = await res.json();
                setPriceHistory(data);
            }
        } catch (error) {
            console.error("Error fetching price history", error);
        }
    };

    const checkWishlistStatus = async () => {
        if (!card?.cardId) return;
        try {
            const res = await fetch(`/api/wishlist?cardId=${card.cardId}`);
            if (res.ok) {
                const data = await res.json();
                setIsInWishlist(data.length > 0);
            }
        } catch (error) {
            console.error("Error checking wishlist status", error);
        }
    };

    const toggleWishlist = async () => {
        if (!card?.cardId) return;
        setWishlistLoading(true);

        try {
            if (isInWishlist) {
                // Remove
                const res = await fetch(`/api/wishlist?cardId=${card.cardId}`, { method: "DELETE" });
                if (res.ok) {
                    setIsInWishlist(false);
                    onWishlistChange?.(false);
                }
            } else {
                // Add
                const res = await fetch("/api/wishlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cardId: card.cardId })
                });
                if (res.ok) {
                    setIsInWishlist(true);
                    onWishlistChange?.(true);
                }
            }
        } catch (error) {
            console.error("Error toggling wishlist", error);
        } finally {
            setWishlistLoading(false);
        }
    };

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

    const priceAge = formatPriceAge(card.cardmarketPrices || card.tcgplayerPrices, t);

    // Calcular tendencia (si avg7 < avg30 está subiendo)
    const trend = cmData?.avg7 && cmData?.avg30
        ? cmData.avg7 > cmData.avg30 ? "up" : cmData.avg7 < cmData.avg30 ? "down" : "stable"
        : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-950/95 border-slate-800 text-white w-[95vw] md:w-full max-w-7xl h-[90vh] md:h-auto md:max-h-[85vh] p-0 overflow-hidden shadow-2xl backdrop-blur-xl sm:max-w-7xl">
                <DialogTitle className="sr-only">{card.cardName}</DialogTitle>
                <div className="flex flex-col md:flex-row h-full">
                    {/* Columna Izquierda: Imagen (más prominente) */}
                    <div className="w-full md:w-[45%] bg-slate-900/50 p-6 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
                        <div
                            className="relative w-full max-w-[360px] aspect-63/88 rounded-2xl shadow-2xl ring-1 ring-white/10 group animate-in fade-in zoom-in duration-300 perspective-1000"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            style={{ perspective: "1000px" }}
                        >
                            <div
                                className="w-full h-full relative preserve-3d transition-transform duration-200 ease-out"
                                style={{
                                    transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                                    transformStyle: "preserve-3d"
                                }}
                            >
                                {images.large || images.small ? (
                                    <Image
                                        src={images.large || images.small}
                                        alt={card.cardName}
                                        fill
                                        className="object-cover rounded-2xl"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        priority
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded-2xl">
                                        <Package className="h-16 w-16 text-slate-700" />
                                    </div>
                                )}

                                {/* Glare Effect */}
                                <div
                                    className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                                    style={{
                                        transform: `translateZ(50px)`,
                                    }}
                                />

                                {/* Rarity Badge Overlay (Moved inside transform layer) */}
                                {card.cardRarity && (
                                    <div className="absolute top-3 right-3" style={{ transform: "translateZ(30px)" }}>
                                        <Badge className="bg-black/60 backdrop-blur border-white/10 text-xs font-semibold hover:bg-black/80 shadow-lg">
                                            {card.cardRarity}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Contenido */}
                    <div className="flex-1 flex flex-col h-full min-h-0">
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">

                            {/* Header */}
                            <div className="p-6 pb-2">
                                <h2 className="text-2xl font-bold flex items-center gap-2 mb-1 text-white">
                                    {card.cardName}
                                </h2>
                                <div className="flex items-center justify-between">
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
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={toggleWishlist}
                                        disabled={wishlistLoading}
                                        className={`rounded-full hover:bg-slate-800 ${isInWishlist ? "text-pink-500 hover:text-pink-400" : "text-slate-400 hover:text-white"}`}
                                    >
                                        <Heart className={`h-5 w-5 ${isInWishlist ? "fill-current" : ""}`} />
                                    </Button>
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
                                            {t("cardDetail.market")}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="details"
                                            className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 font-medium"
                                        >
                                            {t("cardDetail.detailsTab")}
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="mt-6 space-y-6">
                                        <TabsContent value="prices" className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">

                                            {/* Estado del Tiempo */}
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    <Calendar className="h-3 w-3" />
                                                    {t("cardDetail.updated")} {priceAge}
                                                </div>
                                                {trend && (
                                                    <Badge variant="outline" className={`${trend === "up" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : trend === "down" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                                                        {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                                        {trend === "up" ? t("cardDetail.trendUp") : t("cardDetail.trendDown")}
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
                                                            <p className="text-xs text-slate-400">{t("cardDetail.cmReference")}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-slate-400">{t("cardDetail.trend")}</p>
                                                            <p className="text-3xl font-bold text-white tracking-tight">
                                                                €{allPrices.cardmarket.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mt-2 relative z-10">
                                                        <div className="bg-slate-950/50 rounded-lg p-3 border border-indigo-500/10">
                                                            <p className="text-xs text-slate-500 mb-1">{t("cardDetail.minPrice")}</p>
                                                            <p className="font-semibold text-lg text-slate-200">
                                                                €{cmData?.low?.toFixed(2) || "-"}
                                                            </p>
                                                        </div>
                                                        <div className="bg-slate-950/50 rounded-lg p-3 border border-indigo-500/10">
                                                            <p className="text-xs text-slate-500 mb-1">{t("cardDetail.avg30")}</p>
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
                                                        <p className="text-xs text-slate-400">{t("cardDetail.usdMarket")}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-slate-400">{t("cardDetail.marketPrice")}</p>
                                                        <p className="text-2xl font-bold text-white">
                                                            ${allPrices.tcgplayer.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Price History Chart */}
                                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                                                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                                    Price History
                                                </h3>
                                                <PriceHistoryChart data={priceHistory} currency={currency} />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="details" className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                                    <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">{t("cardDetail.properties")}</h3>
                                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                                        <div>
                                                            <dt className="text-slate-500 mb-1">{t("common.set")}</dt>
                                                            <dd className="font-medium text-slate-200">{card.setName || card.setId}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-slate-500 mb-1">{t("cardDetail.rarity")}</dt>
                                                            <dd className="font-medium text-slate-200">{card.cardRarity || "-"}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-slate-500 mb-1">{t("cardDetail.number")}</dt>
                                                            <dd className="font-medium text-slate-200">{card.cardNumber || "-"}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-slate-500 mb-1">{t("cardDetail.variant")}</dt>
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
                                                            <p className="text-sm text-emerald-500 font-medium">{t("cardDetail.inCollection")}</p>
                                                            <p className="text-xl font-bold text-emerald-400">
                                                                {card.quantity} {card.quantity === 1 ? t("cardDetail.copy") : t("cardDetail.copies")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {card.notesMap && Object.values(card.notesMap).some(n => n) && (
                                                    <div className="p-4 bg-blue-950/20 rounded-xl border border-blue-900/30">
                                                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <Pencil className="h-3 w-3" />
                                                            {t("collectionDetail.privateNotes") || "Notas Privadas"}
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {Object.entries(card.notesMap).filter(([_, note]) => note).map(([variant, note]) => (
                                                                <div key={variant} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                                                        {variant.replace(/([A-Z])/g, ' $1').trim()}
                                                                    </span>
                                                                    <p className="text-sm text-slate-300 italic">"{note}"</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>

                                {/* Related Cards Section */}
                                {relatedCards.length > 0 && (
                                    <div className=" mt-6 mb-4">
                                        <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">{t("cardDetail.related")}</h3>
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                            {relatedCards.map((rCard) => (
                                                <button
                                                    key={rCard.id}
                                                    className="relative w-20 aspect-63/88 shrink-0 rounded-lg overflow-hidden border border-slate-800 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/50 transition-all group snap-start"
                                                    onClick={() => onSelectRelated?.(rCard)}
                                                >
                                                    {rCard.image ? (
                                                        <Image
                                                            src={rCard.image}
                                                            alt={rCard.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="80px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-800" />
                                                    )}
                                                    {rCard.rarity && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white text-center py-0.5 px-1 truncate">
                                                            {rCard.rarity}
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer (Sticky bottom) */}
                        <div className="p-6 border-t border-slate-800 bg-slate-900/30 backdrop-blur-sm shrink-0">
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
                                        {t("cardDetail.searchEbay")}
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
