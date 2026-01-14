"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Layers, Calendar, ChevronRight, Sparkles, LayoutGrid, List } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { TimelineView } from "@/components/TimelineView";
import { Button } from "@/components/ui/button";

interface DbSet {
    id: string;
    name: string;
    series: string;
    releaseDate: string | null;
    total: number;
}

interface SeriesInfo {
    count: number;
    latestRelease: string;
}

// Colores por era para hacer más visual
const seriesColors: Record<string, string> = {
    "Scarlet & Violet": "from-red-600/20 to-purple-600/20 border-red-500/30",
    "Sword & Shield": "from-cyan-600/20 to-pink-600/20 border-cyan-500/30",
    "Sun & Moon": "from-orange-600/20 to-blue-600/20 border-orange-500/30",
    "XY": "from-blue-600/20 to-red-600/20 border-blue-500/30",
    "Black & White": "from-slate-600/20 to-slate-400/10 border-slate-500/30",
    "HeartGold & SoulSilver": "from-yellow-600/20 to-slate-600/20 border-yellow-500/30",
    "Platinum": "from-slate-400/20 to-slate-600/20 border-slate-500/30",
    "Diamond & Pearl": "from-blue-600/20 to-pink-600/20 border-blue-500/30",
    "EX": "from-purple-600/20 to-blue-600/20 border-purple-500/30",
    "E-Card": "from-green-600/20 to-blue-600/20 border-green-500/30",
    "Neo": "from-indigo-600/20 to-purple-600/20 border-indigo-500/30",
    "Base": "from-yellow-600/20 to-red-600/20 border-yellow-500/30",
};

export default function ExplorerPage() {
    const { t, locale } = useI18n();
    const [loading, setLoading] = useState(true);
    const [series, setSeries] = useState<[string, SeriesInfo][]>([]);
    const [allSets, setAllSets] = useState<DbSet[]>([]);
    const [totalSets, setTotalSets] = useState(0);
    const [viewMode, setViewMode] = useState<"series" | "timeline">("series");

    const loadSets = async () => {
        try {
            const response = await fetch("/api/sets");
            const data = await response.json();

            if (data.count === 0) {
                setLoading(false);
                return;
            }

            const seriesMap = new Map<string, SeriesInfo>();

            for (const set of data.sets as DbSet[]) {
                const existing = seriesMap.get(set.series);
                const releaseDate = set.releaseDate || "1999-01-01";

                if (existing) {
                    existing.count++;
                    if (releaseDate > existing.latestRelease) {
                        existing.latestRelease = releaseDate;
                    }
                } else {
                    seriesMap.set(set.series, {
                        count: 1,
                        latestRelease: releaseDate,
                    });
                }
            }

            const sorted = Array.from(seriesMap.entries()).sort(
                (a, b) => b[1].latestRelease.localeCompare(a[1].latestRelease)
            );

            setSeries(sorted);
            setAllSets(data.sets);
            setTotalSets(data.count);
            setLoading(false);
        } catch (error) {
            console.error("Error loading sets:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSets();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 p-8">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-12 w-64 mb-4 bg-slate-800" />
                    <Skeleton className="h-6 w-48 mb-8 bg-slate-800" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-xl bg-slate-800" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-b from-purple-900/10 via-slate-950 to-slate-950" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <PageHeader
                        title={t("explorer.title")}
                        description={t("explorer.subtitle")}
                        icon={Layers}
                        iconColor="from-purple-500 to-blue-500"
                    />

                    {/* Main Content */}
                    {totalSets === 0 ? (
                        <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">{t("explorer.emptyState.title")}</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                {t("explorer.emptyState.description")}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Summary */}
                            <div className="flex flex-wrap gap-4 mb-10">
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-3 backdrop-blur-sm">
                                    <span className="text-2xl font-bold text-white">{series.length}</span>
                                    <span className="text-slate-400 ml-2">{t("explorer.eras")}</span>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-3 backdrop-blur-sm">
                                    <span className="text-2xl font-bold text-purple-400">{totalSets}</span>
                                    <span className="text-slate-400 ml-2">{t("explorer.syncedSets")}</span>
                                </div>
                            </div>

                            {/* View Toggle */}
                            <div className="flex justify-end mb-8">
                                <div className="bg-slate-900 border border-slate-800 p-1 rounded-lg inline-flex">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewMode("series")}
                                        className={cn(
                                            "h-8 px-3 rounded-md transition-all gap-2 text-xs",
                                            viewMode === "series" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                        Series
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setViewMode("timeline")}
                                        className={cn(
                                            "h-8 px-3 rounded-md transition-all gap-2 text-xs",
                                            viewMode === "timeline" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <List className="h-4 w-4" />
                                        Timeline
                                    </Button>
                                </div>
                            </div>

                            {/* Content */}
                            {viewMode === "timeline" ? (
                                <TimelineView sets={allSets} />
                            ) : (
                                /* Grid de Eras/Series */
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {series.map(([seriesName, info], index) => {
                                        const colorClass = seriesColors[seriesName] || "from-slate-700/20 to-slate-600/20 border-slate-600/30";

                                        return (
                                            <Link
                                                key={seriesName}
                                                href={`/explorer/${encodeURIComponent(seriesName)}`}
                                                className="group"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <Card className={`bg-linear-to-br ${colorClass} border hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden group-hover:scale-[1.02] group-hover:shadow-xl`}>
                                                    <CardHeader className="p-6">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <CardTitle className="text-xl font-bold text-white group-hover:text-white/90 transition-colors mb-2">
                                                                    {seriesName}
                                                                </CardTitle>
                                                                <CardDescription className="text-slate-400 flex items-center gap-2">
                                                                    <Calendar className="h-4 w-4" />
                                                                    {new Date(info.latestRelease).toLocaleDateString(locale, {
                                                                        year: "numeric",
                                                                        month: "long",
                                                                    })}
                                                                </CardDescription>
                                                            </div>
                                                            <Badge variant="secondary" className="bg-slate-900/50 text-white border-0 font-semibold shrink-0">
                                                                {info.count} {info.count === 1 ? t("common.set") : t("common.sets")}
                                                            </Badge>
                                                        </div>

                                                        {/* Hover indicator */}
                                                        <div className="mt-4 flex items-center text-sm text-slate-500 group-hover:text-white/70 transition-colors">
                                                            <span>{t("explorer.viewExpansions")}</span>
                                                            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </CardHeader>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
