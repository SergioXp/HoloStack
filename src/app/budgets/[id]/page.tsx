"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Library,
    Calendar,
    TrendingUp,
    ShoppingCart,
    PiggyBank,
    ArrowUpRight,
    ArrowDownRight,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import ExpenseTable from "@/components/ExpenseTable";
import BudgetSettings from "@/components/BudgetSettings";
import { useI18n } from "@/lib/i18n";

interface MonthData {
    month: string;
    label: string;
    totalSpent: number;
    budgetAmount: number;
    carryOver: number;
    available: number;
    expenses: any[];
}

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
    carryOver: number;
    percentage: number;
    collectionName: string | null;
    collectionId: string | null;
    expenses: any[];
    expenseCount: number;
    monthlyHistory: MonthData[];
    totalSpentAllTime: number;
    totalExpenseCount: number;
    children: any[];
    currentMonth: string;
}

export default function BudgetDetailPage() {
    const router = useRouter();
    const params = useParams();
    const budgetId = params.id as string;
    const { t, locale } = useI18n();

    const [budget, setBudget] = useState<Budget | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

    const fetchBudget = async () => {
        try {
            const res = await fetch(`/api/budgets/${budgetId}`);
            if (res.ok) {
                const data = await res.json();
                setBudget(data);
                // Expandir el mes actual por defecto
                if (data.currentMonth) {
                    setExpandedMonths(new Set([data.currentMonth]));
                    setSelectedMonth(data.currentMonth);
                }
            } else if (res.status === 404) {
                router.push("/budgets");
            }
        } catch (error) {
            console.error("Error fetching budget:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudget();
    }, [budgetId]);

    const toggleMonth = (month: string) => {
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(month)) {
                newSet.delete(month);
            } else {
                newSet.add(month);
            }
            return newSet;
        });
    };

    const getStatusColor = (spent: number, budget: number, carryOver: number = 0) => {
        const total = budget + Math.max(0, carryOver);
        if (total <= 0) return "text-slate-400";
        const percentage = (spent / total) * 100;
        if (percentage >= 100) return "text-red-400";
        if (percentage >= 80) return "text-amber-400";
        return "text-emerald-400";
    };

    const getProgressGradient = (spent: number, budget: number, carryOver: number = 0) => {
        const total = budget + Math.max(0, carryOver);
        if (total <= 0) return "from-slate-600 to-slate-500";
        const percentage = (spent / total) * 100;
        if (percentage >= 100) return "from-red-500 to-red-400";
        if (percentage >= 80) return "from-amber-500 to-yellow-400";
        return "from-emerald-500 to-green-400";
    };

    const getStatusBadge = (spent: number, budget: number, carryOver: number = 0) => {
        const total = budget + Math.max(0, carryOver);
        if (total <= 0) return null;
        const percentage = (spent / total) * 100;
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

    const getPeriodKey = (p: string) => {
        if (p === 'one-time') return 'oneTime';
        return p;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!budget) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">{t("budgets.notFound")}</div>
            </div>
        );
    }

    const currentMonthData = budget.monthlyHistory.find(m => m.month === budget.currentMonth);
    const periodKey = getPeriodKey(budget.period) as "monthly" | "yearly" | "oneTime";

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
                    <div className="mb-8">
                        <Link href="/budgets" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("budgets.backToBudgets")}
                        </Link>

                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                                    budget.type === "global"
                                        ? "bg-linear-to-br from-purple-500 to-pink-500 shadow-purple-500/20"
                                        : "bg-linear-to-br from-blue-500 to-cyan-500 shadow-blue-500/20"
                                )}>
                                    {budget.type === "global" ? (
                                        <Sparkles className="h-7 w-7 text-white" />
                                    ) : (
                                        <Library className="h-7 w-7 text-white" />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">{budget.name}</h1>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <Badge variant="outline" className={cn(
                                            "capitalize border-0",
                                            budget.type === "global"
                                                ? "bg-purple-500/10 text-purple-300"
                                                : "bg-blue-500/10 text-blue-300"
                                        )}>
                                            {budget.type === "global" ? t("budgets.type.global") : t("budgets.type.collection")}
                                        </Badge>
                                        <Badge variant="outline" className="border-0 bg-slate-800 text-slate-300">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {t(`budgets.period.${periodKey}`)}
                                        </Badge>
                                        <Badge variant="outline" className="border-0 bg-slate-800 text-slate-300">
                                            {formatCurrency(budget.amount, budget.currency)}/{t(`budgets.per.${periodKey}`)}
                                        </Badge>
                                        {budget.collectionName && budget.collectionId && (
                                            <Link href={`/collections/${budget.collectionId}`}>
                                                <Badge variant="outline" className="border-0 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 cursor-pointer transition-colors">
                                                    <Library className="h-3 w-3 mr-1" />
                                                    {budget.collectionName}
                                                </Badge>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <BudgetSettings
                                budgetId={budget.id}
                                budgetName={budget.name}
                                budgetAmount={budget.amount}
                                budgetCurrency={budget.currency}
                                budgetPeriod={budget.period}
                                budgetType={budget.type}
                                collectionId={budget.collectionId}
                                onUpdated={fetchBudget}
                                onDeleted={() => router.push("/budgets")}
                            />
                        </div>
                    </div>

                    {/* Stats Cards - Totales históricos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 mb-1">{t("budgets.stats.totalSpent")}</div>
                                <div className="text-2xl font-bold text-emerald-400">
                                    {formatCurrency(budget.totalSpentAllTime, budget.currency)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <PiggyBank className="h-5 w-5 text-blue-400" />
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 mb-1">{t("budgets.stats.available")}</div>
                                <div className={`text-2xl font-bold ${currentMonthData && currentMonthData.available >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {formatCurrency(currentMonthData?.available || budget.amount, budget.currency)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-purple-400" />
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 mb-1">{t("budgets.stats.operations")}</div>
                                <div className="text-2xl font-bold text-white">
                                    {budget.totalExpenseCount}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <History className="h-5 w-5 text-amber-400" />
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 mb-1">{t("budgets.stats.carryOver")}</div>
                                <div className={cn(
                                    "text-2xl font-bold flex items-center gap-1",
                                    currentMonthData?.carryOver && currentMonthData.carryOver >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {currentMonthData?.carryOver && currentMonthData.carryOver >= 0 ? (
                                        <ArrowUpRight className="h-5 w-5" />
                                    ) : (
                                        <ArrowDownRight className="h-5 w-5" />
                                    )}
                                    {formatCurrency(Math.abs(currentMonthData?.carryOver || 0), budget.currency)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Histórico por Meses */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            {t("budgets.history.title")}
                        </h2>

                        {budget.monthlyHistory.map((monthData, index) => {
                            const isCurrentMonth = monthData.month === budget.currentMonth;
                            const isExpanded = expandedMonths.has(monthData.month);
                            const percentage = monthData.budgetAmount + Math.max(0, monthData.carryOver) > 0
                                ? Math.round((monthData.totalSpent / (monthData.budgetAmount + Math.max(0, monthData.carryOver))) * 100)
                                : 0;

                            return (
                                <Card
                                    key={monthData.month}
                                    className={cn(
                                        "bg-slate-900/50 backdrop-blur-sm border-slate-800 overflow-hidden transition-all",
                                        isCurrentMonth && "ring-1 ring-emerald-500/30"
                                    )}
                                >
                                    {/* Month header */}
                                    <button
                                        onClick={() => toggleMonth(monthData.month)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-2 h-12 rounded-full",
                                                isCurrentMonth ? "bg-emerald-500" : "bg-slate-700"
                                            )} />
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-white">{monthData.label}</h3>
                                                    {isCurrentMonth && (
                                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                                                            {t("budgets.history.current")}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-400 flex items-center gap-3 mt-1">
                                                    <span>{monthData.expenses.length} {t("budgets.history.operationsCount")}</span>
                                                    {monthData.carryOver !== 0 && (
                                                        <span className={cn(
                                                            "flex items-center gap-1",
                                                            monthData.carryOver >= 0 ? "text-emerald-400" : "text-red-400"
                                                        )}>
                                                            {monthData.carryOver >= 0 ? "+" : ""}{formatCurrency(monthData.carryOver, budget.currency)} {t("budgets.history.carryOver")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className={cn("text-lg font-bold", getStatusColor(monthData.totalSpent, monthData.budgetAmount, monthData.carryOver))}>
                                                    {formatCurrency(monthData.totalSpent, budget.currency)}
                                                    <span className="text-slate-500 font-normal text-sm ml-1">
                                                        / {formatCurrency(monthData.budgetAmount + Math.max(0, monthData.carryOver), budget.currency)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 justify-end mt-1">
                                                    <span className={cn("text-sm font-medium", getStatusColor(monthData.totalSpent, monthData.budgetAmount, monthData.carryOver))}>
                                                        {percentage}%
                                                    </span>
                                                    {getStatusBadge(monthData.totalSpent, monthData.budgetAmount, monthData.carryOver)}
                                                </div>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="h-5 w-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Progress bar */}
                                    <div className="px-4 pb-2">
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full bg-linear-to-r ${getProgressGradient(monthData.totalSpent, monthData.budgetAmount, monthData.carryOver)} transition-all duration-500`}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded content - Expense Table */}
                                    {isExpanded && (
                                        <div className="p-4 pt-2 border-t border-slate-800">
                                            <ExpenseTable
                                                budgetId={budget.id}
                                                expenses={monthData.expenses}
                                                currency={budget.currency}
                                                onExpenseAdded={fetchBudget}
                                                onExpenseUpdated={fetchBudget}
                                                onExpenseDeleted={fetchBudget}
                                                defaultDate={isCurrentMonth ? undefined : `${monthData.month}-15`}
                                            />
                                        </div>
                                    )}
                                </Card>
                            );
                        })}

                        {budget.monthlyHistory.length === 0 && (
                            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
                                <CardContent className="p-8 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
                                        <Calendar className="h-8 w-8 text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{t("budgets.history.empty.title")}</h3>
                                    <p className="text-slate-400">
                                        {t("budgets.history.empty.description")}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
