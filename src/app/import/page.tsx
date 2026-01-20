"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseCardmarketText, CardmarketOrder, CardmarketItem } from "@/lib/import/cardmarket-parser";
import { AlertCircle, ArrowRight, Check, Save, Trash2, Link as LinkIcon, ShoppingBag, Search, Sparkles, Loader2, ArrowLeft, ChevronsUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function ImportPage() {
    const { t } = useI18n();
    const [step, setStep] = useState<"input" | "review">("input");
    const [textInput, setTextInput] = useState("");
    const [editedItems, setEditedItems] = useState<CardmarketItem[]>([]);
    const [isMatching, setIsMatching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Data
    const [collections, setCollections] = useState<any[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [sets, setSets] = useState<any[]>([]);

    // Bulk Actions (Default values)
    const [targetCollection, setTargetCollection] = useState<string>("none");
    const [targetBudget, setTargetBudget] = useState<string>("none");
    const [targetVariant, setTargetVariant] = useState<string>("default");

    useEffect(() => {
        fetch("/api/collections").then(res => res.json()).then(setCollections).catch(console.error);
        fetch("/api/budgets").then(res => res.json()).then(setBudgets).catch(console.error);
        fetch("/api/sets").then(res => res.json()).then(data => setSets(data.sets)).catch(console.error);
    }, []);

    // Helper to score how well a search result matches the import's rarity/code
    const calculateRarityScore = (code: string | null, subtitle: string) => {
        if (!code) return 0;
        const sub = subtitle.toLowerCase();
        const c = code.toUpperCase();

        // Mappings based on Cardmarket codes vs English TCG rarities
        if (c === "ART" || c === "AR") {
            if (sub.includes("illustration") || sub.includes("art") || sub.includes("full art")) return 10;
        }
        if (c === "SAR" || c === "SIR") {
            if (sub.includes("special") || sub.includes("illustration")) return 10;
        }
        if (c === "UR") { // Ultra Rare (Gold / Hyper)
            if (sub.includes("ultra") || sub.includes("hyper") || sub.includes("gold")) return 10;
        }
        if (c === "SR") { // Super Rare (Full Art)
            if (sub.includes("full art") || sub.includes("secret")) return 10;
        }
        if (c === "RR") { // Double Rare (ex, V, GX)
            if (sub.includes("double") || sub.includes("rare holo") || sub.includes("v") || sub.includes("ex") || sub.includes("gx")) return 5;
        }
        if (c === "R") {
            if (sub.includes("rare") && !sub.includes("double") && !sub.includes("ultra")) return 5;
        }
        if (c === "U") {
            if (sub.includes("uncommon")) return 10;
        }
        if (c === "C") {
            if (sub.includes("common") && !sub.includes("uncommon")) return 10;
        }

        return 0;
    };

    const runSmartMatch = async (items: CardmarketItem[]) => {
        setIsMatching(true);
        const updatedItems = [...items];

        for (let i = 0; i < updatedItems.length; i++) {
            const item = updatedItems[i];
            if (item.isShipping || item.cardId) continue;

            try {
                // Improved Smart Match: include Set Name in query if available
                const query = item.setName
                    ? `${item.name} ${item.setName}`
                    : item.name;

                const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}&type=card&limit=5`);
                const results = await res.json();

                if (results && results.length > 0) {
                    // 1. Filter by Set Name
                    const setCandidates = results.filter((r: any) => {
                        if (!item.setName) return true;
                        // Loose match
                        return r.subtitle.toLowerCase().includes(item.setName.toLowerCase()) ||
                            item.setName.toLowerCase().includes(r.subtitle.split('(')[0].trim().toLowerCase());
                    });

                    // 2. Fallback to all results if no set match (maybe set name isn't perfect)
                    const candidates = setCandidates.length > 0 ? setCandidates : results;

                    // 3. Sort by Rarity Match Score
                    candidates.sort((a: any, b: any) => {
                        const scoreA = calculateRarityScore(item.rarity, a.subtitle);
                        const scoreB = calculateRarityScore(item.rarity, b.subtitle);
                        return scoreB - scoreA; // Descending
                    });

                    const bestMatch = candidates[0];

                    if (bestMatch) {
                        updatedItems[i] = { ...item, cardId: bestMatch.id, dbImage: bestMatch.image };
                    }
                }
            } catch (e) {
                console.error(`Error matching ${item.name}`, e);
            }
        }

        setEditedItems(updatedItems);
        setIsMatching(false);
    };

    const handleParse = async () => {
        try {
            const result = parseCardmarketText(textInput);
            setEditedItems(result.items);
            setStep("review");
            runSmartMatch(result.items);
        } catch (e) {
            console.error(e);
            alert(t('importPage.step1.errorParsing'));
        }
    };

    const handleUpdateItem = (id: string, field: keyof CardmarketItem, value: any) => {
        setEditedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleDeleteItem = (id: string) => {
        setEditedItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSetChange = async (itemId: string, newSetName: string) => {
        // 1. Optimistic update (clear ID to show it's pending match)
        setEditedItems(prev => prev.map(item =>
            item.id === itemId
                ? { ...item, setName: newSetName, cardId: undefined, dbImage: undefined }
                : item
        ));

        const item = editedItems.find(i => i.id === itemId);
        if (!item) return;

        try {
            // 2. Search with explicit Set Name preference
            // We search for "CardName SetName" to boost relevance
            const res = await fetch(`/api/search/global?q=${encodeURIComponent(item.name + " " + newSetName)}&type=card&limit=10`);
            const results = await res.json();

            // 3. Find exact set match in results
            if (results && results.length > 0) {
                const setCandidates = results.filter((r: any) =>
                    r.subtitle.toLowerCase().includes(newSetName.toLowerCase()) ||
                    newSetName.toLowerCase().includes(r.subtitle.split('(')[0].trim().toLowerCase())
                );

                const candidates = setCandidates.length > 0 ? setCandidates : results;

                // Sort by Rarity Match Score
                candidates.sort((a: any, b: any) => {
                    const scoreA = calculateRarityScore(item.rarity, a.subtitle);
                    const scoreB = calculateRarityScore(item.rarity, b.subtitle);
                    return scoreB - scoreA;
                });

                const bestMatch = candidates[0];

                if (bestMatch) {
                    setEditedItems(prev => prev.map(current =>
                        current.id === itemId
                            ? { ...current, cardId: bestMatch.id, dbImage: bestMatch.image }
                            : current
                    ));
                }
            }
        } catch (e) {
            console.error("Error rematching card set", e);
        }
    };

    const getTotal = () => editedItems.reduce((acc, item) => acc + item.price, 0);

    const handleSave = async () => {
        if (!confirm(t('importPage.alerts.confirmSave'))) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/import/bulk-save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: editedItems,
                    collectionId: targetCollection === "none" ? undefined : targetCollection,
                    budgetId: targetBudget === "none" ? undefined : targetBudget,
                    variant: targetVariant === "default" ? undefined : targetVariant
                })
            });
            const data = await res.json();
            if (data.success) {
                let message = t('importPage.alerts.success', {
                    added: data.results.addedToCollection,
                    expenses: data.results.expensesCreated
                });

                if (data.results.errors && data.results.errors.length > 0) {
                    message += `\n\n${t('importPage.alerts.errors', { count: data.results.errors.length })}\n` + data.results.errors.join("\n");
                }

                alert(message);
                if (data.results.errors.length === 0) {
                    window.location.href = "/collections";
                }
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert(t('importPage.alerts.failedToSave'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="h-6 w-6 text-blue-400" />
                            {t('importPage.title')}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6">
                {step === "input" ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                            <h2 className="text-lg font-semibold mb-4">{t('importPage.step1.title')}</h2>
                            <p className="text-slate-400 mb-6 text-sm">
                                {t('importPage.step1.description')}
                            </p>
                            <Textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder={t('importPage.step1.placeholder')}
                                className="min-h-[400px] font-mono text-sm bg-slate-950 border-slate-800 focus:ring-blue-500 rounded-xl p-6 leading-relaxed"
                            />
                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={handleParse}
                                    disabled={!textInput.trim()}
                                    className="h-12 px-8 text-base bg-blue-600 hover:bg-blue-500 rounded-lg"
                                >
                                    {t('importPage.step1.button')}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 h-[calc(100vh-140px)]">
                        {/* Sidebar Controls */}
                        <div className="space-y-6 overflow-y-auto pr-2">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6 sticky top-0">
                                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-yellow-400" />
                                    {t('importPage.actions.title')}
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-semibold uppercase">{t('importPage.actions.assignCollection')}</label>
                                        <Select value={targetCollection} onValueChange={setTargetCollection}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700 h-10">
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- Ninguna --</SelectItem>
                                                {collections.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-500">
                                            {t('importPage.actions.assignCollectionHelp')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-semibold uppercase">{t('importPage.actions.registerExpense')}</label>
                                        <Select value={targetBudget} onValueChange={setTargetBudget}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700 h-10">
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- Ninguno --</SelectItem>
                                                {budgets.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-500">
                                            {t('importPage.actions.registerExpenseHelp')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-semibold uppercase">{t('importPage.actions.defaultVariant')}</label>
                                        <Select value={targetVariant} onValueChange={setTargetVariant}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700 h-10">
                                                <SelectValue placeholder="Seleccionar..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Automático / Detectado</SelectItem>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="holo">Holo</SelectItem>
                                                <SelectItem value="reverse holo">Reverse Holo</SelectItem>
                                                <SelectItem value="first edition">Primera Edición</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-500">
                                            {t('importPage.actions.defaultVariantHelp')}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-800 pt-6 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-slate-400">{t('importPage.actions.totalDetected')}</span>
                                        <span className="text-2xl font-bold text-white tracking-tight">{getTotal().toFixed(2)} €</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSave}
                                    className="w-full h-12 bg-green-600 hover:bg-green-500 text-lg font-semibold shadow-lg shadow-green-900/20"
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                                    {t('importPage.actions.saveAll')}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setStep("input")}
                                    className="w-full bg-transparent border-slate-700 hover:bg-slate-800 text-slate-400"
                                >
                                    {t('importPage.actions.back')}
                                </Button>
                            </div>
                        </div>

                        {/* Main Table Area */}
                        <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-sm">{t('importPage.table.detectedItems')} ({editedItems.length})</span>
                                    <div className="h-4 w-px bg-slate-800" />
                                    <span className="text-xs text-slate-500">
                                        {editedItems.filter(i => i.cardId).length} {t('importPage.table.matched')}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                                    onClick={() => runSmartMatch(editedItems)}
                                    disabled={isMatching}
                                >
                                    {isMatching ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Sparkles className="h-3 w-3 mr-2" />}
                                    {t('importPage.table.retryMatch')}
                                </Button>
                            </div>

                            <div className="flex-1 overflow-auto">
                                <Table>
                                    <TableHeader className="bg-slate-950 sticky top-0 z-10">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="w-[60px] bg-slate-950 text-center">{t('importPage.table.headers.imgQty')}</TableHead>
                                            <TableHead className="min-w-[280px] bg-slate-950">{t('importPage.table.headers.cardSet')}</TableHead>
                                            <TableHead className="w-[160px] bg-slate-950">{t('importPage.table.headers.variantPrice')}</TableHead>
                                            <TableHead className="w-[180px] bg-slate-950">{t('importPage.table.headers.classification')}</TableHead>
                                            <TableHead className="min-w-[280px] bg-slate-950">{t('importPage.table.headers.data')}</TableHead>
                                            <TableHead className="w-[40px] bg-slate-950"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editedItems.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-slate-900/40 border-slate-800/50 group align-top">
                                                {/* Img & Qty */}
                                                <TableCell className="text-center py-4">
                                                    <div className="flex flex-col items-center gap-2">
                                                        {item.dbImage ? (
                                                            <div className="relative h-14 w-10.5 rounded overflow-hidden border border-slate-700 shadow-sm transition-transform group-hover:scale-110">
                                                                <Image src={item.dbImage} alt="" fill className="object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="h-14 w-10.5 bg-slate-800/50 rounded flex items-center justify-center border border-slate-800 border-dashed">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                                            </div>
                                                        )}
                                                        <div className="w-12">
                                                            <Input
                                                                type="number"
                                                                className="h-7 bg-slate-900/50 border-slate-800 focus:border-slate-700 text-center px-1 text-xs"
                                                                value={item.quantity}
                                                                onChange={(e) => handleUpdateItem(item.id, "quantity", parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Carta & Set */}
                                                <TableCell className="py-4 space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <Input
                                                            className="h-9 bg-transparent border-slate-800 hover:bg-slate-900 focus:bg-slate-900 focus:border-blue-500 font-medium px-3 text-sm"
                                                            value={item.name}
                                                            onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                                                            placeholder={t('importPage.table.placeholders.cardName')}
                                                        />
                                                        {item.cardId && (
                                                            <div className="mt-2.5">
                                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* Set Selector */}
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "h-8 flex-1 justify-between font-normal text-xs bg-slate-900/50 border-slate-800",
                                                                        !item.setName && "text-muted-foreground",
                                                                        item.cardId && "border-emerald-900/30 text-emerald-400"
                                                                    )}
                                                                >
                                                                    <span className="truncate">
                                                                        {item.setName || t('importPage.table.placeholders.selectSet')}
                                                                    </span>
                                                                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[300px] p-0 bg-slate-950 border-slate-800">
                                                                <Command className="bg-slate-950 text-white">
                                                                    <CommandInput placeholder={t('importPage.table.placeholders.searchSet')} className="h-9" />
                                                                    <CommandList>
                                                                        <CommandEmpty>{t('importPage.table.placeholders.noSet')}</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {sets.map((set) => (
                                                                                <CommandItem
                                                                                    key={set.id}
                                                                                    value={set.name}
                                                                                    onSelect={(currentValue) => {
                                                                                        handleSetChange(item.id, set.name);
                                                                                    }}
                                                                                    className="text-xs data-[selected=true]:bg-slate-800 data-[selected=true]:text-white"
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            item.setName === set.name ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    <div className="flex flex-col">
                                                                                        <span>{set.name}</span>
                                                                                        <span className="text-[10px] text-slate-500">{set.id}</span>
                                                                                    </div>
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>

                                                        {item.isShipping ? (
                                                            <Badge variant="secondary" className="h-8 px-2 flex items-center whitespace-nowrap text-[10px]">Gastos de Envío</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="h-8 px-2 flex items-center whitespace-nowrap text-[10px] bg-slate-900/50 border-slate-800 text-slate-400">
                                                                {item.condition || "?"}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* Variant & Price */}
                                                <TableCell className="py-4 space-y-2">
                                                    <Select
                                                        value={item.variant || "default"}
                                                        onValueChange={(val) => handleUpdateItem(item.id, "variant", val === "default" ? undefined : val)}
                                                    >
                                                        <SelectTrigger className="h-9 w-full border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-xs px-3">
                                                            <SelectValue placeholder="Global" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="default" className="text-slate-400 font-medium">
                                                                {`-- Global (${targetVariant === 'default' ? 'Auto' : targetVariant}) --`}
                                                            </SelectItem>
                                                            <SelectItem value="normal">{t('variants.normal')}</SelectItem>
                                                            <SelectItem value="holo">{t('variants.holofoil')}</SelectItem>
                                                            <SelectItem value="reverse holo">{t('variants.reverseHolofoil')}</SelectItem>
                                                            <SelectItem value="first edition">Primera Edición</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="h-9 bg-slate-900/50 border-slate-800 focus:border-slate-700 text-right pr-6 font-mono font-medium"
                                                            value={item.price}
                                                            onChange={(e) => handleUpdateItem(item.id, "price", parseFloat(e.target.value))}
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-slate-500 text-xs">€</span>
                                                    </div>
                                                </TableCell>

                                                {/* Classification */}
                                                <TableCell className="py-4 space-y-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-semibold pl-1">{t('common.collection')}</label>
                                                        <Select
                                                            value={item.collectionId || "default"}
                                                            onValueChange={(val) => handleUpdateItem(item.id, "collectionId", val === "default" ? undefined : val)}
                                                        >
                                                            <SelectTrigger className="h-8 w-full border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-xs px-2">
                                                                <SelectValue placeholder="Global" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="default" className="text-slate-400 font-medium">
                                                                    {targetCollection === "none"
                                                                        ? `-- Global (${t('common.none')}) --`
                                                                        : `-- Global (${collections.find(c => c.id === targetCollection)?.name || '...'}) --`
                                                                    }
                                                                </SelectItem>
                                                                {collections.map(c => (
                                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-semibold pl-1">{t('common.budgets')}</label>
                                                        <Select
                                                            value={item.budgetId || "default"}
                                                            onValueChange={(val) => handleUpdateItem(item.id, "budgetId", val === "default" ? undefined : val)}
                                                        >
                                                            <SelectTrigger className="h-8 w-full border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-xs px-2">
                                                                <SelectValue placeholder="Global" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="default" className="text-slate-400 font-medium">
                                                                    {targetBudget === "none"
                                                                        ? `-- Global (${t('common.none')}) --`
                                                                        : `-- Global (${budgets.find(b => b.id === targetBudget)?.name || '...'}) --`
                                                                    }
                                                                </SelectItem>
                                                                {budgets.map(b => (
                                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </TableCell>

                                                {/* Additional Data */}
                                                <TableCell className="py-4 space-y-2">
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[10px] text-slate-500 uppercase font-semibold pl-1">{t('importPage.table.placeholders.seller')}</label>
                                                            <Input
                                                                className="h-7 bg-slate-900/30 border-slate-800 text-xs px-2"
                                                                placeholder={t('importPage.table.placeholders.seller') + "..."}
                                                                value={item.seller || ""}
                                                                onChange={(e) => handleUpdateItem(item.id, "seller", e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="w-[110px] space-y-1">
                                                            <label className="text-[10px] text-slate-500 uppercase font-semibold pl-1">{t('cardDetail.date')}</label>
                                                            <Input
                                                                type="date"
                                                                className="h-7 bg-slate-900/30 border-slate-800 text-xs px-2"
                                                                value={item.orderDate || ""}
                                                                onChange={(e) => handleUpdateItem(item.id, "orderDate", e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-slate-500 uppercase font-semibold pl-1">{t('importPage.table.placeholders.notes')}</label>
                                                        <Input
                                                            className="h-8 bg-slate-900/30 border-slate-800 text-xs px-2 w-full"
                                                            placeholder={t('importPage.table.placeholders.notes') + "..."}
                                                            value={item.userNotes || ""}
                                                            onChange={(e) => handleUpdateItem(item.id, "userNotes", e.target.value)}
                                                        />
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-4 align-middle">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
