"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Printer, Trash2, Plus, X, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useI18n } from "@/lib/i18n";

interface SearchResult {
    id: string;
    name: string;
    number: string;
    rarity: string;
    images: string;
    setId: string;
    setName: string;
    setSeries: string;
}

export default function ProxiesPage() {
    const { t } = useI18n();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedCards, setSelectedCards] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const addCard = (card: SearchResult) => {
        setSelectedCards(prev => [...prev, card]);
    };

    const removeCard = (index: number) => {
        setSelectedCards(prev => prev.filter((_, i) => i !== index));
    };

    const clearAll = () => {
        if (confirm(t("proxies.confirmClear"))) {
            setSelectedCards([]);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col h-screen">
            {/* Top Bar - No Print */}
            <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between shrink-0 print:hidden z-20">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Printer className="h-5 w-5 text-purple-400" />
                        {t("proxies.title")}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-400 mr-4">
                        <span className="text-white font-bold">{selectedCards.length}</span> {t("proxies.selected", { count: selectedCards.length }).replace(selectedCards.length.toString(), "").trim()}
                    </div>
                    {selectedCards.length > 0 && (
                        <Button variant="ghost" onClick={clearAll} className="text-red-400 hover:text-red-300 hover:bg-red-900/10">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t("proxies.clear")}
                        </Button>
                    )}
                    <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        <Printer className="h-4 w-4 mr-2" />
                        {t("proxies.print")}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Search - No Print */}
                <div className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col print:hidden z-10">
                    <div className="p-4 border-b border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder={t("proxies.searchPlaceholder")}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="pl-10 bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-2">
                            {isSearching && (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                                </div>
                            )}

                            {!isSearching && results.length === 0 && query.length >= 2 && (
                                <div className="text-center text-slate-500 py-4">
                                    {t("proxies.noResults")}
                                </div>
                            )}

                            {results.map(card => {
                                const imgs = JSON.parse(card.images || "{}");
                                const imgUrl = imgs.small || imgs.large;

                                return (
                                    <div key={card.id} className="flex gap-3 p-2 rounded-lg hover:bg-slate-800 group transition-colors cursor-pointer" onClick={() => addCard(card)}>
                                        <div className="relative h-20 w-14 shrink-0 rounded overflow-hidden bg-slate-700">
                                            {imgUrl ? (
                                                <Image src={imgUrl} alt={card.name} fill className="object-cover" sizes="56px" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">?</div>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Plus className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-white truncate">{card.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-slate-700 text-slate-400">
                                                    {card.setName}
                                                </Badge>
                                                <span className="text-xs text-slate-500">#{card.number}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-slate-950/50 p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
                    <div className="mx-auto max-w-[215mm]">
                        <div id="print-area" className="bg-white min-h-[297mm] shadow-2xl p-[10mm] print:shadow-none print:p-0">
                            <div className="grid grid-cols-3 gap-1 content-start print:block">
                                {selectedCards.map((card, idx) => {
                                    const imgs = JSON.parse(card.images || "{}");
                                    // Use large image for better print quality
                                    const imgUrl = imgs.large || imgs.small;

                                    return (
                                        <div
                                            key={`${card.id}-${idx}`}
                                            className="relative group print:inline-block print:float-left print:m-0"
                                            style={{ width: "63mm", height: "88mm" }}
                                        >
                                            {imgUrl && (
                                                <img
                                                    src={imgUrl}
                                                    alt={card.name}
                                                    className="w-full h-full object-cover print:object-cover"
                                                />
                                            )}
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full"
                                                    onClick={(e) => { e.stopPropagation(); removeCard(idx); }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            {/* Cut Marks (optional visuals for screen) */}
                                            <div className="absolute inset-0 border border-slate-200 pointer-events-none print:border print:border-slate-300 print:opacity-50" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Instructions (Screen Only) */}
                        {selectedCards.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none print:hidden">
                                <div className="text-center p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400">
                                    <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium text-white mb-2">{t("proxies.readyTitle")}</h3>
                                    <p className="max-w-xs">
                                        {t("proxies.readyDesc")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 10mm;
                        size: A4 portrait;
                    }
                    body {
                        background: white;
                        color: black;
                    }
                    /* Forzar background images */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
