"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Check, X, Trash2, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Expense {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    currency: string;
    packCount: number | null;
    seller: string | null;
    platform: string | null;
    notes: string | null;
}

interface ExpenseTableProps {
    budgetId: string;
    expenses: Expense[];
    currency: string;
    onExpenseAdded: () => void;
    onExpenseUpdated: () => void;
    onExpenseDeleted: () => void;
    defaultDate?: string; // Para pre-seleccionar fecha en meses pasados
}

const CATEGORIES = [
    "single_card",
    "sealed",
    "etb",
    "booster",
    "accessory",
    "other",
];

const PLATFORMS = [
    "",
    "cardmarket",
    "tcgplayer",
    "ebay",
    "tiktokshop",
    "amazon",
    "lgs",
    "other",
];

interface NewRow {
    date: string;
    description: string;
    category: string;
    amount: string;
    packCount: string;
    seller: string;
    platform: string;
}

function getEmptyRow(defaultDate?: string): NewRow {
    return {
        date: defaultDate || new Date().toISOString().split("T")[0],
        description: "",
        category: "other",
        amount: "",
        packCount: "",
        seller: "",
        platform: "",
    };
}

export default function ExpenseTable({
    budgetId,
    expenses,
    currency,
    onExpenseAdded,
    onExpenseUpdated,
    onExpenseDeleted,
    defaultDate,
}: ExpenseTableProps) {
    const { t, locale } = useI18n();
    const [newRow, setNewRow] = useState<NewRow>(getEmptyRow(defaultDate));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingData, setEditingData] = useState<Partial<Expense>>({});
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Refs para navegación
    const dateRef = useRef<HTMLInputElement>(null);
    const descRef = useRef<HTMLInputElement>(null);
    const categoryRef = useRef<HTMLSelectElement>(null);
    const amountRef = useRef<HTMLInputElement>(null);
    const packCountRef = useRef<HTMLInputElement>(null);
    const sellerRef = useRef<HTMLInputElement>(null);
    const platformRef = useRef<HTMLSelectElement>(null);

    const focusOrder = [dateRef, descRef, categoryRef, amountRef, packCountRef, sellerRef, platformRef];

    useEffect(() => {
        // Focus en descripción al montar
        descRef.current?.focus();
    }, []);

    const handleNewRowKeyDown = (e: KeyboardEvent, currentIndex: number) => {
        if (e.key === "Tab" && !e.shiftKey) {
            // Si es el último campo, guardar
            if (currentIndex === focusOrder.length - 1) {
                e.preventDefault();
                saveNewRow();
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            saveNewRow();
        } else if (e.key === "Escape") {
            setNewRow(getEmptyRow(defaultDate));
            descRef.current?.focus();
        }
    };

    const saveNewRow = async () => {
        if (!newRow.description || !newRow.amount) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/budgets/${budgetId}/expenses`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: newRow.date,
                    description: newRow.description,
                    category: newRow.category,
                    amount: parseFloat(newRow.amount),
                    currency,
                    packCount: newRow.packCount ? parseInt(newRow.packCount) : null,
                    seller: newRow.seller || null,
                    platform: newRow.platform || null,
                }),
            });

            if (res.ok) {
                setNewRow(getEmptyRow(defaultDate));
                onExpenseAdded();
                // Focus back to description for next entry
                setTimeout(() => descRef.current?.focus(), 50);
            }
        } catch (error) {
            console.error("Error saving expense:", error);
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (expense: Expense) => {
        setEditingId(expense.id);
        setEditingData({ ...expense });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingData({});
    };

    const saveEdit = async () => {
        if (!editingId) return;

        setSaving(true);
        try {
            // Asegurar que packCount se envía como integer o null
            const dataToSend = {
                ...editingData,
                packCount: editingData.packCount != null ? Number(editingData.packCount) : null,
            };

            const res = await fetch(`/api/expenses/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend),
            });

            if (res.ok) {
                setEditingId(null);
                setEditingData({});
                onExpenseUpdated();
            }
        } catch (error) {
            console.error("Error updating expense:", error);
        } finally {
            setSaving(false);
        }
    };

    const deleteExpense = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                onExpenseDeleted();
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            saveEdit();
        } else if (e.key === "Escape") {
            cancelEditing();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
            style: "currency",
            currency,
        }).format(amount);
    };

    const getCategoryLabel = (value: string) => {
        return t(`budgets.expenseTable.categories.${value}` as any);
    };

    const getPlatformLabel = (value: string | null) => {
        if (!value) return "-";
        return t(`budgets.expenseTable.platforms.${value}` as any);
    };

    const calculateCostPerPack = (amount: number, packCount: number | null) => {
        if (!packCount || packCount <= 0) return null;
        return amount / packCount;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-sm font-medium text-slate-400 w-28">{t("budgets.expenseTable.columns.date")}</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400 min-w-[180px]">{t("budgets.expenseTable.columns.description")}</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400 w-24">{t("budgets.expenseTable.columns.category")}</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-400 w-24">{t("budgets.expenseTable.columns.amount")}</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-400 w-16">{t("budgets.expenseTable.columns.packCount")}</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-400 w-20">{t("budgets.expenseTable.columns.pricePerPack")}</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400 w-28">{t("budgets.expenseTable.columns.seller")}</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400 w-24">{t("budgets.expenseTable.columns.platform")}</th>
                        <th className="w-20"></th>
                    </tr>
                </thead>
                <tbody>
                    {/* Existing expenses */}
                    {expenses.map((expense) => (
                        <tr
                            key={expense.id}
                            className={cn(
                                "border-b border-slate-800 hover:bg-slate-800/30 transition-colors",
                                editingId === expense.id && "bg-slate-800/50"
                            )}
                        >
                            {editingId === expense.id ? (
                                <>
                                    <td className="p-2">
                                        <input
                                            type="date"
                                            value={editingData.date || ""}
                                            onChange={(e) => setEditingData({ ...editingData, date: e.target.value })}
                                            onKeyDown={handleEditKeyDown}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={editingData.description || ""}
                                            onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                                            onKeyDown={handleEditKeyDown}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={editingData.category || "other"}
                                            onChange={(e) => setEditingData({ ...editingData, category: e.target.value })}
                                            onKeyDown={handleEditKeyDown}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        >
                                            {CATEGORIES.map((c) => (
                                                <option key={c} value={c}>{getCategoryLabel(c)}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editingData.amount || ""}
                                            onChange={(e) => setEditingData({ ...editingData, amount: parseFloat(e.target.value) })}
                                            onKeyDown={handleEditKeyDown}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-emerald-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            min="0"
                                            value={editingData.packCount ?? ""}
                                            onChange={(e) => setEditingData({ ...editingData, packCount: e.target.value ? parseInt(e.target.value) : null })}
                                            onKeyDown={handleEditKeyDown}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-emerald-500"
                                            placeholder="-"
                                        />
                                    </td>
                                    <td className="p-2 text-right text-sm text-slate-500">
                                        {editingData.packCount && editingData.amount
                                            ? formatCurrency(editingData.amount / editingData.packCount)
                                            : "-"}
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={editingData.seller || ""}
                                            onChange={(e) => setEditingData({ ...editingData, seller: e.target.value })}
                                            onKeyDown={handleEditKeyDown}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={editingData.platform || ""}
                                            onChange={(e) => setEditingData({ ...editingData, platform: e.target.value })}
                                            onKeyDown={handleEditKeyDown}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        >
                                            {PLATFORMS.map((p) => (
                                                <option key={p} value={p}>{p === "" ? "-" : getPlatformLabel(p)}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={saveEdit}
                                                disabled={saving}
                                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                            >
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="p-3 text-sm text-slate-300 cursor-pointer" onClick={() => startEditing(expense)}>
                                        {new Date(expense.date).toLocaleDateString(locale === "es" ? "es-ES" : "en-US")}
                                    </td>
                                    <td className="p-3 text-sm text-white cursor-pointer" onClick={() => startEditing(expense)}>
                                        {expense.description}
                                    </td>
                                    <td className="p-3 cursor-pointer" onClick={() => startEditing(expense)}>
                                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300">
                                            {getCategoryLabel(expense.category)}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-right font-medium text-emerald-400 cursor-pointer" onClick={() => startEditing(expense)}>
                                        {formatCurrency(expense.amount)}
                                    </td>
                                    <td className="p-3 text-sm text-right text-slate-400 cursor-pointer" onClick={() => startEditing(expense)}>
                                        {expense.packCount ?? "-"}
                                    </td>
                                    <td className="p-3 text-sm text-right cursor-pointer" onClick={() => startEditing(expense)}>
                                        {(() => {
                                            const costPerPack = calculateCostPerPack(expense.amount, expense.packCount);
                                            return costPerPack ? (
                                                <span className="text-amber-400 font-medium">{formatCurrency(costPerPack)}</span>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            );
                                        })()}
                                    </td>
                                    <td className="p-3 text-sm text-slate-400 cursor-pointer" onClick={() => startEditing(expense)}>
                                        {expense.seller || "-"}
                                    </td>
                                    <td className="p-3 text-sm text-slate-400 cursor-pointer" onClick={() => startEditing(expense)}>
                                        {getPlatformLabel(expense.platform)}
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => deleteExpense(expense.id)}
                                            disabled={deletingId === expense.id}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            {deletingId === expense.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}

                    {/* New row */}
                    <tr className="border-b border-slate-700 bg-slate-800/20">
                        <td className="p-2">
                            <input
                                ref={dateRef}
                                type="date"
                                value={newRow.date}
                                onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                                onKeyDown={(e) => handleNewRowKeyDown(e, 0)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                            />
                        </td>
                        <td className="p-2">
                            <input
                                ref={descRef}
                                type="text"
                                placeholder={t("budgets.expenseTable.placeholders.description")}
                                value={newRow.description}
                                onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                                onKeyDown={(e) => handleNewRowKeyDown(e, 1)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                            />
                        </td>
                        <td className="p-2">
                            <select
                                ref={categoryRef}
                                value={newRow.category}
                                onChange={(e) => setNewRow({ ...newRow, category: e.target.value })}
                                onKeyDown={(e) => handleNewRowKeyDown(e, 2)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{getCategoryLabel(c)}</option>
                                ))}
                            </select>
                        </td>
                        <td className="p-2">
                            <input
                                ref={amountRef}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={newRow.amount}
                                onChange={(e) => setNewRow({ ...newRow, amount: e.target.value })}
                                onKeyDown={(e) => handleNewRowKeyDown(e, 3)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                            />
                        </td>
                        <td className="p-2">
                            <input
                                ref={packCountRef}
                                type="number"
                                min="0"
                                placeholder="-"
                                value={newRow.packCount}
                                onChange={(e) => setNewRow({ ...newRow, packCount: e.target.value })}
                                onKeyDown={(e) => handleNewRowKeyDown(e, 4)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm text-right focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                            />
                        </td>
                        <td className="p-2 text-right text-sm text-slate-500">
                            {newRow.packCount && newRow.amount
                                ? formatCurrency(parseFloat(newRow.amount) / parseInt(newRow.packCount))
                                : "-"}
                        </td>
                        <td className="p-2">
                            <input
                                ref={sellerRef}
                                type="text"
                                placeholder={t("budgets.expenseTable.placeholders.seller")}
                                value={newRow.seller}
                                onChange={(e) => setNewRow({ ...newRow, seller: e.target.value })}
                                onKeyDown={(e) => handleNewRowKeyDown(e, 5)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                            />
                        </td>
                        <td className="p-2">
                            <select
                                ref={platformRef}
                                value={newRow.platform}
                                onChange={(e) => setNewRow({ ...newRow, platform: e.target.value })}
                                onKeyDown={(e) => handleNewRowKeyDown(e, 6)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                            >
                                {PLATFORMS.map((p) => (
                                    <option key={p} value={p}>{p === "" ? "-" : getPlatformLabel(p)}</option>
                                ))}
                            </select>
                        </td>
                        <td className="p-2">
                            <button
                                onClick={saveNewRow}
                                disabled={saving || !newRow.description || !newRow.amount}
                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="mt-3 text-xs text-slate-600 flex items-center gap-4 flex-wrap">
                <span>💡 <strong>Tab</strong> {t("budgets.expenseTable.help.tab")}</span>
                <span><strong>Enter</strong> {t("budgets.expenseTable.help.enter")}</span>
                <span><strong>Esc</strong> {t("budgets.expenseTable.help.esc")}</span>
                <span>{t("budgets.expenseTable.help.clickToEdit")}</span>
            </div>
        </div>
    );
}
