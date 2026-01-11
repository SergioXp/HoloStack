"use client";

import { useState, useEffect } from "react";
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
    Languages
} from "lucide-react";
import { useI18n, APP_LANGUAGES, CARD_LANGUAGES, type Locale, type CardLanguage } from "@/lib/i18n";

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-slate-950 to-blue-900/10" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("common.back")}
                        </Link>

                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Settings className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">{t("settings.title")}</h1>
                                <p className="text-slate-400">{t("settings.subtitle")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Profile Section */}
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 text-white overflow-hidden">
                            <CardHeader className="border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{t("settings.profile.title")}</CardTitle>
                                        <CardDescription className="text-slate-400">{t("settings.profile.description")}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName" className="text-sm text-slate-300">{t("settings.profile.displayName")}</Label>
                                    <Input
                                        id="displayName"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder={t("settings.profile.displayNamePlaceholder")}
                                        className="bg-slate-800 border-slate-700 text-white h-11 rounded-xl"
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
                                                        ? "border-purple-500 bg-purple-500/10"
                                                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{lang.name}</span>
                                                    {selectedAppLang === lang.code && (
                                                        <Check className="h-4 w-4 text-purple-400" />
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
                                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20"
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
        </div>
    );
}
