"use client";

import { useState, useMemo, useCallback } from "react";
import {
    Download,
    Upload,
    Table,
    Check,
    X,
    Loader2,
    FileSpreadsheet,
    Search,
    ChevronUp,
    ChevronDown,
    Plus,
    Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { updateCollectionItem } from "@/app/actions/collection";
import { getAvailableVariants } from "@/lib/card-utils";

interface CollectionTableViewProps {
    cards: any[];
    collectionId: string;
    ownershipData: Record<string, Record<string, { quantity: number; id: string }>>;
    setNames: Record<string, string>;
    onDataImported: () => void;
}

type SortField = "localId" | "name" | "rarity" | "set" | "total";
type SortDirection = "asc" | "desc";

const RARITY_ORDER: Record<string, number> = {
    "Common": 1,
    "Uncommon": 2,
    "Rare": 3,
    "Rare Holo": 4,
    "Ultra Rare": 5,
    "Secret Rare": 6,
    "Special Art Rare": 7,
    "Illustration Rare": 8,
    "Hyper Rare": 9,
    "Crown Rare": 10,
};

// Variantes que vamos a mostrar como columnas (mismos nombres que TCGPlayer/CollectionItemManager)
const VARIANTS = [
    { key: "normal", label: "Normal", shortLabel: "N" },
    { key: "holofoil", label: "Holo", shortLabel: "H" },
    { key: "reverseHolofoil", label: "Reverse", shortLabel: "R" },
];

// Determinar qué variantes están disponibles según la rareza (usamos la utilidad compartida)
// Se eliminó la función local para usar la importada de @/lib/card-utils


export default function CollectionTableView({
    cards,
    collectionId,
    ownershipData,
    setNames,
    onDataImported,
}: CollectionTableViewProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>("localId");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<string | null>(null);
    const [updatingCell, setUpdatingCell] = useState<string | null>(null);

    // Helper para obtener cantidad de una variante
    const getVariantCount = useCallback((cardId: string, variant: string): number => {
        return ownershipData[cardId]?.[variant]?.quantity || 0;
    }, [ownershipData]);

    // Helper para obtener total
    const getTotalOwned = useCallback((cardId: string): number => {
        const data = ownershipData[cardId];
        if (!data) return 0;
        return Object.values(data).reduce((a, b) => a + b.quantity, 0);
    }, [ownershipData]);

    // Actualizar cantidad de una variante (usando server action)
    const updateVariant = useCallback(async (cardId: string, variant: string, quantity: number) => {
        const cellId = `${cardId}-${variant}`;
        setUpdatingCell(cellId);

        try {
            await updateCollectionItem(collectionId, cardId, variant, Math.max(0, quantity));
            onDataImported();
        } catch (error) {
            console.error("Error updating variant:", error);
        } finally {
            setUpdatingCell(null);
        }
    }, [collectionId, onDataImported]);

    // Datos de la tabla
    const tableData = useMemo(() => {
        let data = cards.map(card => {
            const availableVariants = getAvailableVariants(card.rarity || "Unknown", card.supertype);
            return {
                id: card.id,
                localId: card.number || card.localId || "",
                name: card.name,
                setId: card.setId,
                setName: setNames[card.setId] || card.setId,
                rarity: card.rarity || "Unknown",
                hp: card.hp || "-",
                total: getTotalOwned(card.id),
                variants: VARIANTS.reduce((acc, v) => {
                    acc[v.key] = getVariantCount(card.id, v.key);
                    return acc;
                }, {} as Record<string, number>),
                availableVariants,
            };
        });

        // Filter by search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter(row =>
                row.name.toLowerCase().includes(q) ||
                row.localId.toLowerCase().includes(q) ||
                row.setName.toLowerCase().includes(q) ||
                row.rarity.toLowerCase().includes(q)
            );
        }

        // Sort
        data.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case "localId":
                    const numA = parseInt(a.localId.split("/")[0]) || 0;
                    const numB = parseInt(b.localId.split("/")[0]) || 0;
                    comparison = numA - numB;
                    break;
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "rarity":
                    const rarityA = RARITY_ORDER[a.rarity] || 0;
                    const rarityB = RARITY_ORDER[b.rarity] || 0;
                    comparison = rarityA - rarityB;
                    break;
                case "set":
                    comparison = a.setName.localeCompare(b.setName);
                    break;
                case "total":
                    comparison = a.total - b.total;
                    break;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });

        return data;
    }, [cards, setNames, searchQuery, sortField, sortDirection, getVariantCount, getTotalOwned]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === "asc"
            ? <ChevronUp className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />;
    };

    // Exportar a CSV
    const handleExport = () => {
        const headers = ["Número", "Nombre", "Set", "Rareza", "HP", ...VARIANTS.map(v => v.label), "Total"];
        const rows = tableData.map(row => [
            row.localId,
            `"${row.name.replace(/"/g, '""')}"`,
            `"${row.setName.replace(/"/g, '""')}"`,
            row.rarity,
            row.hp,
            ...VARIANTS.map(v => row.variants[v.key].toString()),
            row.total.toString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `coleccion_${collectionId}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Importar desde CSV
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportError(null);
        setImportSuccess(null);

        try {
            const text = await file.text();
            const lines = text.split("\n").filter(line => line.trim());

            if (lines.length < 2) {
                throw new Error("El archivo CSV está vacío o no tiene datos");
            }

            const headerLine = lines[0].toLowerCase();
            const headers = parseCSVLine(headerLine);

            const nombreIdx = headers.findIndex(h => h.includes("nombre"));
            const numeroIdx = headers.findIndex(h => h.includes("número") || h.includes("numero"));

            // Buscar columnas de variantes
            const variantIndices: Record<string, number> = {};
            VARIANTS.forEach(v => {
                const idx = headers.findIndex(h => h.includes(v.label.toLowerCase()) || h === v.key);
                if (idx >= 0) variantIndices[v.key] = idx;
            });

            // Columna total como fallback
            const totalIdx = headers.findIndex(h => h.includes("total") || h.includes("poseídas") || h.includes("poseidas"));

            if (nombreIdx === -1 && numeroIdx === -1) {
                throw new Error("El CSV debe tener una columna 'Nombre' o 'Número'");
            }

            let matchedCount = 0;
            let updatedCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                const nombre = nombreIdx >= 0 ? values[nombreIdx]?.trim() : null;
                const numero = numeroIdx >= 0 ? values[numeroIdx]?.trim() : null;

                const card = cards.find(c => {
                    if (numero && (c.localId === numero || c.localId?.startsWith(numero + "/"))) {
                        return true;
                    }
                    if (nombre && c.name.toLowerCase() === nombre.toLowerCase()) {
                        return true;
                    }
                    return false;
                });

                if (card) {
                    matchedCount++;

                    // Actualizar variantes
                    for (const [variantKey, colIdx] of Object.entries(variantIndices)) {
                        const qty = parseInt(values[colIdx]) || 0;
                        const current = getVariantCount(card.id, variantKey);
                        if (qty !== current && qty > 0) {
                            await fetch("/api/collection-items", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    collectionId,
                                    cardId: card.id,
                                    variant: variantKey,
                                    quantity: qty
                                })
                            });
                            updatedCount++;
                        }
                    }

                    // Si no hay columnas de variantes, usar total como normal
                    if (Object.keys(variantIndices).length === 0 && totalIdx >= 0) {
                        const qty = parseInt(values[totalIdx]) || 0;
                        const current = getVariantCount(card.id, "normal");
                        if (qty !== current && qty > 0) {
                            await fetch("/api/collection-items", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    collectionId,
                                    cardId: card.id,
                                    variant: "normal",
                                    quantity: qty
                                })
                            });
                            updatedCount++;
                        }
                    }
                }
            }

            setImportSuccess(`Importación completada: ${matchedCount} cartas encontradas, ${updatedCount} actualizaciones`);
            onDataImported();

        } catch (error) {
            console.error("Error importing CSV:", error);
            setImportError(error instanceof Error ? error.message : "Error al importar el archivo");
        } finally {
            setImporting(false);
            event.target.value = "";
        }
    };

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const stats = useMemo(() => {
        const owned = cards.filter(c => getTotalOwned(c.id) > 0).length;
        return {
            total: cards.length,
            owned,
            percentage: cards.length > 0 ? ((owned / cards.length) * 100).toFixed(1) : "0"
        };
    }, [cards, getTotalOwned]);

    // Componente para celda editable
    const VariantCell = ({ cardId, variant, count, isAvailable }: { cardId: string; variant: string; count: number; isAvailable: boolean }) => {
        const cellId = `${cardId}-${variant}`;
        const isUpdating = updatingCell === cellId;

        // Si la variante no está disponible para esta carta
        if (!isAvailable) {
            return (
                <div className="flex items-center justify-center">
                    <span className="text-slate-700 text-xs">—</span>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center gap-1">
                <button
                    onClick={() => updateVariant(cardId, variant, count - 1)}
                    disabled={count === 0 || isUpdating}
                    className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-red-500/30 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <Minus className="h-3 w-3" />
                </button>
                <span className={cn(
                    "w-6 text-center text-sm font-medium",
                    count > 0 ? "text-emerald-400" : "text-slate-600"
                )}>
                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : count}
                </span>
                <button
                    onClick={() => updateVariant(cardId, variant, count + 1)}
                    disabled={isUpdating}
                    className="w-5 h-5 rounded flex items-center justify-center bg-slate-800 hover:bg-emerald-500/30 text-slate-400 hover:text-emerald-400 disabled:opacity-30 transition-colors"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header con acciones */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                        <Table className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Vista de Tabla</h2>
                        <p className="text-sm text-slate-400">
                            {stats.owned} / {stats.total} cartas ({stats.percentage}%)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-800/50 border-slate-700 text-white w-48"
                        />
                    </div>

                    <Button
                        onClick={handleExport}
                        variant="outline"
                        className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>

                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleImport}
                            className="hidden"
                            disabled={importing}
                        />
                        <Button
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            asChild
                        >
                            <span>
                                {importing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                )}
                                Importar
                            </span>
                        </Button>
                    </label>
                </div>
            </div>

            {/* Messages */}
            {importError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
                    <X className="h-4 w-4" />
                    {importError}
                </div>
            )}
            {importSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    {importSuccess}
                </div>
            )}

            {/* Table */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/50">
                                <th
                                    onClick={() => handleSort("localId")}
                                    className="text-left p-2 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors w-20"
                                >
                                    <div className="flex items-center gap-1">
                                        # <SortIcon field="localId" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("name")}
                                    className="text-left p-2 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        Nombre <SortIcon field="name" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("set")}
                                    className="text-left p-2 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors max-w-[120px]"
                                >
                                    <div className="flex items-center gap-1">
                                        Set <SortIcon field="set" />
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("rarity")}
                                    className="text-left p-2 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-1">
                                        Rareza <SortIcon field="rarity" />
                                    </div>
                                </th>
                                <th className="text-center p-2 text-xs font-medium text-slate-400 w-12">
                                    HP
                                </th>
                                {VARIANTS.map(v => (
                                    <th key={v.key} className="text-center p-2 text-xs font-medium text-slate-400 w-24" title={v.label}>
                                        {v.label}
                                    </th>
                                ))}
                                <th
                                    onClick={() => handleSort("total")}
                                    className="text-center p-2 text-xs font-medium text-slate-400 cursor-pointer hover:text-white transition-colors w-16"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Total <SortIcon field="total" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((row) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        "border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors",
                                        row.total > 0 && "bg-emerald-500/5"
                                    )}
                                >
                                    <td className="p-2 text-xs text-slate-500 font-mono">
                                        {row.localId}
                                    </td>
                                    <td className="p-2">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            row.total > 0 ? "text-white" : "text-slate-400"
                                        )}>
                                            {row.name}
                                        </span>
                                    </td>
                                    <td className="p-2 text-xs text-slate-400 max-w-[120px] truncate" title={row.setName}>
                                        {row.setName}
                                    </td>
                                    <td className="p-2">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "border-0 text-[10px] px-1.5 py-0.5",
                                                getRarityColor(row.rarity)
                                            )}
                                        >
                                            {row.rarity}
                                        </Badge>
                                    </td>
                                    <td className="p-2 text-xs text-center text-slate-500">
                                        {row.hp}
                                    </td>
                                    {VARIANTS.map(v => (
                                        <td key={v.key} className="p-1">
                                            <VariantCell
                                                cardId={row.id}
                                                variant={v.key}
                                                count={row.variants[v.key]}
                                                isAvailable={row.availableVariants.has(v.key)}
                                            />
                                        </td>
                                    ))}
                                    <td className="p-2 text-center">
                                        {row.total > 0 ? (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                                                {row.total}
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-600 text-xs">0</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {tableData.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No se encontraron cartas
                    </div>
                )}
            </div>

            {/* Info de formato */}
            <div className="text-xs text-slate-500 p-4 bg-slate-900/30 rounded-lg border border-slate-800">
                <p className="font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Formato CSV
                </p>
                <p>
                    <strong>Exportar:</strong> Descarga todas las cartas con columnas para cada variante. <br />
                    <strong>Importar:</strong> El CSV debe tener <code className="bg-slate-800 px-1 rounded">Nombre</code> o <code className="bg-slate-800 px-1 rounded">Número</code>,
                    y columnas <code className="bg-slate-800 px-1 rounded">Normal</code>, <code className="bg-slate-800 px-1 rounded">Reverse</code>, etc.
                </p>
            </div>
        </div>
    );
}

function getRarityColor(rarity: string): string {
    const r = rarity.toLowerCase();
    if (r.includes("common")) return "bg-slate-700 text-slate-300";
    if (r.includes("uncommon")) return "bg-green-900/50 text-green-400";
    if (r.includes("rare") && !r.includes("ultra") && !r.includes("secret") && !r.includes("hyper")) {
        return "bg-blue-900/50 text-blue-400";
    }
    if (r.includes("ultra")) return "bg-purple-900/50 text-purple-400";
    if (r.includes("secret")) return "bg-amber-900/50 text-amber-400";
    if (r.includes("illustration") || r.includes("special art")) return "bg-pink-900/50 text-pink-400";
    if (r.includes("hyper") || r.includes("crown")) return "bg-amber-500/30 text-amber-300";
    return "bg-slate-700 text-slate-300";
}
