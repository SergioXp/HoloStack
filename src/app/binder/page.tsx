"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, Grid3X3, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";

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
                    // Procesar cartas con estado de posesión
                    const processedCards: Card[] = data.cards.map((card: any) => {
                        const owned = data.ownershipData?.[card.id] !== undefined;
                        const quantity = owned
                            ? Object.values(data.ownershipData[card.id] || {}).reduce(
                                (acc: number, v: any) => acc + (v.quantity || 0), 0
                            )
                            : 0;
                        return {
                            id: card.id,
                            name: card.name,
                            number: card.localId || card.number,
                            images: card.images,
                            rarity: card.rarity,
                            owned,
                            quantity,
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

    const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
    const startIndex = currentPage * CARDS_PER_PAGE;
    const pageCards = cards.slice(startIndex, startIndex + CARDS_PER_PAGE);

    // Rellenar con placeholders si hay menos de 9 cartas en la última página
    const displayCards = [...pageCards];
    while (displayCards.length < CARDS_PER_PAGE && cards.length > 0) {
        displayCards.push({ id: `empty-${displayCards.length}`, name: "", number: "", images: "", rarity: "", owned: false, quantity: 0 });
    }

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-amber-400" />
                        {t("binder.title")}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Select value={selectedCollection || ""} onValueChange={setSelectedCollection}>
                        <SelectTrigger className="w-64 bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Selecciona colección" />
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
            </div>

            {/* Binder Content */}
            <div className="flex-1 flex items-center justify-center p-8">
                {collections.length === 0 ? (
                    <div className="text-center text-slate-400">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-medium text-white mb-2">{t("binder.noCollections")}</h2>
                        <p>{t("binder.createFirst")}</p>
                        <Link href="/collections/new">
                            <Button className="mt-4 bg-purple-600 hover:bg-purple-500">{t("collections.newCollection")}</Button>
                        </Link>
                    </div>
                ) : isLoadingCards ? (
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        {/* Binder Page */}
                        <div className="relative">
                            {/* Binder Background - simula la carpeta física */}
                            <div className="bg-gradient-to-br from-amber-900 to-amber-950 rounded-2xl p-6 shadow-2xl border-4 border-amber-800">
                                {/* Page Indicator */}
                                <div className="absolute top-2 right-4 text-amber-400/60 text-sm font-medium">
                                    {t("binder.page")} {currentPage + 1} / {totalPages || 1}
                                </div>

                                {/* Grid 3x3 */}
                                <div className="grid grid-cols-3 gap-3">
                                    {displayCards.map((card, index) => (
                                        <div
                                            key={card.id}
                                            className={`
                                                relative aspect-[63/88] rounded-lg overflow-hidden
                                                ${card.name ? "bg-slate-800" : "bg-amber-800/30 border-2 border-dashed border-amber-700/50"}
                                                transition-all duration-200 hover:scale-105 hover:z-10
                                            `}
                                            style={{ width: "120px" }}
                                        >
                                            {card.name ? (
                                                <>
                                                    {/* Card Image */}
                                                    {card.images && JSON.parse(card.images)?.small && (
                                                        <Image
                                                            src={JSON.parse(card.images).small}
                                                            alt={card.name}
                                                            fill
                                                            className={`object-cover ${!card.owned ? "opacity-30 grayscale" : ""}`}
                                                            sizes="120px"
                                                        />
                                                    )}
                                                    {/* Overlay for missing cards */}
                                                    {!card.owned && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                            <span className="text-4xl text-white/30">?</span>
                                                        </div>
                                                    )}
                                                    {/* Quantity badge */}
                                                    {card.owned && card.quantity > 1 && (
                                                        <div className="absolute bottom-1 right-1 bg-purple-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                                            x{card.quantity}
                                                        </div>
                                                    )}
                                                    {/* Card number */}
                                                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded">
                                                        #{card.number}
                                                    </div>
                                                </>
                                            ) : (
                                                /* Empty Slot */
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Grid3X3 className="h-8 w-8 text-amber-700/40" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 0}
                                className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>

                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number;
                                    if (totalPages <= 5) {
                                        pageNum = i;
                                    } else if (currentPage < 3) {
                                        pageNum = i;
                                    } else if (currentPage > totalPages - 4) {
                                        pageNum = totalPages - 5 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === currentPage ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => goToPage(pageNum)}
                                            className={pageNum === currentPage
                                                ? "bg-purple-600 hover:bg-purple-500"
                                                : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                                            }
                                        >
                                            {pageNum + 1}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="text-center text-slate-400 text-sm">
                            {cards.filter(c => c.owned).length} / {cards.length} {t("binder.cardsCollected")}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
