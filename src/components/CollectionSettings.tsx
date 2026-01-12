"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings,
    Save,
    Trash2,
    RefreshCw,
    Globe,
    Eye,
    SortAsc,
    Check,
    Loader2,
    AlertTriangle,
    FileText,
    Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n, CARD_LANGUAGES, type CardLanguage } from "@/lib/i18n";

interface Collection {
    id: string;
    name: string;
    description: string | null;
    type: string;
    language: string | null;
    showPrices: boolean | null;
    sortBy: string | null;
    filters: string | null;
}

interface CollectionSettingsProps {
    collection: Collection;
}

export default function CollectionSettings({ collection }: CollectionSettingsProps) {
    const router = useRouter();
    const { t, cardLanguage } = useI18n();

    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [saved, setSaved] = useState(false);

    // Form state
    const [name, setName] = useState(collection.name);
    const [description, setDescription] = useState(collection.description || "");
    const [useProfileLanguage, setUseProfileLanguage] = useState(!collection.language);
    const [selectedLanguage, setSelectedLanguage] = useState<CardLanguage>(
        (collection.language as CardLanguage) || cardLanguage
    );
    const [showPrices, setShowPrices] = useState(collection.showPrices !== false);
    const [sortBy, setSortBy] = useState(collection.sortBy || "number");

    const handleSave = async () => {
        setIsSaving(true);
        setSaved(false);

        try {
            const res = await fetch(`/api/collections/${collection.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    language: useProfileLanguage ? null : selectedLanguage,
                    showPrices,
                    sortBy,
                }),
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => {
                    setSaved(false);
                    router.refresh();
                }, 1500);
            }
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/collections/${collection.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/collections");
                router.refresh();
            }
        } catch (error) {
            console.error("Error deleting:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleResync = async () => {
        if (collection.type !== "auto" || !collection.filters) return;

        setIsSyncing(true);
        setSyncProgress(0);

        try {
            const eventSource = new EventSource(`/api/sync/collection-cards?collectionId=${collection.id}`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.progress) setSyncProgress(data.progress);

                if (data.status === "complete" || data.status === "error") {
                    eventSource.close();
                    setIsSyncing(false);
                    setSyncProgress(100);
                    router.refresh();
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                setIsSyncing(false);
            };
        } catch (error) {
            console.error("Error syncing:", error);
            setIsSyncing(false);
        }
    };

    const sortOptions = [
        { value: "number", label: t("collectionSettings.sortOptions.number") },
        { value: "name", label: t("collectionSettings.sortOptions.name") },
        { value: "rarity", label: t("collectionSettings.sortOptions.rarity") },
        { value: "price", label: t("collectionSettings.sortOptions.price") },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 h-10 w-10 rounded-xl"
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Settings className="h-5 w-5 text-purple-400" />
                        {t("collectionSettings.title")}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {t("collectionSettings.subtitle")}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="bg-slate-800 border border-slate-700 w-full grid grid-cols-3 rounded-xl h-auto p-1">
                        <TabsTrigger
                            value="general"
                            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-400 rounded-lg py-2 text-sm"
                        >
                            <Pencil className="h-4 w-4 mr-1.5" />
                            {t("collectionSettings.tabs.general")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="display"
                            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-400 rounded-lg py-2 text-sm"
                        >
                            <Eye className="h-4 w-4 mr-1.5" />
                            {t("collectionSettings.tabs.display")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="actions"
                            className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-400 rounded-lg py-2 text-sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                            {t("collectionSettings.tabs.actions")}
                        </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-slate-300">{t("common.name")}</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t("settings.collectionNamePlaceholder")}
                                className="bg-slate-800 border-slate-700 text-white h-11 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm text-slate-300 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {t("common.description")}
                            </Label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t("settings.descriptionPlaceholder")}
                                rows={3}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm text-slate-300 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                {t("collectionSettings.cardLanguage")}
                            </Label>

                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => setUseProfileLanguage(true)}
                                    className={cn(
                                        "p-3 rounded-xl border text-left transition-all text-sm",
                                        useProfileLanguage
                                            ? "border-purple-500 bg-purple-500/10"
                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{t("settings.useProfileLanguage")}</span>
                                        {useProfileLanguage && <Check className="h-4 w-4 text-purple-400" />}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {CARD_LANGUAGES.find(l => l.code === cardLanguage)?.name}
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setUseProfileLanguage(false)}
                                    className={cn(
                                        "p-3 rounded-xl border text-left transition-all text-sm",
                                        !useProfileLanguage
                                            ? "border-purple-500 bg-purple-500/10"
                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                    )}
                                >
                                    <span>{t("settings.customLanguage")}</span>
                                </button>
                            </div>

                            {!useProfileLanguage && (
                                <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2">
                                    {CARD_LANGUAGES.map((lang) => (
                                        <button
                                            type="button"
                                            key={lang.code}
                                            onClick={() => setSelectedLanguage(lang.code)}
                                            className={cn(
                                                "p-2 rounded-lg border text-center text-xs transition-all",
                                                selectedLanguage === lang.code
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

                        {collection.type === "auto" && collection.filters && (
                            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-purple-500/10 text-purple-300 border-0 text-xs">
                                        Automática
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Esta colección se genera automáticamente según los filtros definidos.
                                    Los filtros no pueden modificarse después de crearla.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Display Tab */}
                    <TabsContent value="display" className="space-y-5 pt-4">
                        <div className="space-y-3">
                            <Label className="text-sm text-slate-300 flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                {t("collectionSettings.showPrices")}
                            </Label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPrices(true)}
                                    className={cn(
                                        "flex-1 p-4 rounded-xl border transition-all text-center",
                                        showPrices
                                            ? "border-emerald-500 bg-emerald-500/10"
                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                    )}
                                >
                                    <span className="text-sm font-medium">{t("common.yes")}</span>
                                    <p className="text-xs text-slate-500 mt-1">{t("collectionSettings.showPricesDesc")}</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPrices(false)}
                                    className={cn(
                                        "flex-1 p-4 rounded-xl border transition-all text-center",
                                        !showPrices
                                            ? "border-slate-500 bg-slate-500/10"
                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                    )}
                                >
                                    <span className="text-sm font-medium">{t("common.no")}</span>
                                    <p className="text-xs text-slate-500 mt-1">{t("collectionSettings.hidePricesDesc")}</p>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm text-slate-300 flex items-center gap-2">
                                <SortAsc className="h-4 w-4" />
                                {t("common.sortBy")}
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {sortOptions.map((option) => (
                                    <button
                                        type="button"
                                        key={option.value}
                                        onClick={() => setSortBy(option.value)}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all text-sm",
                                            sortBy === option.value
                                                ? "border-blue-500 bg-blue-500/10 text-white"
                                                : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Actions Tab */}
                    <TabsContent value="actions" className="space-y-4 pt-4">
                        {/* Resync Button */}
                        {collection.type === "auto" && collection.filters && (
                            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                        <RefreshCw className={cn("h-5 w-5 text-blue-400", isSyncing && "animate-spin")} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-white mb-1">{t("collectionSettings.resync.title")}</h4>
                                        <p className="text-xs text-slate-400 mb-3">
                                            {t("collectionSettings.resync.description")}
                                        </p>
                                        {isSyncing && (
                                            <div className="mb-3">
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                                        style={{ width: `${syncProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <Button
                                            onClick={handleResync}
                                            disabled={isSyncing}
                                            variant="outline"
                                            size="sm"
                                            className="border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200"
                                        >
                                            {isSyncing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    {t("collectionSettings.resync.syncing")}
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="h-4 w-4 mr-2" />
                                                    {t("collectionSettings.resync.button")}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delete Section */}
                        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-white mb-1">{t("collectionSettings.dangerZone.title")}</h4>
                                    <p className="text-xs text-slate-400 mb-3">
                                        {t("collectionSettings.dangerZone.description")}
                                    </p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t("collectionSettings.dangerZone.deleteButton")}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                                    {t("collectionSettings.dangerZone.deleteTitle", { name: collection.name })}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-400">
                                                    {t("collectionSettings.dangerZone.deleteDesc")}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                                                    Cancelar
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDelete}
                                                    disabled={isDeleting}
                                                    className="bg-red-600 hover:bg-red-500 text-white"
                                                >
                                                    {isDeleting ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            {t("collectionSettings.dangerZone.deleting")}
                                                        </>
                                                    ) : (
                                                        t("collectionSettings.dangerZone.confirmButton")
                                                    )}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="gap-2 sm:gap-0">
                    {saved && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm mr-auto">
                            <Check className="h-4 w-4" />
                            Guardado
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                    >
                        Cerrar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar cambios
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
