"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CardSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCard: (card: any) => void;
    initialQuery: string;
}

export default function CardSearchModal({ isOpen, onClose, onSelectCard, initialQuery }: CardSearchModalProps) {
    const { t } = useI18n();
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    // Initial search when modal opens
    useEffect(() => {
        if (isOpen && initialQuery) {
            setQuery(initialQuery);
            handleSearch(initialQuery);
        }
    }, [isOpen, initialQuery]);

    const handleSearch = async (searchTerm: string) => {
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        try {
            // We'll use the existing global search
            const res = await fetch(`/api/search/global?q=${encodeURIComponent(searchTerm)}&type=card&limit=1000`);
            if (res.ok) {
                const data = await res.json();
                // Filter for cards only and map to useful structure
                const cards = data
                    .filter((item: any) => item.type === "card")
                    .map((item: any) => ({
                        id: item.id,
                        name: item.title,
                        setName: item.subtitle, // subtitle is "Set Name #Number"
                        image: item.image,
                        // We don't have rarity or images object here in standard search result, but image string is the url
                    }));
                setResults(cards || []);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (card: any) => {
        setSelectedCardId(card.id);
        onSelectCard(card);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 text-white border-slate-800 max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{t("collectionDetail.searchCard")}</DialogTitle>
                </DialogHeader>

                <div className="p-6 pt-2 pb-4 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                            placeholder={t("collectionDetail.searchPlaceholder")}
                            className="pl-10 bg-slate-800 border-slate-700 text-white h-12 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <Button
                            className="absolute right-1 top-1 bottom-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4"
                            onClick={() => handleSearch(query)}
                            size="sm"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.search")}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {results.length === 0 && !isLoading ? (
                        <div className="text-center py-10 text-slate-500">
                            {t("collectionDetail.noResults.description")}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {results.map((card) => {
                                return (
                                    <div
                                        key={card.id}
                                        onClick={() => handleSelect(card)}
                                        className="group relative cursor-pointer bg-slate-800/50 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all hover:scale-105"
                                    >
                                        <div className="aspect-[2.5/3.5] relative">
                                            {card.image ? (
                                                <Image
                                                    src={card.image}
                                                    alt={card.name}
                                                    fill
                                                    className="object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600 text-xs text-center p-2">
                                                    {card.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 bg-slate-900/90 text-xs">
                                            <div className="font-bold truncate text-white">{card.name}</div>
                                            <div className="flex justify-between text-slate-400 mt-1">
                                                <span className="truncate">{card.setName}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
