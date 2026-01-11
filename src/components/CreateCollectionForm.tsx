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
import { CheckIcon, ChevronsUpDown, ChevronRight, Library, Sparkles, Wand2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n, CARD_LANGUAGES, type CardLanguage } from "@/lib/i18n";

interface SetOption {
    id: string;
    name: string;
}

interface CreateCollectionFormProps {
    availableSets: SetOption[];
}

export default function CreateCollectionForm({ availableSets }: CreateCollectionFormProps) {
    const router = useRouter();
    const { t, cardLanguage } = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"manual" | "auto">("manual");
    const [autoModeType, setAutoModeType] = useState<"set" | "name" | "supertype" | "rarity">("set");
    const [name, setName] = useState("");

    const [selectedSet, setSelectedSet] = useState("");
    const [selectedRarity, setSelectedRarity] = useState("");
    const [customValue, setCustomValue] = useState("");

    // Language setting for the collection
    const [useProfileLanguage, setUseProfileLanguage] = useState(true);
    const [collectionLanguage, setCollectionLanguage] = useState<CardLanguage>(cardLanguage);

    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (autoModeType !== "name" || !customValue || customValue.length < 2) {
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
    }, [customValue, autoModeType]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let filters = null;

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
            }

            const payload = {
                name,
                type: mode,
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

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-br from-purple-900/10 via-slate-950 to-blue-900/10" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/collections" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("collectionDetail.backToCollections")}
                        </Link>
                    </div>

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
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Input */}
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

                                {/* Type Selection */}
                                <div className="space-y-3">
                                    <Label className="text-white text-sm font-medium">{t("collectionForm.typeLabel")}</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setMode("manual")}
                                            className={cn(
                                                "cursor-pointer p-5 rounded-xl border-2 transition-all duration-200",
                                                mode === "manual"
                                                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                                                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    mode === "manual" ? "bg-blue-500" : "bg-slate-700"
                                                )}>
                                                    <Library className="h-4 w-4 text-white" />
                                                </div>
                                                <h3 className="font-semibold">{t("collectionForm.manual.title")}</h3>
                                            </div>
                                            <p className="text-xs text-slate-400">{t("collectionForm.manual.description")}</p>
                                        </div>

                                        <div
                                            onClick={() => setMode("auto")}
                                            className={cn(
                                                "cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 relative",
                                                mode === "auto"
                                                    ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                                                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                            )}
                                        >
                                            <Badge className="absolute -top-2 right-3 bg-linear-to-r from-purple-500 to-pink-500 text-white border-0 text-[10px]">
                                                {t("collectionForm.auto.recommended")}
                                            </Badge>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    mode === "auto" ? "bg-purple-500" : "bg-slate-700"
                                                )}>
                                                    <Wand2 className="h-4 w-4 text-white" />
                                                </div>
                                                <h3 className="font-semibold">{t("collectionForm.auto.title")}</h3>
                                            </div>
                                            <p className="text-xs text-slate-400">{t("collectionForm.auto.description")}</p>
                                        </div>
                                    </div>
                                </div>

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
                                                        <option value="Common">Common</option>
                                                        <option value="Uncommon">Uncommon</option>
                                                        <option value="Rare">Rare</option>
                                                        <option value="Rare Holo">Rare Holo</option>
                                                        <option value="Rare Ultra">Rare Ultra</option>
                                                        <option value="Rare Secret">Rare Secret</option>
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
                                                                    placeholder="Pikachu..."
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
                                                        <option value="Pokemon">Pokémon</option>
                                                        <option value="Trainer">Trainer</option>
                                                        <option value="Energy">Energy</option>
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
                                                        <option value="Common">Common</option>
                                                        <option value="Uncommon">Uncommon</option>
                                                        <option value="Rare">Rare</option>
                                                        <option value="Rare Holo">Rare Holo</option>
                                                        <option value="Ultra Rare">Ultra Rare</option>
                                                        <option value="Secret Rare">Secret Rare</option>
                                                        <option value="Illustration rare">Illustration Rare (IR/SIR)</option>
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

                                {/* Language Selection */}
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
                                    disabled={isLoading || !name || (mode === "auto" && autoModeType === "set" && !selectedSet)}
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
            </div>
        </div>
    );
}
