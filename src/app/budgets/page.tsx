"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Wallet,
    Plus,
    PiggyBank,
    Library,
    Sparkles,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Budget {
    id: string;
    name: string;
    type: string;
    amount: number;
    currency: string;
    period: string;
    isActive: boolean;
    totalSpent: number;
    remaining: number;
    percentage: number;
    collectionName: string | null;
}

export default function BudgetsPage() {
    const { t, locale } = useI18n();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const res = await fetch("/api/budgets");
            if (res.ok) {
                const data = await res.json();
                setBudgets(data);
            }
        } catch (error) {
            console.error("Error fetching budgets:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calcular totales globales
    const globalStats = budgets.reduce(
        (acc, b) => ({
            totalBudget: acc.totalBudget + b.amount,
            totalSpent: acc.totalSpent + b.totalSpent,
        }),
        { totalBudget: 0, totalSpent: 0 }
    );
    const globalRemaining = globalStats.totalBudget - globalStats.totalSpent;
    const globalPercentage = globalStats.totalBudget > 0
        ? Math.round((globalStats.totalSpent / globalStats.totalBudget) * 100)
        : 0;

    const getStatusColor = (percentage: number) => {
        if (percentage >= 100) return "text-red-400";
        if (percentage >= 80) return "text-amber-400";
        return "text-emerald-400";
    };

    const getProgressGradient = (percentage: number) => {
        if (percentage >= 100) return "from-red-500 to-red-400";
        if (percentage >= 80) return "from-amber-500 to-yellow-400";
        return "from-emerald-500 to-green-400";
    };

    const getStatusBadge = (percentage: number) => {
        if (percentage >= 100) {
            return <Badge className="bg-red-500/10 text-red-400 border-0">{t("budgets.status.exceeded")}</Badge>;
        }
        if (percentage >= 80) {
            return <Badge className="bg-amber-500/10 text-amber-400 border-0">{t("budgets.status.limit")}</Badge>;
        }
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-0">{t("budgets.status.ok")}</Badge>;
    };

    const formatCurrency = (amount: number, currency: string = "EUR") => {
        return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
            style: "currency",
            currency,
        }).format(amount);
    };

    // Mapeo seguro para claves
    const getPeriodLabel = (period: string) => {
        const key = period === "one-time" ? "oneTime" : period;
        // @ts-ignore - dynamic key
        return t(`budgets.period.${key}`) || period;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-900/10 via-slate-950 to-blue-900/10" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    {/* Header */}
                    <PageHeader
                        title={t("budgets.title")}
                        description={t("budgets.subtitle")}
                        icon={Wallet}
                        iconColor="from-emerald-500 to-green-500"
                        actions={
                            <Link href="/budgets/new">
                                <Button className="bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-6 h-12 rounded-xl shadow-lg shadow-emerald-500/20">
                                    <Plus className="h-5 w-5 mr-2" />
                                    {t("budgets.new")}
                                </Button>
                            </Link>
                        }
                    />

                    {/* Global Summary */}
                    {budgets.length > 0 && (
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 mb-8 overflow-hidden">
                            <div className={`h-1 w-full bg-linear-to-r ${getProgressGradient(globalPercentage)}`} />
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-4">
                                            <PiggyBank className="h-5 w-5 text-slate-400" />
                                            <h2 className="text-lg font-semibold text-white">{t("budgets.monthSummary")}</h2>
                                        </div>
                                        <div className="grid grid-cols-3 gap-6">
                                            <div>
                                                <div className="text-sm text-slate-500 mb-1">{t("budgets.total")}</div>
                                                <div className="text-2xl font-bold text-white">
                                                    {formatCurrency(globalStats.totalBudget)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-500 mb-1">{t("budgets.spent")}</div>
                                                <div className={`text-2xl font-bold ${getStatusColor(globalPercentage)}`}>
                                                    {formatCurrency(globalStats.totalSpent)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-500 mb-1">{t("budgets.remaining")}</div>
                                                <div className={`text-2xl font-bold ${globalRemaining >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                    {formatCurrency(globalRemaining)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center min-w-[120px]">
                                        <div className={`text-5xl font-black ${getStatusColor(globalPercentage)}`}>
                                            {globalPercentage}%
                                        </div>
                                        {getStatusBadge(globalPercentage)}
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="mt-4 h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full bg-linear-to-r ${getProgressGradient(globalPercentage)} transition-all duration-700`}
                                        style={{ width: `${Math.min(globalPercentage, 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Budget List */}
                    {budgets.length === 0 ? (
                        <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-linear-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                                <Wallet className="h-10 w-10 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">{t("budgets.empty.title")}</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">
                                {t("budgets.empty.description")}
                            </p>
                            <Link href="/budgets/new">
                                <Button className="bg-linear-to-r from-emerald-600 to-green-600 text-white px-6 h-12 rounded-xl">
                                    <Plus className="h-5 w-5 mr-2" />
                                    {t("budgets.create")}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {budgets.map((budget) => (
                                <Link key={budget.id} href={`/budgets/${budget.id}`}>
                                    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 hover:border-slate-700 transition-all cursor-pointer group overflow-hidden h-full">
                                        <div className={`h-1 w-full bg-linear-to-r ${getProgressGradient(budget.percentage)}`} />
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                                        budget.type === "global"
                                                            ? "bg-purple-500/20"
                                                            : "bg-blue-500/20"
                                                    )}>
                                                        {budget.type === "global" ? (
                                                            <Sparkles className="h-5 w-5 text-purple-400" />
                                                        ) : (
                                                            <Library className="h-5 w-5 text-blue-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                                            {budget.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <span>{getPeriodLabel(budget.period)}</span>
                                                            {budget.collectionName && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="truncate max-w-[100px]">{budget.collectionName}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="text-xs text-slate-500 mb-1">{t("budgets.spent")}</div>
                                                        <div className={`text-xl font-bold ${getStatusColor(budget.percentage)}`}>
                                                            {formatCurrency(budget.totalSpent, budget.currency)}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-slate-500 mb-1">{t("budgets.of")}</div>
                                                        <div className="text-lg text-slate-400">
                                                            {formatCurrency(budget.amount, budget.currency)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full bg-linear-to-r ${getProgressGradient(budget.percentage)} transition-all duration-500`}
                                                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <span className={`text-sm font-medium ${getStatusColor(budget.percentage)}`}>
                                                        {budget.percentage}%
                                                    </span>
                                                    {getStatusBadge(budget.percentage)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
