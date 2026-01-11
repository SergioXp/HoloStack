"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Settings,
    Wallet,
    Calendar,
    Coins,
    Library,
    Trash2,
    Loader2,
    AlertTriangle,
    Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Collection {
    id: string;
    name: string;
}

interface BudgetSettingsProps {
    budgetId: string;
    budgetName: string;
    budgetAmount: number;
    budgetCurrency: string;
    budgetPeriod: string;
    budgetType: string;
    collectionId: string | null;
    onUpdated: () => void;
    onDeleted: () => void;
}

export default function BudgetSettings({
    budgetId,
    budgetName,
    budgetAmount,
    budgetCurrency,
    budgetPeriod,
    budgetType,
    collectionId,
    onUpdated,
    onDeleted,
}: BudgetSettingsProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "advanced" | "danger">("general");

    // Form state
    const [name, setName] = useState(budgetName);
    const [amount, setAmount] = useState(budgetAmount.toString());
    const [currency, setCurrency] = useState(budgetCurrency);
    const [period, setPeriod] = useState(budgetPeriod);
    const [selectedCollectionId, setSelectedCollectionId] = useState(collectionId || "");

    // Loading states
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);

    useEffect(() => {
        if (open) {
            // Cargar colecciones
            fetch("/api/collections")
                .then((res) => res.json())
                .then((data) => setCollections(data))
                .catch(console.error);

            // Reset form state
            setName(budgetName);
            setAmount(budgetAmount.toString());
            setCurrency(budgetCurrency);
            setPeriod(budgetPeriod);
            setSelectedCollectionId(collectionId || "");
        }
    }, [open, budgetName, budgetAmount, budgetCurrency, budgetPeriod, collectionId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/budgets/${budgetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    amount: parseFloat(amount),
                    currency,
                    period,
                    collectionId: budgetType === "collection" ? selectedCollectionId : null,
                }),
            });

            if (res.ok) {
                onUpdated();
                setOpen(false);
            }
        } catch (error) {
            console.error("Error updating budget:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/budgets/${budgetId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                onDeleted();
            }
        } catch (error) {
            console.error("Error deleting budget:", error);
        } finally {
            setDeleting(false);
        }
    };

    const hasChanges =
        name !== budgetName ||
        parseFloat(amount) !== budgetAmount ||
        currency !== budgetCurrency ||
        period !== budgetPeriod ||
        selectedCollectionId !== (collectionId || "");

    const tabs = [
        { id: "general", label: t("budgets.settings.tabs.general"), icon: Wallet },
        { id: "advanced", label: t("budgets.settings.tabs.advanced"), icon: Settings },
        { id: "danger", label: t("budgets.settings.tabs.danger"), icon: AlertTriangle },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                >
                    <Settings className="h-4 w-4 mr-2" />
                    {t("budgets.settings.button")}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        {t("budgets.settings.title")}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {t("budgets.settings.description")}
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-800 pb-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? tab.id === "danger"
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-emerald-500/20 text-emerald-400"
                                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6 py-4">
                    {activeTab === "general" && (
                        <>
                            {/* Nombre */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">{t("budgets.form.name")}</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
                                    placeholder={t("budgets.form.namePlaceholder")}
                                />
                            </div>

                            {/* Cantidad y Moneda */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-slate-300">{t("budgets.form.amount")}</Label>
                                    <div className="relative">
                                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="bg-slate-800 border-slate-700 text-white pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">{t("budgets.form.currency")}</Label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                                    >
                                        <option value="EUR">EUR €</option>
                                        <option value="USD">USD $</option>
                                    </select>
                                </div>
                            </div>

                            {/* Período */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">{t("budgets.form.period")}</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: "monthly", label: t("budgets.period.monthly"), icon: Calendar },
                                        { value: "yearly", label: t("budgets.period.yearly"), icon: Calendar },
                                        { value: "one-time", label: t("budgets.period.oneTime"), icon: Wallet },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setPeriod(opt.value)}
                                            className={cn(
                                                "p-3 rounded-xl border text-sm transition-all flex flex-col items-center gap-1",
                                                period === opt.value
                                                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                                                    : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                                            )}
                                        >
                                            <opt.icon className="h-4 w-4" />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "advanced" && (
                        <>
                            {/* Tipo de presupuesto (solo lectura) */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">{t("budgets.form.type")}</Label>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    {budgetType === "global" ? (
                                        <>
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <Wallet className="h-4 w-4 text-purple-400" />
                                            </div>
                                            <span className="text-white">{t("budgets.type.global")}</span>
                                            <Badge className="ml-auto bg-slate-700 text-slate-300 border-0">
                                                {t("budgets.settings.readOnly")}
                                            </Badge>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Library className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <span className="text-white">{t("budgets.type.collection")}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Colección (solo para tipo collection) */}
                            {budgetType === "collection" && (
                                <div className="space-y-2">
                                    <Label className="text-slate-300">{t("budgets.settings.linkedCollection")}</Label>
                                    <select
                                        value={selectedCollectionId}
                                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md bg-slate-800 border border-slate-700 text-white"
                                    >
                                        <option value="">{t("budgets.settings.noCollection")}</option>
                                        {collections.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500">
                                        {t("budgets.settings.linkedCollectionDesc")}
                                    </p>
                                </div>
                            )}

                            {/* Info */}
                            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                                <h4 className="font-medium text-white mb-2">{t("budgets.settings.infoTitle")}</h4>
                                <ul className="text-sm text-slate-400 space-y-1">
                                    <li>• {t("budgets.settings.info1")}</li>
                                    <li>• {t("budgets.settings.info2")}</li>
                                    <li>• {t("budgets.settings.info3")}</li>
                                </ul>
                            </div>
                        </>
                    )}

                    {activeTab === "danger" && (
                        <>
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-red-400">{t("budgets.settings.dangerZone")}</h4>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {t("budgets.settings.dangerZoneDesc")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <div>
                                        <h4 className="font-medium text-white">{t("budgets.settings.deleteBudget")}</h4>
                                        <p className="text-sm text-slate-400">
                                            {t("budgets.settings.deleteBudgetDesc")}
                                        </p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-500"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t("common.delete")}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                                    {t("budgets.settings.deleteConfirmTitle")}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-400">
                                                    {t("budgets.settings.deleteConfirmDesc", { name: budgetName })}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                                                    {t("common.cancel")}
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDelete}
                                                    disabled={deleting}
                                                    className="bg-red-600 hover:bg-red-500 text-white"
                                                >
                                                    {deleting ? (
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                    )}
                                                    {t("budgets.settings.deleteForever")}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {activeTab !== "danger" && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <div className="text-sm text-slate-500">
                            {hasChanges && t("budgets.settings.unsavedChanges")}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving || !hasChanges || !name || !amount}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                )}
                                {t("budgets.settings.saveChanges")}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
