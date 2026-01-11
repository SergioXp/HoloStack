"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ChevronRight,
    Settings,
    User,
    Globe,
    ShoppingBag,
    Save,
    Check,
    Languages,
    Palette,
    Database,
    Download,
    Upload,
    AlertTriangle,
    Coins
} from "lucide-react";
import { useI18n, APP_LANGUAGES, CARD_LANGUAGES, type Locale, type CardLanguage } from "@/lib/i18n";
import { type Currency } from "@/lib/prices";

const CURRENCIES: { code: Currency; name: string; symbol: string }[] = [
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "GBP", name: "British Pound", symbol: "£" },
];

interface UserProfile {
    id: string;
    displayName: string | null;
    appLanguage: string;
    cardLanguage: string;
    cardmarketUsername: string | null;
    tcgplayerUsername: string | null;
    ebayUsername: string | null;
    preferredCurrency: string | null;
}

export default function SettingsPage() {
    const { t, locale, setLocale, cardLanguage, setCardLanguage } = useI18n();
    const { theme, setTheme } = useTheme();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState("");
    const [selectedAppLang, setSelectedAppLang] = useState<Locale>(locale);
    const [selectedCardLang, setSelectedCardLang] = useState<CardLanguage>(cardLanguage);
    const [cardmarketUsername, setCardmarketUsername] = useState("");
    const [tcgplayerUsername, setTcgplayerUsername] = useState("");
    const [ebayUsername, setEbayUsername] = useState("");
    const [preferredCurrency, setPreferredCurrency] = useState<Currency>("EUR");
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load profile
    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    setDisplayName(data.displayName || "");
                    setSelectedAppLang(data.appLanguage as Locale || "es");
                    setSelectedCardLang(data.cardLanguage as CardLanguage || "en");
                    setCardmarketUsername(data.cardmarketUsername || "");
                    setTcgplayerUsername(data.tcgplayerUsername || "");
                    setEbayUsername(data.ebayUsername || "");
                    setPreferredCurrency((data.preferredCurrency as Currency) || "EUR");
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSaved(false);

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName,
                    appLanguage: selectedAppLang,
                    cardLanguage: selectedCardLang,
                    cardmarketUsername: cardmarketUsername || null,
                    tcgplayerUsername: tcgplayerUsername || null,
                    ebayUsername: ebayUsername || null,
                    preferredCurrency: preferredCurrency,
                }),
            });

            if (res.ok) {
                // Update i18n context
                setLocale(selectedAppLang);
                setCardLanguage(selectedCardLang);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch("/api/backup/export");
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `holostack-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting data:", error);
            // Aquí idealmente mostraríamos un toast de error
        }
    };

    const handleImportClick = () => {
        if (confirm(t("settings.data.warning"))) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const json = JSON.parse(text);

            const res = await fetch("/api/backup/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(json),
            });

            if (res.ok) {
                window.location.reload();
            } else {
                throw new Error("Import failed");
            }
        } catch (error) {
            console.error("Error importing data:", error);
            alert("Error importing data. Check console for details.");
            setIsImporting(false);
        } finally {
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-300">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-secondary/5" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("common.back")}
                        </Link>

                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/20">
                                <Settings className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("settings.title")}</h1>
                                <p className="text-muted-foreground">{t("settings.subtitle")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Profile Section */}
                        <Card className="bg-card backdrop-blur-sm border-border text-foreground overflow-hidden">
                            <CardHeader className="border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{t("settings.profile.title")}</CardTitle>
                                        <CardDescription className="text-muted-foreground">{t("settings.profile.description")}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName" className="text-sm text-muted-foreground">{t("settings.profile.displayName")}</Label>
                                    <Input
                                        id="displayName"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder={t("settings.profile.displayNamePlaceholder")}
                                        className="bg-muted/50 border-input text-foreground h-11 rounded-xl focus:ring-primary"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Language Section */}
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 text-white overflow-hidden">
                            <CardHeader className="border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <Languages className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{t("settings.language.title")}</CardTitle>
                                        <CardDescription className="text-slate-400">{t("settings.language.description")}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-300">{t("settings.language.appLanguage")}</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {APP_LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => setSelectedAppLang(lang.code)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedAppLang === lang.code
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border bg-muted/30 hover:border-primary/50"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{lang.name}</span>
                                                    {selectedAppLang === lang.code && (
                                                        <Check className="h-4 w-4 text-primary" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-300">{t("settings.language.cardLanguage")}</Label>
                                    <p className="text-xs text-slate-500 mb-3">{t("settings.language.cardLanguageHint")}</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CARD_LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => setSelectedCardLang(lang.code)}
                                                className={`p-3 rounded-xl border transition-all text-center text-sm ${selectedCardLang === lang.code
                                                    ? "border-purple-500 bg-purple-500/10 text-white"
                                                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600 text-slate-400"
                                                    }`}
                                            >
                                                {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Currency Section */}
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 text-white overflow-hidden">
                            <CardHeader className="border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <Coins className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Moneda</CardTitle>
                                        <CardDescription className="text-slate-400">Elige tu moneda preferida para ver precios</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-3 gap-3">
                                    {CURRENCIES.map((curr) => (
                                        <button
                                            key={curr.code}
                                            onClick={() => setPreferredCurrency(curr.code)}
                                            className={`p-4 rounded-xl border transition-all text-center ${preferredCurrency === curr.code
                                                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                                                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600 text-slate-400"
                                                }`}
                                        >
                                            <div className="text-2xl font-bold mb-1">{curr.symbol}</div>
                                            <div className="text-sm">{curr.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appearance Section */}
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 text-white overflow-hidden">
                            <CardHeader className="border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <Palette className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Apariencia</CardTitle>
                                        <CardDescription className="text-slate-400">Personaliza el tema de HoloStack</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                    {[
                                        { id: "dark", name: "Original", bg: "bg-slate-950", border: "border-slate-700" },
                                        { id: "fire", name: "Fuego", bg: "bg-red-950", border: "border-red-700" },
                                        { id: "water", name: "Agua", bg: "bg-blue-950", border: "border-blue-700" },
                                        { id: "grass", name: "Planta", bg: "bg-green-950", border: "border-green-700" },
                                        { id: "electric", name: "Eléctrico", bg: "bg-yellow-950", border: "border-yellow-700" },
                                        { id: "psychic", name: "Psíquico", bg: "bg-fuchsia-950", border: "border-fuchsia-700" },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id)}
                                            className={`relative h-20 rounded-xl border-2 transition-all ${t.bg} ${t.border} ${theme === t.id ? "ring-2 ring-white scale-105" : "hover:scale-105 opacity-80 hover:opacity-100"
                                                }`}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-medium text-white/90">{t.name}</span>
                                            </div>
                                            {theme === t.id && (
                                                <div className="absolute top-2 right-2 bg-white text-black rounded-full p-0.5">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Marketplace Accounts Section */}
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 text-white overflow-hidden">
                            <CardHeader className="border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <ShoppingBag className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{t("settings.marketplace.title")}</CardTitle>
                                        <CardDescription className="text-slate-400">{t("settings.marketplace.description")}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cardmarket" className="text-sm text-slate-300 flex items-center gap-2">
                                        <Badge className="bg-blue-600 text-white text-[10px] border-0">Cardmarket</Badge>
                                        {t("settings.marketplace.cardmarket")}
                                    </Label>
                                    <Input
                                        id="cardmarket"
                                        value={cardmarketUsername}
                                        onChange={(e) => setCardmarketUsername(e.target.value)}
                                        placeholder={t("settings.marketplace.cardmarketPlaceholder")}
                                        className="bg-slate-800 border-slate-700 text-white h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tcgplayer" className="text-sm text-slate-300 flex items-center gap-2">
                                        <Badge className="bg-green-600 text-white text-[10px] border-0">TCGPlayer</Badge>
                                        {t("settings.marketplace.tcgplayer")}
                                    </Label>
                                    <Input
                                        id="tcgplayer"
                                        value={tcgplayerUsername}
                                        onChange={(e) => setTcgplayerUsername(e.target.value)}
                                        placeholder={t("settings.marketplace.tcgplayerPlaceholder")}
                                        className="bg-slate-800 border-slate-700 text-white h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="ebay" className="text-sm text-slate-300 flex items-center gap-2">
                                        <Badge className="bg-yellow-600 text-white text-[10px] border-0">eBay</Badge>
                                        {t("settings.marketplace.ebay")}
                                    </Label>
                                    <Input
                                        id="ebay"
                                        value={ebayUsername}
                                        onChange={(e) => setEbayUsername(e.target.value)}
                                        placeholder={t("settings.marketplace.ebayPlaceholder")}
                                        className="bg-slate-800 border-slate-700 text-white h-11 rounded-xl"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data Management Section */}
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 text-white overflow-hidden">
                            <CardHeader className="border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <Database className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{t("settings.data.title")}</CardTitle>
                                        <CardDescription className="text-slate-400">{t("settings.data.description")}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-200 mb-4">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <p className="text-sm">{t("settings.data.warning")}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={handleExport}
                                        className="h-12 border-slate-700 hover:bg-slate-800 text-slate-200 hover:text-white"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {t("settings.data.export")}
                                    </Button>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept=".json"
                                            className="hidden"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={handleImportClick}
                                            disabled={isImporting}
                                            className="w-full h-12 border-slate-700 hover:bg-slate-800 text-slate-200 hover:text-white"
                                        >
                                            {isImporting ? (
                                                <div className="flex items-center">
                                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
                                                    {t("settings.data.importing")}
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {t("settings.data.import")}
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Save Button */}
                        <div className="flex items-center justify-between pt-4">
                            {saved && (
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                    <Check className="h-4 w-4" />
                                    {t("settings.saved")}
                                </div>
                            )}
                            <div className="flex-1" />
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20"
                            >
                                {isSaving ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t("settings.saving")}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="h-4 w-4" />
                                        {t("settings.saveChanges")}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
