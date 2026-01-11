"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ChevronRight,
    Wallet,
    Sparkles,
    Library,
    Check,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Collection {
    id: string;
    name: string;
}

interface Budget {
    id: string;
    name: string;
    type: string;
}

export default function NewBudgetPage() {
    const router = useRouter();
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [type, setType] = useState<"global" | "collection">("global");
    const [collectionId, setCollectionId] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("EUR");
    const [period, setPeriod] = useState<"monthly" | "yearly" | "one-time">("monthly");
    const [parentBudgetIds, setParentBudgetIds] = useState<string[]>([]);

    // Data
    const [collections, setCollections] = useState<Collection[]>([]);
    const [globalBudgets, setGlobalBudgets] = useState<Budget[]>([]);

    useEffect(() => {
        // Cargar colecciones
        fetch("/api/collections")
            .then((res) => res.json())
            .then((data) => setCollections(data))
            .catch(console.error);

        // Cargar presupuestos globales existentes
        fetch("/api/budgets")
            .then((res) => res.json())
            .then((data) => {
                setGlobalBudgets(data.filter((b: Budget) => b.type === "global"));
            })
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/budgets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    type,
                    collectionId: type === "collection" ? collectionId : null,
                    amount: parseFloat(amount),
                    currency,
                    period,
                    parentBudgetIds: type === "collection" ? parentBudgetIds : [],
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/budgets/${data.id}`);
            }
        } catch (error) {
            console.error("Error creating budget:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleParentBudget = (budgetId: string) => {
        setParentBudgetIds((prev) =>
            prev.includes(budgetId)
                ? prev.filter((id) => id !== budgetId)
                : [...prev, budgetId]
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-slate-950 to-blue-900/10" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/budgets" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("budgets.backToBudgets")}
                        </Link>
                    </div>

                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 text-white overflow-hidden shadow-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-500" />

                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <Wallet className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">{t("budgets.new")}</CardTitle>
                                    <CardDescription className="text-slate-400">
                                        {t("budgets.createDescription")}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Nombre */}
                                <div className="space-y-2">
                                    <Label className="text-white text-sm font-medium">{t("budgets.form.name")}</Label>
                                    <Input
                                        placeholder={t("budgets.form.namePlaceholder")}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="bg-slate-800 border-slate-700 text-white h-12 rounded-xl focus:border-emerald-500"
                                    />
                                </div>

                                {/* Tipo */}
                                <div className="space-y-3">
                                    <Label className="text-white text-sm font-medium">{t("budgets.form.type")}</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setType("global")}
                                            className={cn(
                                                "cursor-pointer p-5 rounded-xl border-2 transition-all duration-200",
                                                type === "global"
                                                    ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                                                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    type === "global" ? "bg-purple-500" : "bg-slate-700"
                                                )}>
                                                    <Sparkles className="h-4 w-4 text-white" />
                                                </div>
                                                <h3 className="font-semibold">{t("budgets.type.global")}</h3>
                                            </div>
                                            <p className="text-xs text-slate-400">{t("budgets.type.globalDesc")}</p>
                                        </div>

                                        <div
                                            onClick={() => setType("collection")}
                                            className={cn(
                                                "cursor-pointer p-5 rounded-xl border-2 transition-all duration-200",
                                                type === "collection"
                                                    ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                                                    : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    type === "collection" ? "bg-blue-500" : "bg-slate-700"
                                                )}>
                                                    <Library className="h-4 w-4 text-white" />
                                                </div>
                                                <h3 className="font-semibold">{t("budgets.type.collection")}</h3>
                                            </div>
                                            <p className="text-xs text-slate-400">{t("budgets.type.collectionDesc")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Colección (si tipo = collection) */}
                                {type === "collection" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-white text-sm font-medium">{t("budgets.form.collection")}</Label>
                                        <select
                                            value={collectionId}
                                            onChange={(e) => setCollectionId(e.target.value)}
                                            required={type === "collection"}
                                            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">{t("budgets.form.selectCollection")}</option>
                                            {collections.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Cantidad */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-white text-sm font-medium">{t("budgets.form.amount")}</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="100.00"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                                className="bg-slate-800 border-slate-700 text-white h-12 rounded-xl focus:border-emerald-500 pr-12"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                {currency}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white text-sm font-medium">{t("budgets.form.currency")}</Label>
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 h-12"
                                        >
                                            <option value="EUR">EUR €</option>
                                            <option value="USD">USD $</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Período */}
                                <div className="space-y-3">
                                    <Label className="text-white text-sm font-medium">{t("budgets.form.period")}</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { value: "monthly", label: t("budgets.period.monthly") },
                                            { value: "yearly", label: t("budgets.period.yearly") },
                                            { value: "one-time", label: t("budgets.period.oneTime") },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setPeriod(opt.value as any)}
                                                className={cn(
                                                    "p-3 rounded-xl border text-sm transition-all",
                                                    period === opt.value
                                                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                                                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Incluir en presupuesto global */}
                                {type === "collection" && globalBudgets.length > 0 && (
                                    <div className="space-y-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700 animate-in fade-in">
                                        <Label className="text-white text-sm font-medium">
                                            {t("budgets.form.parentBudget")}
                                        </Label>
                                        <p className="text-xs text-slate-500">
                                            {t("budgets.form.parentBudgetDesc")}
                                        </p>
                                        <div className="space-y-2">
                                            {globalBudgets.map((gb) => (
                                                <button
                                                    key={gb.id}
                                                    type="button"
                                                    onClick={() => toggleParentBudget(gb.id)}
                                                    className={cn(
                                                        "w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all",
                                                        parentBudgetIds.includes(gb.id)
                                                            ? "border-purple-500 bg-purple-500/10"
                                                            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                                    )}
                                                >
                                                    <span className="text-sm">{gb.name}</span>
                                                    {parentBudgetIds.includes(gb.id) && (
                                                        <Check className="h-4 w-4 text-purple-400" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || !name || !amount}
                                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            {t("common.creating")}
                                        </span>
                                    ) : (
                                        t("budgets.create")
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
