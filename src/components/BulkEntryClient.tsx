"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Search, Loader2, PackageOpen, AlertCircle, CheckCircle2, Copy, Trash2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getAvailableVariants } from "@/lib/card-utils";

interface SetOption {
    id: string;
    name: string;
    total: number;
    logo?: string;
    image?: string;
}

interface CollectionOption {
    id: string;
    name: string;
    type: string;
}

interface ParsedCard {
    raw: string;
    number: string;
    variant: 'normal' | 'holofoil' | 'reverseHolofoil';
    quantity: number;
    valid?: boolean;
    card?: any;
    status: 'pending' | 'valid' | 'invalid' | 'added';
    error?: string;
}

interface BulkEntryClientProps {
    sets: SetOption[];
    collections: CollectionOption[];
}

export function BulkEntryClient({ sets, collections }: BulkEntryClientProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [selectedSetId, setSelectedSetId] = useState<string>("");
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || "");
    const [inputText, setInputText] = useState("");
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const selectedSet = sets.find(s => s.id === selectedSetId);

    // Parser effect: debounce input processing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!selectedSetId) return;
            validateInput(inputText);
        }, 800);
        return () => clearTimeout(timer);
    }, [inputText, selectedSetId]);

    const validateInput = async (text: string) => {
        if (!text.trim()) {
            setParsedCards([]);
            return;
        }

        setIsProcessing(true);

        const lines = text.split(/[\n,]+/).map(l => l.trim()).filter(Boolean);
        const inputs = lines.map(line => {
            // 1. Separate generic quantity parsing
            const qtyMatch = line.match(/^(.*?)\s*(?:[x*]\s*(\d+))?$/i);
            let rawNumber = line;
            let quantity = 1;

            if (qtyMatch) {
                rawNumber = qtyMatch[1]; // e.g. "101r"
                if (qtyMatch[2]) {
                    quantity = parseInt(qtyMatch[2], 10);
                }
            }

            // 2. Parse Variant Suffixes
            // We check for suffixes 'r', 'h', 'rh' (case insensitive) at the end of the number part
            let number = rawNumber;
            let variant: ParsedCard['variant'] = 'normal';

            if (rawNumber.toLowerCase().endsWith('rh')) {
                variant = 'reverseHolofoil';
                number = rawNumber.slice(0, -2);
            } else if (rawNumber.toLowerCase().endsWith('r')) {
                variant = 'reverseHolofoil';
                number = rawNumber.slice(0, -1);
            } else if (rawNumber.toLowerCase().endsWith('h')) {
                variant = 'holofoil';
                number = rawNumber.slice(0, -1);
            }

            return { raw: line, number, variant, quantity };
        });

        try {
            const res = await fetch('/api/bulk/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setId: selectedSetId, inputs })
            });

            if (res.ok) {
                const data = await res.json();
                // Merge validation results with local variant info
                // The API returns the list in order, or we can map by index if strict
                // Assuming API returns results in same order as inputs
                const merged = (data.results || []).map((r: any, i: number) => {
                    let variant = inputs[i].variant;

                    // Si el usuario no especificó variante (es normal) pero la carta no admite normal
                    // (ej: Ultra Raras), asignamos la primera variante disponible.
                    if (variant === 'normal' && r.card) {
                        const available = getAvailableVariants(r.card.rarity, r.card.supertype);
                        if (!available.has('normal') && available.size > 0) {
                            variant = Array.from(available)[0] as any;
                        }
                    }

                    return {
                        ...r,
                        variant
                    };
                });
                setParsedCards(merged);
            }
        } catch (error) {
            console.error("Validation error", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAdd = async () => {
        if (!selectedCollectionId) {
            alert(t("bulk.entry.alerts.selectCollection"));
            return;
        }

        const validCards = parsedCards.filter(p => p.status === 'valid' && p.card);
        if (validCards.length === 0) return;

        setIsProcessing(true);
        try {
            const res = await fetch('/api/bulk/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectionId: selectedCollectionId,
                    cards: validCards.map(c => ({
                        card: c.card,
                        quantity: c.quantity,
                        variant: c.variant
                    }))
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Success feedback
                alert(t("bulk.entry.alerts.success", { count: data.count }));
                setInputText("");
                setParsedCards([]);
                router.refresh(); // Refresh to update collection stats if shown elswhere
            } else {
                alert(t("bulk.entry.alerts.error"));
            }
        } catch (error) {
            console.error("Add error", error);
            alert(t("bulk.entry.alerts.connection"));
        } finally {
            setIsProcessing(false);
        }
    };

    const totalCards = parsedCards.filter(p => p.status === 'valid').reduce((acc, curr) => acc + curr.quantity, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Input */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 bg-slate-900/50 border-slate-800 backdrop-blur-xl">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-400 mb-1.5 block">
                                    {t("bulk.entry.setLabel")}
                                </label>
                                <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white h-12">
                                        <SelectValue placeholder={t("bulk.entry.setPlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950 border-slate-800 text-white max-h-[300px]">
                                        {sets.map(set => (
                                            <SelectItem key={set.id} value={set.id}>
                                                <div className="flex items-center gap-2">
                                                    {set.logo && (
                                                        <div className="relative w-5 h-5">
                                                            <Image src={set.logo} alt={set.name} fill className="object-contain" />
                                                        </div>
                                                    )}
                                                    <span className="truncate">{set.name}</span>
                                                    <span className="text-xs text-slate-500 ml-auto">({set.total})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-400 mb-1.5 block">
                                    {t("bulk.entry.collectionLabel")}
                                </label>
                                <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                                    <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-white h-12">
                                        <SelectValue placeholder={t("bulk.entry.collectionPlaceholder")} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                        {collections.map(col => (
                                            <SelectItem key={col.id} value={col.id}>
                                                {col.name} <span className="text-slate-500 text-xs">({col.type})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-400 mb-1.5 flex justify-between">
                                <span>{t("bulk.entry.fastEntryLabel")}</span>
                                <span className="text-xs text-slate-500">{t("bulk.entry.fastEntryHelp")}</span>
                            </label>
                            <Textarea
                                ref={textareaRef}
                                value={inputText}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                                disabled={!selectedSetId}
                                placeholder={!selectedSetId ? t("bulk.entry.inputPlaceholder") : t("bulk.entry.inputPlaceholderActive")}
                                className="min-h-[300px] font-mono text-lg bg-slate-950 border-slate-800 text-green-400 placeholder:text-slate-600 resize-none p-4 leading-relaxed tracking-wide shadow-inner"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <div className="text-sm text-slate-400">
                                {totalCards > 0 && (
                                    <span className="flex items-center gap-2">
                                        <PackageOpen className="h-4 w-4 text-blue-400" />
                                        {t("bulk.entry.detectedCards")} <strong className="text-white">{totalCards}</strong> {t("bulk.entry.detectedCardsSuffix")}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setInputText("")}
                                    disabled={!inputText}
                                    className="border-slate-700 text-slate-400 hover:text-white"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t("bulk.entry.clearButton")}
                                </Button>
                                <Button
                                    onClick={handleAdd}
                                    disabled={!selectedSetId || totalCards === 0 || isProcessing}
                                    className={cn(
                                        "bg-blue-600 hover:bg-blue-500 text-white min-w-[140px]",
                                        isProcessing && "opacity-80"
                                    )}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <>
                                            <ArrowRight className="h-4 w-4 mr-2" />
                                            {t("bulk.entry.addButton")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right Column: Preview / Feedback */}
            <div className="space-y-6">
                <div className="sticky top-24">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        {t("bulk.entry.preview.title")}
                    </h3>

                    {!selectedSetId ? (
                        <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-center text-slate-500">
                            <PackageOpen className="h-12 w-12 mb-4 opacity-50" />
                            <p>{t("bulk.entry.preview.noSet")}</p>
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                            {parsedCards.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <p>{t("bulk.entry.preview.instructions")}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800">
                                    {parsedCards.map((p, idx) => (
                                        <div key={idx} className={cn(
                                            "p-3 flex items-center gap-3 transition-colors",
                                            p.status === 'valid' ? "hover:bg-slate-800/50" : "bg-red-900/10"
                                        )}>
                                            <div className="w-10 h-14 bg-slate-800 rounded border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative">
                                                {p.card?.image ? (
                                                    <Image src={p.card.image} alt={p.number} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-xs text-slate-500 font-mono">#{p.number}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "text-sm font-bold font-mono",
                                                        p.status === 'valid' ? "text-white" : "text-red-400"
                                                    )}>#{p.number}</span>
                                                    <div className="flex gap-1">
                                                        {p.variant !== 'normal' && (
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] uppercase border px-1 py-0 h-5",
                                                                p.variant === 'holofoil' ? "border-yellow-500 text-yellow-500" : "border-blue-400 text-blue-400"
                                                            )}>
                                                                {p.variant === 'holofoil' ? 'Holo' : 'Rev'}
                                                            </Badge>
                                                        )}
                                                        {p.quantity > 1 && (
                                                            <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-800 text-[10px] h-5 px-1.5">
                                                                x{p.quantity}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400 truncate">
                                                    {p.status === 'valid' ? p.card?.name : (p.error || t("bulk.entry.preview.notFound"))}
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                {p.status === 'valid' ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
