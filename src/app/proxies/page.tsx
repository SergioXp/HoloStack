"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Printer, Trash2, Plus, X, ArrowLeft, Loader2, Settings2, FileText, Image as ImageIcon, Tag } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextProxyCard } from "@/components/TextProxyCard";
import { CollectionSelectorModal } from "@/components/CollectionSelectorModal";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface SearchResult {
    id: string;
    name: string;
    number: string;
    rarity: string;
    images: string | any;
    setId: string;
    setName: string;
    setSeries: string;
    hp?: string;
    types?: string[];
    attacks?: any[];
    abilities?: any[];
    weaknesses?: any[];
    retreatCost?: string[];
}

type PrintMode = "standard" | "text-only" | "label";

export default function ProxiesPage() {
    const { t } = useI18n();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedCards, setSelectedCards] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Print Settings
    const [printMode, setPrintMode] = useState<PrintMode>("standard");
    const [inkSaving, setInkSaving] = useState(false);
    const [printPadding, setPrintPadding] = useState(10); // mm
    const [printGap, setPrintGap] = useState(1); // mm

    // Import State
    const [isImporting, setIsImporting] = useState(false);

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
        setSelectedCards(prev => [...prev, { ...card }]);
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

    const handleImportCollection = async (collectionId: string) => {
        setIsImporting(true);
        try {
            const res = await fetch(`/api/collections/${collectionId}`);
            if (!res.ok) throw new Error("Failed to fetch collection");
            const data = await res.json();

            if (data.cards && Array.isArray(data.cards)) {
                const cardsToAdd: SearchResult[] = [];
                data.cards.forEach((card: any) => {
                    const ownership = data.ownershipData?.[card.id];
                    let count = 1;

                    if (ownership) {
                        count = Object.values(ownership).reduce((acc: number, val: any) => acc + (val.quantity || 0), 0);
                    }

                    if (count < 1) count = 1;

                    for (let i = 0; i < count; i++) {
                        cardsToAdd.push(card);
                    }
                });

                setSelectedCards(prev => [...prev, ...cardsToAdd]);
            }
        } catch (error) {
            console.error("Error importing collection:", error);
            alert("Error importing collection");
        } finally {
            setIsImporting(false);
        }
    };

    const getImages = (images: any) => {
        if (typeof images === "string") {
            try {
                return JSON.parse(images);
            } catch {
                return {};
            }
        }
        return images || {};
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col h-screen">
            {/* Top Bar - No Print */}
            <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 print:hidden z-20 px-8 pt-8 pb-4">
                <div className="max-w-7xl mx-auto">
                    <PageHeader
                        title={t("proxies.title")}
                        description={t("proxies.subtitle")}
                        icon={Printer}
                        iconColor="from-purple-500 to-indigo-500"
                        className="mb-0"
                        actions={
                            <div className="flex items-center gap-6">
                                {/* Settings Toolbar */}
                                <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="print-mode" className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{t("proxies.toolbar.mode")}</Label>
                                        <Select value={printMode} onValueChange={(v) => setPrintMode(v as PrintMode)}>
                                            <SelectTrigger className="h-7 w-[130px] text-xs bg-slate-800 border-slate-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="standard" className="text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <ImageIcon className="h-3 w-3" /> Standard
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="text-only" className="text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-3 w-3" /> Text Only
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="label" className="text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-3 w-3" /> Labels
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-px h-4 bg-slate-700" />

                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="ink-saving"
                                            checked={inkSaving}
                                            onCheckedChange={setInkSaving}
                                            className="scale-75 data-[state=checked]:bg-emerald-500"
                                        />
                                        <Label htmlFor="ink-saving" className="text-[10px] text-slate-500 font-medium uppercase tracking-wider cursor-pointer">
                                            {t("proxies.toolbar.inkSaving")}
                                        </Label>
                                    </div>

                                    <div className="w-px h-4 bg-slate-700" />

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <Label htmlFor="padding" className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{t("proxies.toolbar.margin")}</Label>
                                            <Input
                                                id="padding"
                                                type="number"
                                                value={printPadding}
                                                onChange={(e) => setPrintPadding(Number(e.target.value))}
                                                className="h-7 w-12 text-xs bg-slate-800 border-slate-700 text-center p-0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Label htmlFor="gap" className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{t("proxies.toolbar.gap")}</Label>
                                            <Input
                                                id="gap"
                                                type="number"
                                                value={printGap}
                                                onChange={(e) => setPrintGap(Number(e.target.value))}
                                                className="h-7 w-12 text-xs bg-slate-800 border-slate-700 text-center p-0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Import Button */}
                                    <CollectionSelectorModal onSelect={handleImportCollection} isLoading={isImporting} />

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 border-slate-700 text-slate-300 hover:text-white"
                                        onClick={clearAll}
                                        disabled={selectedCards.length === 0}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t("proxies.clear")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handlePrint}
                                        disabled={selectedCards.length === 0}
                                        className="h-9 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                                    >
                                        <Printer className="h-4 w-4 mr-2" />
                                        {t("proxies.print")} ({selectedCards.length})
                                    </Button>
                                </div>
                            </div>
                        }
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Search - No Print */}
                <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col print:hidden z-10 shadow-2xl">
                    <div className="p-4 border-b border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder={t("proxies.searchPlaceholder")}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="pl-10 bg-slate-800 border-slate-700 text-white focus:ring-purple-500/50"
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1 p-2">
                        <div className="space-y-1">
                            {isSearching && (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                                </div>
                            )}

                            {!isSearching && results.length === 0 && query.length >= 2 && (
                                <div className="text-center text-slate-500 py-8 text-sm">
                                    {t("proxies.noResults")}
                                </div>
                            )}

                            {results.map(card => {
                                const imgs = getImages(card.images);
                                const imgUrl = imgs.small || imgs.large;

                                return (
                                    <div key={card.id} className="flex gap-3 p-2 rounded-lg hover:bg-slate-800 group transition-all cursor-pointer border border-transparent hover:border-slate-700" onClick={() => addCard(card)}>
                                        <div className="relative h-16 w-11 shrink-0 rounded overflow-hidden bg-slate-800 shadow-sm">
                                            {imgUrl ? (
                                                <Image src={imgUrl} alt={card.name} fill className="object-cover" sizes="44px" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-bold">?</div>
                                            )}
                                            <div className="absolute inset-0 bg-purple-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                                <Plus className="h-5 w-5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className="text-sm font-medium text-white truncate leading-tight">{card.name}</h4>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-slate-700 text-slate-400 bg-slate-900/50">
                                                    {card.setSeries}
                                                </Badge>
                                                <span className="text-[10px] text-slate-500 font-mono">#{card.number}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-slate-950/50 p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible flex justify-center">
                    <div className="w-full max-w-[210mm]">
                        <div
                            id="print-area"
                            className={cn(
                                "bg-white min-h-[297mm] shadow-2xl print:shadow-none transition-all duration-300",
                                inkSaving && "grayscale contrast-125",
                                printMode === "text-only" && "font-sans"
                            )}
                            style={{ padding: `${printPadding}mm` }}
                        >
                            <div
                                className={cn("grid content-start print:block", printMode === "label" ? "grid-cols-4" : "grid-cols-3")}
                                style={{ gap: `${printGap}mm` }}
                            >
                                {selectedCards.map((card, idx) => {
                                    const imgs = getImages(card.images);
                                    const imgUrl = imgs.large || imgs.small;

                                    if (printMode === "text-only") {
                                        return (
                                            <div
                                                key={`${card.id}-${idx}-txt`}
                                                className="relative group print:inline-block print:float-left print:m-0 break-inside-avoid"
                                                style={{
                                                    width: "63mm",
                                                    height: "88mm",
                                                    marginBottom: `${printGap}mm`,
                                                    marginRight: `${printGap}mm`
                                                }}
                                            >
                                                <TextProxyCard card={card} />
                                                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-10">
                                                    <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); removeCard(idx); }}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (printMode === "label") {
                                        return (
                                            <div
                                                key={`${card.id}-${idx}-lbl`}
                                                className="relative group print:inline-block print:float-left print:m-0 border border-black p-2 flex flex-col justify-center items-center text-center break-inside-avoid text-black"
                                                style={{
                                                    width: "48mm",
                                                    height: "25mm",
                                                    marginBottom: `${printGap}mm`,
                                                    marginRight: `${printGap}mm`
                                                }}
                                            >
                                                <div className="font-black text-2xl leading-none">#{card.number}</div>
                                                <div className="text-sm font-bold truncate w-full mt-1">{card.name}</div>

                                                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden z-10">
                                                    <Button variant="destructive" size="icon" className="h-5 w-5 rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); removeCard(idx); }}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Standard Image Mode
                                    return (
                                        <div
                                            key={`${card.id}-${idx}`}
                                            className="relative group print:inline-block print:float-left print:m-0 break-inside-avoid"
                                            style={{
                                                width: "63mm",
                                                height: "88mm",
                                                marginBottom: `${printGap}mm`,
                                                marginRight: `${printGap}mm`
                                            }}
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
                                                    className="h-6 w-6 rounded-full shadow-md"
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
                                <div className="text-center p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 backdrop-blur-sm shadow-xl">
                                    <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium text-white mb-2">{t("proxies.readyTitle")}</h3>
                                    <p className="max-w-xs text-sm">
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
                        margin: 0;
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
