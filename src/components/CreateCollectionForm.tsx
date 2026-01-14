"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CheckIcon, ChevronsUpDown, ChevronRight, Library, Sparkles, Wand2, Globe, LayoutGrid, ArrowRight, Album } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n, CARD_LANGUAGES, type CardLanguage } from "@/lib/i18n";
import { PREDEFINED_COLLECTIONS, type PredefinedCollection } from "@/lib/predefined-collections";


interface PreviewCard {
    id: string;
    name: string;
    images: string; // JSON string
    rarity: string;
    number: string;
    setTotal: number;
}

interface SetOption {
    id: string;
    name: string;
    total: number;
    printedTotal: number;
    images: string | null;
}

interface CreateCollectionFormProps {
    availableSets: SetOption[];
}

export default function CreateCollectionForm({ availableSets }: CreateCollectionFormProps) {
    const router = useRouter();
    const { t, cardLanguage } = useI18n();
    const [isLoading, setIsLoading] = useState(false);

    // Modes: manual, auto, predefined
    const [mode, setMode] = useState<"manual" | "auto" | "predefined">("predefined");
    const [autoModeType, setAutoModeType] = useState<"set" | "name" | "supertype" | "rarity">("set");
    const [name, setName] = useState("");

    // Auto Mode States
    const [selectedSet, setSelectedSet] = useState("");
    const [selectedRarity, setSelectedRarity] = useState("");
    const [customValue, setCustomValue] = useState("");

    // Predefined Mode States
    const [selectedPredefinedId, setSelectedPredefinedId] = useState<string | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

    // Language setting for the collection
    const [useProfileLanguage, setUseProfileLanguage] = useState(true);
    const [collectionLanguage, setCollectionLanguage] = useState<CardLanguage>(cardLanguage);

    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    // Preview State
    const [previewCards, setPreviewCards] = useState<PreviewCard[]>([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Fetch Preview Cards
    // Fetch Preview Cards
    const fetchPreview = async () => {
        const params = new URLSearchParams();

        if (mode === 'manual') {
            setPreviewCards([]);
            return;
        }

        if (mode === 'predefined') {
            const currentPredefined = PREDEFINED_COLLECTIONS.find(c => c.id === selectedPredefinedId);
            if (!currentPredefined || !selectedVariantId) return;

            const variant = currentPredefined.variants.find(v => v.id === selectedVariantId);
            if (!variant) return;

            const filters = variant.filterGenerator();

            if (filters.set) params.set('setId', filters.set);

            if (filters.series) {
                const series = Array.isArray(filters.series) ? filters.series : [filters.series];
                params.set('series', series.join(','));
            }

            if (filters.rarity) {
                const rarities = Array.isArray(filters.rarity) ? filters.rarity : [filters.rarity];
                params.set('rarities', rarities.join(','));
            }

            if (filters.supertype) params.set('supertype', filters.supertype);

            // Handle Names
            if (filters.names && filters.names.length > 0) {
                const shuffled = [...filters.names].sort(() => 0.5 - Math.random());
                params.set('names', shuffled.slice(0, 10).join(','));
            } else if (filters.name) {
                params.set('names', filters.name);
            }

            // Handle Generation
            if ((filters as any).generation) {
                const genId = (filters as any).generation;
                const getGenSamples = (id: string) => {
                    switch (id) {
                        case "gen1": return ["Charizard", "Blastoise", "Venusaur", "Pikachu"];
                        case "gen2": return ["Typhlosion", "Feraligatr", "Meganium", "Lugia"];
                        case "gen3": return ["Blaziken", "Swampert", "Sceptile", "Rayquaza"];
                        case "gen4": return ["Infernape", "Empoleon", "Torterra", "Lucario"];
                        case "gen5": return ["Emboar", "Samurott", "Serperior", "Zoroark"];
                        case "gen6": return ["Delphox", "Greninja", "Chesnaught", "Sylveon"];
                        case "gen7": return ["Incineroar", "Primarina", "Decidueye", "Mimikyu"];
                        case "gen8": return ["Cinderace", "Inteleon", "Rillaboom", "Dragapult"];
                        case "gen9": return ["Skeledirge", "Quaquaval", "Meowscarada", "Tinkaton"];
                        default: return ["Charizard", "Pikachu", "Mewtwo", "Gengar"];
                    }
                };
                params.set('names', getGenSamples(genId).join(','));
            }

        } else if (mode === 'auto') {
            // Auto Mode
            if (autoModeType === 'set' && selectedSet) {
                params.set('setId', selectedSet);
                if (selectedRarity) params.set('rarity', selectedRarity);
            } else if (autoModeType === 'name' && customValue.length >= 2) {
                params.set('name', customValue);
            } else if (autoModeType === 'supertype' && customValue) {
                params.set('supertype', customValue);
            } else if (autoModeType === 'rarity' && customValue) {
                params.set('rarity', customValue);
            } else {
                setPreviewCards([]);
                return;
            }
        }

        setPreviewLoading(true);
        try {
            const res = await fetch(`/api/cards/preview?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setPreviewCards(data);
            }
        } catch (error) {
            console.error("Failed to fetch preview", error);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 500);
        return () => clearTimeout(timer);
    }, [mode, autoModeType, selectedSet, selectedRarity, customValue, selectedPredefinedId, selectedVariantId]);

    // Search effect for Auto Name
    useEffect(() => {
        if (mode !== "auto" || autoModeType !== "name" || !customValue || customValue.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`/api/cards/names?q=${encodeURIComponent(customValue)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setSearchLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [customValue, autoModeType, mode]);


    // Handle Predefined Selection
    const handlePredefinedSelect = (collection: PredefinedCollection) => {
        setSelectedPredefinedId(collection.id);
        // Select first variant default
        if (collection.variants.length > 0) {
            handleVariantSelect(collection, collection.variants[0].id);
        }
    };

    const handleVariantSelect = (collection: PredefinedCollection, variantId: string) => {
        setSelectedVariantId(variantId);

        // Auto-fill name
        const variantKey = collection.variants.find(v => v.id === variantId)?.nameKey;
        const variantName = variantKey ? t(variantKey) : "";
        const baseName = t(collection.nameKey);

        // If variant name is "All" or "Todo", just use base name, otherwise append
        if (variantId === "all") {
            setName(`${baseName}`);
        } else {
            setName(`${baseName} (${variantName})`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let filters = null;
            let type: string = mode;

            if (mode === "auto") {
                if (autoModeType === "set") {
                    filters = { set: selectedSet, rarity: selectedRarity || undefined };
                } else if (autoModeType === "name") {
                    filters = { name: customValue };
                } else if (autoModeType === "supertype") {
                    filters = { supertype: customValue };
                } else if (autoModeType === "rarity") {
                    filters = { rarity: customValue };
                }
            } else if (mode === "predefined") {
                // Check for Generic 151 special variant inside Original 151
                if (selectedPredefinedId === "original-151" && selectedVariantId === "generic") {
                    type = "generic_151";
                    // No filters needed
                } else if (selectedPredefinedId === "generational-binder") {
                    type = "generic_151"; // Use the same slot-based engine

                    // But we MUST load the filters (generation) from the variant
                    const collection = PREDEFINED_COLLECTIONS.find(c => c.id === selectedPredefinedId);
                    const variant = collection?.variants.find(v => v.id === selectedVariantId);

                    if (variant) {
                        filters = variant.filterGenerator();
                    }
                } else {
                    type = "auto";
                    const collection = PREDEFINED_COLLECTIONS.find(c => c.id === selectedPredefinedId);
                    const variant = collection?.variants.find(v => v.id === selectedVariantId);

                    if (collection && variant) {
                        filters = variant.filterGenerator();
                    } else {
                        throw new Error("Invalid predefined selection");
                    }
                }
            }

            const payload = {
                name,
                type: type === "predefined" ? "auto" : type, // Normalize
                filters,
                language: useProfileLanguage ? null : collectionLanguage
            };

            const res = await fetch("/api/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Error creating collection");

            const data = await res.json();
            router.push(`/collections/${data.id}`);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert(t("common.error"));
        } finally {
            setIsLoading(false);
        }
    };

    const currentPredefined = PREDEFINED_COLLECTIONS.find(c => c.id === selectedPredefinedId);

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-br from-purple-900/10 via-slate-950 to-blue-900/10" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/collections" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("collectionDetail.backToCollections")}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Column: Form */}
                        <div className="lg:col-span-2">
                            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 text-white overflow-hidden shadow-2xl">
                                <div className="h-1 w-full bg-linear-to-r from-purple-500 to-pink-500" />

                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                            <Library className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl">{t("collectionForm.title")}</CardTitle>
                                            <CardDescription className="text-slate-400">
                                                {t("collectionForm.subtitle")}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-8">

                                        {/* 1. Type Selection */}
                                        <div className="space-y-3">
                                            <Label className="text-white text-sm font-medium">{t("collectionForm.typeLabel")}</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Predefined Option */}
                                                <div
                                                    onClick={() => setMode("predefined")}
                                                    className={cn(
                                                        "cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 relative group",
                                                        mode === "predefined"
                                                            ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                                    )}
                                                >
                                                    <Badge className="absolute -top-2 right-3 bg-amber-500 text-black border-0 text-[10px] font-bold">
                                                        Top Picks
                                                    </Badge>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                            mode === "predefined" ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-400 group-hover:text-white"
                                                        )}>
                                                            <LayoutGrid className="h-4 w-4" />
                                                        </div>
                                                        <h3 className="font-semibold">{t("predefined.title")}</h3>
                                                    </div>
                                                    <p className="text-xs text-slate-400">{t("collectionForm.predefined.description")}</p>
                                                </div>

                                                {/* Auto Option */}
                                                <div
                                                    onClick={() => setMode("auto")}
                                                    className={cn(
                                                        "cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 relative group",
                                                        mode === "auto"
                                                            ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                            mode === "auto" ? "bg-purple-500" : "bg-slate-700 text-slate-400 group-hover:text-white"
                                                        )}>
                                                            <Wand2 className="h-4 w-4 text-white" />
                                                        </div>
                                                        <h3 className="font-semibold">{t("collectionForm.auto.title")}</h3>
                                                    </div>
                                                    <p className="text-xs text-slate-400">{t("collectionForm.auto.description")}</p>
                                                </div>

                                                {/* Manual Option */}
                                                <div
                                                    onClick={() => setMode("manual")}
                                                    className={cn(
                                                        "cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 group",
                                                        mode === "manual"
                                                            ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                            mode === "manual" ? "bg-blue-500" : "bg-slate-700 text-slate-400 group-hover:text-white"
                                                        )}>
                                                            <Library className="h-4 w-4 text-white" />
                                                        </div>
                                                        <h3 className="font-semibold">{t("collectionForm.manual.title")}</h3>
                                                    </div>
                                                    <p className="text-xs text-slate-400">{t("collectionForm.manual.description")}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Logic for Predefined */}
                                        {mode === "predefined" && (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                    {PREDEFINED_COLLECTIONS.map((col) => {
                                                        const Icon = col.icon;
                                                        const isSelected = selectedPredefinedId === col.id;
                                                        return (
                                                            <div
                                                                key={col.id}
                                                                onClick={() => handlePredefinedSelect(col)}
                                                                className={cn(
                                                                    "cursor-pointer p-3 rounded-xl border transition-all hover:scale-[1.02]",
                                                                    isSelected
                                                                        ? "border-amber-500 bg-amber-500/20 shadow-md"
                                                                        : "border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800"
                                                                )}
                                                            >
                                                                <div className="flex flex-col items-center text-center gap-2">
                                                                    <div className={cn(
                                                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                                                        isSelected ? "bg-amber-500 text-black" : "bg-slate-700 text-slate-300"
                                                                    )}>
                                                                        <Icon className="h-5 w-5" />
                                                                    </div>
                                                                    <span className="text-xs font-medium leading-tight">{t(col.nameKey)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {currentPredefined && (
                                                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 space-y-4">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                                {t(currentPredefined.nameKey)}
                                                                {selectedVariantId && (
                                                                    <span className="text-slate-400 text-sm font-normal">
                                                                        • {t(currentPredefined.variants.find(v => v.id === selectedVariantId)?.nameKey || "")}
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            <p className="text-sm text-slate-400 mt-1">{t(currentPredefined.descriptionKey)}</p>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase text-slate-500 font-bold tracking-wider">{t("cardDetail.variant")}</Label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {currentPredefined.variants.map(variant => (
                                                                    <button
                                                                        key={variant.id}
                                                                        type="button"
                                                                        onClick={() => handleVariantSelect(currentPredefined, variant.id)}
                                                                        className={cn(
                                                                            "px-4 py-2 rounded-lg text-sm transition-all border",
                                                                            selectedVariantId === variant.id
                                                                                ? "bg-amber-500 text-black border-amber-500 font-medium"
                                                                                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600"
                                                                        )}
                                                                    >
                                                                        {t(variant.nameKey)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Auto Mode Options */}
                                        {mode === "auto" && (
                                            <div className="space-y-4 p-5 bg-slate-800/30 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
                                                <Tabs defaultValue="set" onValueChange={(v) => {
                                                    setAutoModeType(v as any);
                                                    setCustomValue("");
                                                }}>
                                                    <TabsList className="bg-slate-900 p-1 border border-slate-700 w-full grid grid-cols-4 rounded-xl h-auto">
                                                        <TabsTrigger
                                                            value="set"
                                                            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 rounded-lg py-2"
                                                        >{t("collectionForm.filterBySet")}</TabsTrigger>
                                                        <TabsTrigger
                                                            value="name"
                                                            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 rounded-lg py-2"
                                                        >{t("collectionForm.filterByName")}</TabsTrigger>
                                                        <TabsTrigger
                                                            value="supertype"
                                                            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 rounded-lg py-2"
                                                        >{t("collectionForm.filterByType")}</TabsTrigger>
                                                        <TabsTrigger
                                                            value="rarity"
                                                            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 rounded-lg py-2"
                                                        >{t("collectionForm.filterByRarity")}</TabsTrigger>
                                                    </TabsList>

                                                    <TabsContent value="set" className="space-y-4 pt-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="set" className="text-white text-sm">{t("common.set")}</Label>
                                                            <select
                                                                id="set"
                                                                value={selectedSet}
                                                                onChange={(e) => setSelectedSet(e.target.value)}
                                                                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            >
                                                                <option value="">{t("collectionForm.selectSet")}</option>
                                                                {availableSets.map(set => (
                                                                    <option key={set.id} value={set.id}>
                                                                        {set.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="rarity" className="text-white text-sm">{t("collectionForm.selectRarity")}</Label>
                                                            <select
                                                                id="rarity"
                                                                value={selectedRarity}
                                                                onChange={(e) => setSelectedRarity(e.target.value)}
                                                                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            >
                                                                <option value="">{t("collectionForm.anyRarity")}</option>
                                                                <option value="Common">{t("rarities.Common")}</option>
                                                                <option value="Uncommon">{t("rarities.Uncommon")}</option>
                                                                <option value="Rare">{t("rarities.Rare")}</option>
                                                                <option value="Rare Holo">{t("rarities.RareHolo")}</option>
                                                                <option value="Rare Ultra">{t("rarities.RareUltra")}</option>
                                                                <option value="Rare Secret">{t("rarities.RareSecret")}</option>
                                                            </select>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="name" className="space-y-4 pt-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-white text-sm">{t("collectionForm.pokemonName")}</Label>
                                                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        aria-expanded={openCombobox}
                                                                        className="w-full justify-between bg-slate-900 border-slate-700 text-white hover:bg-slate-800 hover:text-white h-12 rounded-xl"
                                                                    >
                                                                        {customValue
                                                                            ? customValue
                                                                            : t("collectionForm.searchName")}
                                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-full p-0 bg-slate-900 border-slate-700">
                                                                    <Command className="bg-slate-900 text-white">
                                                                        <CommandInput
                                                                            placeholder={t("collectionForm.searchPlaceholderExample")}
                                                                            value={customValue}
                                                                            onValueChange={setCustomValue}
                                                                            className="text-white placeholder:text-slate-500"
                                                                        />
                                                                        <CommandList>
                                                                            {searchLoading && <div className="py-2 px-2 text-xs text-slate-500">{t("common.loading")}</div>}
                                                                            {!searchLoading && searchResults.length === 0 && customValue.length > 2 && (
                                                                                <CommandEmpty>{t("collectionDetail.noResults.title")}</CommandEmpty>
                                                                            )}
                                                                            <CommandGroup>
                                                                                {searchResults.map((result) => (
                                                                                    <CommandItem
                                                                                        key={result}
                                                                                        value={result}
                                                                                        onSelect={(currentValue) => {
                                                                                            setCustomValue(currentValue);
                                                                                            setOpenCombobox(false);
                                                                                        }}
                                                                                        className="text-white hover:bg-slate-800"
                                                                                    >
                                                                                        <CheckIcon
                                                                                            className={cn(
                                                                                                "mr-2 h-4 w-4",
                                                                                                customValue === result ? "opacity-100" : "opacity-0"
                                                                                            )}
                                                                                        />
                                                                                        {result}
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <p className="text-xs text-slate-500">{t("collectionForm.autocompleteBased")}</p>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="supertype" className="space-y-4 pt-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="supertype" className="text-white text-sm">{t("collectionForm.supertype")}</Label>
                                                            <select
                                                                id="supertype"
                                                                value={customValue}
                                                                onChange={(e) => setCustomValue(e.target.value)}
                                                                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            >
                                                                <option value="">{t("collectionForm.select")}</option>
                                                                <option value="Pokemon">{t("types.Pokemon")}</option>
                                                                <option value="Trainer">{t("types.Trainer")}</option>
                                                                <option value="Energy">{t("types.Energy")}</option>
                                                            </select>
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="rarity" className="space-y-4 pt-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="global-rarity" className="text-white text-sm">{t("collectionForm.globalRarity")}</Label>
                                                            <select
                                                                id="global-rarity"
                                                                value={customValue}
                                                                onChange={(e) => setCustomValue(e.target.value)}
                                                                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            >
                                                                <option value="">{t("collectionForm.select")}</option>
                                                                <option value="Common">{t("rarities.Common")}</option>
                                                                <option value="Uncommon">{t("rarities.Uncommon")}</option>
                                                                <option value="Rare">{t("rarities.Rare")}</option>
                                                                <option value="Rare Holo">{t("rarities.RareHolo")}</option>
                                                                <option value="Ultra Rare">{t("rarities.RareUltra")}</option>
                                                                <option value="Secret Rare">{t("rarities.RareSecret")}</option>
                                                                <option value="Illustration rare">{t("rarities.IllustrationRare")}</option>
                                                            </select>
                                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Sparkles className="h-3 w-3" />
                                                                {t("collectionForm.manyCardsWarning")}
                                                            </p>
                                                        </div>
                                                    </TabsContent>
                                                </Tabs>
                                            </div>
                                        )}

                                        {/* Common: Name Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-white text-sm font-medium">{t("collectionForm.nameLabel")}</Label>
                                            <Input
                                                id="name"
                                                placeholder={t("collectionForm.namePlaceholder")}
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                className="bg-slate-800 border-slate-700 text-white h-12 rounded-xl focus:border-purple-500 focus:ring-purple-500/20"
                                            />
                                        </div>

                                        {/* Common: Language Selection */}
                                        <div className="space-y-3 p-5 bg-slate-800/30 rounded-xl border border-slate-700">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                    <Globe className="h-4 w-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <Label className="text-white text-sm font-medium">{t("collectionForm.languageLabel")}</Label>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setUseProfileLanguage(true)}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-left transition-all",
                                                        useProfileLanguage
                                                            ? "border-blue-500 bg-blue-500/10"
                                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">{t("collectionForm.useProfileDefault")}</span>
                                                        {useProfileLanguage && <CheckIcon className="h-4 w-4 text-blue-400" />}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {CARD_LANGUAGES.find(l => l.code === cardLanguage)?.name || cardLanguage}
                                                    </p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setUseProfileLanguage(false)}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-left transition-all",
                                                        !useProfileLanguage
                                                            ? "border-purple-500 bg-purple-500/10"
                                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">{t("common.language")}</span>
                                                        {!useProfileLanguage && <CheckIcon className="h-4 w-4 text-purple-400" />}
                                                    </div>
                                                </button>
                                            </div>

                                            {!useProfileLanguage && (
                                                <div className="grid grid-cols-3 gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                                    {CARD_LANGUAGES.map((lang) => (
                                                        <button
                                                            type="button"
                                                            key={lang.code}
                                                            onClick={() => setCollectionLanguage(lang.code)}
                                                            className={cn(
                                                                "p-2 rounded-lg border text-center text-xs transition-all",
                                                                collectionLanguage === lang.code
                                                                    ? "border-purple-500 bg-purple-500/10 text-white"
                                                                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                                                            )}
                                                        >
                                                            {lang.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            disabled={
                                                isLoading ||
                                                !name ||
                                                (mode === "auto" && autoModeType === "set" && !selectedSet) ||
                                                (mode === "predefined" && !selectedVariantId)
                                            }
                                            className="w-full h-14 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    {t("collectionForm.creating")}
                                                </span>
                                            ) : (
                                                t("collectionForm.createButton")
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Live Preview */}
                        <div className="hidden lg:block sticky top-24 space-y-6">
                            {/* Preview Card */}
                            <div>
                                <h3 className="text-slate-400 font-medium mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    {t("collectionForm.preview.title")}
                                </h3>

                                <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-600 transition-all duration-300 h-full flex flex-col overflow-hidden relative backdrop-blur-sm shadow-2xl skew-y-1 group hover:skew-y-0">
                                    <div className={`absolute top-0 left-0 w-full h-1 ${mode === 'predefined'
                                        ? "bg-linear-to-r from-emerald-500 to-green-400"
                                        : "bg-linear-to-r from-purple-500 to-pink-500"
                                        } opacity-60`} />

                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-xl font-bold text-white line-clamp-1">
                                                    {name || t("collectionForm.namePlaceholder")}
                                                </CardTitle>
                                                {mode === "auto" && selectedSet && (
                                                    <p className="text-xs text-slate-500 mt-1 truncate">
                                                        {availableSets.find(s => s.id === selectedSet)?.name}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className={`shrink-0 capitalize border-0 font-medium ${mode === 'auto'
                                                ? 'bg-purple-500/10 text-purple-300'
                                                : mode === 'manual'
                                                    ? 'bg-blue-500/10 text-blue-300'
                                                    : 'bg-amber-500/10 text-amber-300'
                                                }`}>
                                                {mode === 'auto' ? t("collections.auto") : mode === 'manual' ? t("collections.manual") : "Predefined"}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-slate-500 text-xs mt-2">
                                            {t("collections.createdOn")} {new Date().toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="mt-auto pt-0">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 font-normal">
                                                €0.00
                                            </Badge>
                                        </div>

                                        {mode === 'auto' || mode === 'predefined' ? (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-bold text-white">0</span>
                                                            <span className="text-sm text-slate-500">
                                                                / {mode === 'auto' && selectedSet
                                                                    ? availableSets.find(s => s.id === selectedSet)?.total || "-"
                                                                    : mode === 'predefined'
                                                                        ? currentPredefined?.variants.find(v => v.id === selectedVariantId)?.estimatedCount || "-"
                                                                        : "-"}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{t("common.cards")}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-3xl font-bold text-white">
                                                            0%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-slate-700 w-0"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-3xl font-bold text-white">0</p>
                                                    <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{t("common.cards")}</p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-slate-600" />
                                            </div>
                                        )}
                                    </CardContent>

                                    {/* Simple Card Preview Grid Background */}
                                    {previewCards.length > 0 && (
                                        <div className="absolute inset-x-0 bottom-0 h-32 mask-linear-to-t from-black to-transparent pointer-events-none opacity-20">
                                            <div className="grid grid-cols-4 gap-2 transform translate-y-12 rotate-[-5deg] scale-110">
                                                {previewCards.map((card) => {
                                                    let imgUrl;
                                                    try {
                                                        const images = JSON.parse(card.images);
                                                        imgUrl = images.small;
                                                    } catch (e) { }
                                                    if (!imgUrl) return null;
                                                    return (
                                                        <img key={card.id} src={imgUrl} alt="" className="w-full rounded-md shadow-lg" />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>

                            {/* Detailed Cards Preview */}
                            {(mode === 'auto' || mode === 'predefined') && previewCards.length > 0 && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("collectionForm.preview.exampleCards")}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {previewCards.slice(0, 4).map((card) => {
                                            let imgUrl;
                                            try {
                                                const images = JSON.parse(card.images);
                                                imgUrl = images.small;
                                            } catch (e) { }
                                            return (
                                                <div key={card.id} className="group relative aspect-2/3 rounded-lg overflow-hidden bg-slate-800 ring-1 ring-slate-700 shadow-xl transition-all hover:scale-105 hover:z-10 hover:ring-2 hover:ring-purple-500">
                                                    {imgUrl ? (
                                                        <img src={imgUrl} alt={card.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs p-2 text-center">
                                                            {card.name}
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                                        <p className="text-white text-xs font-bold truncate">{card.name}</p>
                                                        <p className="text-slate-300 text-[10px]">{card.rarity}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-center text-slate-500 italic mt-2">
                                        {t("collectionForm.preview.showingMatches", { count: previewCards.length })}
                                    </p>
                                </div>
                            )}

                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300 shadow-xl shadow-blue-900/10 backdrop-blur-md">
                                <h4 className="font-semibold mb-1 flex items-center gap-2"><Sparkles className="h-4 w-4" /> {t("common.didYouKnow")}</h4>
                                <p className="opacity-80">
                                    {mode === 'auto'
                                        ? t("collectionForm.tips.auto")
                                        : mode === 'manual'
                                            ? t("collectionForm.tips.manual")
                                            : t("collectionForm.tips.predefined")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
