"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, Grid3X3, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import CollectionItemManager from "@/components/CollectionItemManager";
import { PageHeader } from "@/components/PageHeader";

interface Collection {
    id: string;
    name: string;
    type: string;
}

interface Card {
    id: string;
    name: string;
    number: string;
    images: string;
    rarity: string;
    supertype: string;
    setId?: string;
    owned: boolean;
    quantity: number;
}

const CARDS_PER_PAGE = 9; // Grid 3x3

export default function BinderPage() {
    const { t } = useI18n();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCards, setIsLoadingCards] = useState(false);

    // Configuración de vista
    const [layout, setLayout] = useState<{ rows: number; cols: number }>({ rows: 3, cols: 3 });
    const [isFlipping, setIsFlipping] = useState(false);
    const [ownershipData, setOwnershipData] = useState<Record<string, any>>({});
    const [setName, setSetName] = useState<string | undefined>(undefined);

    const cardsPerSide = layout.rows * layout.cols;
    const cardsPerSpread = cardsPerSide * 2; // Siempre mostramos 2 páginas (izquierda y derecha)
    const totalPages = Math.ceil(cards.length / cardsPerSpread);

    // Wishlist state (Batch optimization)
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

    const toggleWishlist = async (cardId: string) => {
        const isIn = wishlist.has(cardId);
        const newSet = new Set(wishlist);
        if (isIn) newSet.delete(cardId);
        else newSet.add(cardId);

        setWishlist(newSet); // Optimistic attempt

        try {
            if (isIn) await fetch(`/api/wishlist?cardId=${cardId}`, { method: 'DELETE' });
            else await fetch('/api/wishlist', { method: 'POST', body: JSON.stringify({ cardId }) });
        } catch {
            setWishlist(wishlist); // Revert on failure
        }
    };

    // Cargar colecciones
    useEffect(() => {
        async function loadCollections() {
            try {
                const res = await fetch("/api/collections");
                if (res.ok) {
                    const data = await res.json();
                    setCollections(data);
                    if (data.length > 0) {
                        setSelectedCollection(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Error loading collections:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadCollections();
    }, []);

    // Cargar cartas de la colección seleccionada
    useEffect(() => {
        if (!selectedCollection) return;

        async function loadCards() {
            setIsLoadingCards(true);
            try {
                const res = await fetch(`/api/collections/${selectedCollection}`);
                if (res.ok) {
                    const data = await res.json();

                    // Almacenar datos crudos para el Manager
                    setOwnershipData(data.ownershipData || {});
                    setSetName(data.setName);

                    // Procesar cartas para el grid (flattened stats for quick filtering if needed)
                    // Nota: para visualización usamos el Manager, esto es principalmente para estructura.
                    const processedCards: Card[] = data.cards.map((card: any) => {
                        return {
                            id: card.id,
                            name: card.name,
                            number: card.localId || card.number,
                            images: card.images,
                            rarity: card.rarity,
                            supertype: card.supertype,
                            owned: false, // Calculated in UI
                            quantity: 0, // Calculated in UI
                            setId: card.setId // needed for details
                        };
                    });
                    setCards(processedCards);
                    setCurrentPage(0);
                }
            } catch (error) {
                console.error("Error loading cards:", error);
            } finally {
                setIsLoadingCards(false);
            }
        }
        loadCards();
    }, [selectedCollection]);

    const goToPage = (page: number) => {
        if (page < 0 || page >= totalPages) return;
        setIsFlipping(true);
        setTimeout(() => {
            setCurrentPage(page);
            setIsFlipping(false);
        }, 300); // Duración de la animación
    };

    // Helper para obtener cartas de una página específica (izquierda o derecha)
    const getPageCards = (pageIndex: number, side: 'left' | 'right') => {
        const spreadStartIndex = pageIndex * cardsPerSpread;
        const sideStartIndex = spreadStartIndex + (side === 'right' ? cardsPerSide : 0);
        const sideCards = cards.slice(sideStartIndex, sideStartIndex + cardsPerSide);

        // Rellenar huecos
        while (sideCards.length < cardsPerSide) {
            sideCards.push({ id: `empty-${sideCards.length}-${side}`, name: "", number: "", images: "", rarity: "", supertype: "", owned: false, quantity: 0 });
        }
        return sideCards;
    };

    const handleUpdateQuantity = (cardId: string, variant: string, newQuantity: number) => {
        setOwnershipData(prev => ({
            ...prev,
            [cardId]: {
                ...(prev[cardId] || {}),
                [variant]: { quantity: newQuantity }
            }
        }));
    };

    // Renderizado de una carta individual
    const renderCard = (card: Card) => {
        if (!card.name) {
            return (
                <div key={card.id} className="relative aspect-63/88 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-white/10 opacity-30" />
                </div>
            );
        }

        const cardOwnership = ownershipData[card.id] || {};
        const ownedMap = new Map<string, { quantity: number; id: string }>();

        Object.entries(cardOwnership).forEach(([k, v]: [string, any]) => {
            ownedMap.set(k, { quantity: v.quantity, id: v.id });
        });

        return (
            <div key={card.id} className="w-full h-full relative">
                <CollectionItemManager
                    card={card}
                    collectionId={selectedCollection || ""}
                    ownedData={ownedMap}
                    totalInSet={cards.length}
                    setName={setName}
                    showSetInfo={true}
                    onUpdate={(variant, qty) => handleUpdateQuantity(card.id, variant, qty)}
                    variant="binder"
                    isInWishlist={wishlist.has(card.id)}
                    onToggleWishlist={toggleWishlist}
                />
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-20 px-8 pt-8 pb-4">
                <div className="max-w-7xl mx-auto">
                    <PageHeader
                        title={t("binder.title")}
                        description={t("binder.subtitle")}
                        icon={BookOpen}
                        iconColor="from-amber-500 to-orange-500"
                        className="mb-0" // Reduce margin for Binder to maximize space
                        actions={
                            <div className="flex items-center gap-4">
                                {/* View Controls */}
                                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-7 px-2 text-xs", layout.rows === 3 && "bg-slate-700 text-white shadow-sm")}
                                        onClick={() => setLayout({ rows: 3, cols: 3 })}
                                    >
                                        3x3
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("h-7 px-2 text-xs", layout.cols === 4 && "bg-slate-700 text-white shadow-sm")}
                                        onClick={() => setLayout({ rows: 3, cols: 4 })}
                                    >
                                        4x3
                                    </Button>
                                </div>

                                <Select value={selectedCollection || ""} onValueChange={setSelectedCollection}>
                                    <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white h-9">
                                        <SelectValue placeholder={t("binder.selectCollection")} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {collections.map((col) => (
                                            <SelectItem key={col.id} value={col.id} className="text-white hover:bg-slate-700">
                                                {col.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        }
                    />
                </div>
            </div>

            {/* Binder Desk Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#1a1a1a] relative overflow-auto">
                {/* Wood Texture Background Implication */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-10 pointer-events-none" />

                {collections.length === 0 ? (
                    <div className="text-center text-slate-400">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-medium text-white mb-2">{t("binder.noCollections")}</h2>
                        <Link href="/collections/new">
                            <Button className="mt-4 bg-purple-600 hover:bg-purple-500">{t("collections.newCollection")}</Button>
                        </Link>
                    </div>
                ) : isLoadingCards ? (
                    <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                ) : (
                    <div className="flex flex-col items-center gap-6 w-full max-w-[1600px] h-full justify-center">

                        {/* THE BINDER */}
                        <div className={cn(
                            "relative flex transition-all duration-500 transform-style-3d perspective-1000",
                            isFlipping ? "opacity-50 scale-95 rotate-y-1" : "opacity-100 scale-100 rotate-y-0"
                        )}>
                            {/* Left Page (Wing) */}
                            <div
                                className="bg-linear-to-r from-neutral-800 to-neutral-900 w-[47vw] max-w-[1000px] rounded-l-2xl border-y-4 border-l-4 border-neutral-800 shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300"
                                style={{ aspectRatio: `${(layout.cols * 70 + 40)} / ${(layout.rows * 95 + 40)}` }}
                            >
                                {/* Page Texture */}
                                <div className="absolute inset-0 bg-[#151515] m-3 rounded-l-lg shadow-inner flex flex-col">
                                    <div className="flex-1 p-2 md:p-3 grid gap-2 md:gap-3 content-center justify-items-center"
                                        style={{
                                            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                                            gridTemplateRows: `repeat(${layout.rows}, 1fr)`
                                        }}>
                                        {getPageCards(currentPage, 'left').map(renderCard)}
                                    </div>
                                    <div className="h-6 flex items-center justify-center text-neutral-600 text-[10px] font-mono border-t border-white/5">
                                        {t("binder.page")} {currentPage * 2 + 1}
                                    </div>
                                </div>
                                {/* Highlight gradient */}
                                <div className="absolute inset-0 bg-linear-to-r from-white/5 to-transparent pointer-events-none" />
                            </div>

                            {/* Spine (Anillas) */}
                            <div className="w-10 md:w-16 bg-neutral-900 border-y-4 border-neutral-950 flex flex-col justify-evenly items-center py-6 relative z-10 shadow-2xl transition-all duration-300">
                                <div className="absolute inset-0 bg-linear-to-r from-black/80 via-neutral-800 to-black/80" />
                                {/* Rings */}
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="relative w-[140%] h-5 md:h-6 bg-linear-to-b from-slate-300 via-slate-100 to-slate-400 rounded-full shadow-lg transform -rotate-3 flex items-center justify-center">
                                        <div className="w-full h-px bg-black/10" />
                                    </div>
                                ))}
                            </div>

                            {/* Right Page (Wing) */}
                            <div
                                className="bg-linear-to-l from-neutral-800 to-neutral-900 w-[47vw] max-w-[1000px] rounded-r-2xl border-y-4 border-r-4 border-neutral-800 shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300"
                                style={{ aspectRatio: `${(layout.cols * 70 + 40)} / ${(layout.rows * 95 + 40)}` }}
                            >
                                {/* Page Texture */}
                                <div className="absolute inset-0 bg-[#151515] m-3 rounded-r-lg shadow-inner flex flex-col">
                                    <div className="flex-1 p-2 md:p-3 grid gap-2 md:gap-3 content-center justify-items-center"
                                        style={{
                                            gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                                            gridTemplateRows: `repeat(${layout.rows}, 1fr)`
                                        }}>
                                        {getPageCards(currentPage, 'right').map(renderCard)}
                                    </div>
                                    <div className="h-6 flex items-center justify-center text-neutral-600 text-[10px] font-mono border-t border-white/5">
                                        {t("binder.page")} {currentPage * 2 + 2}
                                    </div>
                                </div>
                                {/* Shadow gradient */}
                                <div className="absolute inset-0 bg-linear-to-l from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl z-20">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="text-slate-400 hover:text-white hover:bg-white/10"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>

                            <div className="px-4 font-mono text-sm text-slate-400">
                                {t("binder.spread")} <span className="text-white font-bold">{currentPage + 1}</span> {t("binder.of")} {totalPages || 1}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="text-slate-400 hover:text-white hover:bg-white/10"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
