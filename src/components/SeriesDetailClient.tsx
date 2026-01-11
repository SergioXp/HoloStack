"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageOff, CheckCircle2, ChevronRight, Calendar, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SetData {
    id: string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    releaseDate: string | null;
    images: string | null;
}

interface SeriesDetailClientProps {
    seriesName: string;
    seriesSets: SetData[];
    countsMap: Record<string, number>;
}

export default function SeriesDetailClient({ seriesName, seriesSets, countsMap }: SeriesDetailClientProps) {
    const { t, locale } = useI18n();

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-b from-purple-900/10 via-slate-950 to-slate-950" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <Link href="/explorer" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                            {t("explorer.backToEras")}
                        </Link>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Package className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white tracking-tight">
                                    {seriesName}
                                </h1>
                                <p className="text-slate-400 text-lg">
                                    {seriesSets.length} {t("explorer.expansionsInEra")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sets Grid */}
                    {seriesSets.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {seriesSets.map((set) => {
                                const images = set.images ? JSON.parse(set.images) : null;
                                const downloadedCards = countsMap[set.id] || 0;
                                const isComplete = set.total > 0 && downloadedCards >= set.total;
                                const progress = set.total > 0 ? Math.round((downloadedCards / set.total) * 100) : 0;

                                return (
                                    <Link key={set.id} href={`/explorer/set/${set.id}`} className="group">
                                        <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-600 transition-all duration-300 cursor-pointer overflow-hidden h-full backdrop-blur-sm group-hover:shadow-2xl group-hover:shadow-purple-900/10 group-hover:scale-[1.02]">
                                            {/* Top Progress Bar */}
                                            <div className={`h-1 ${isComplete
                                                ? "bg-linear-to-r from-emerald-500 to-green-400"
                                                : downloadedCards > 0
                                                    ? "bg-linear-to-r from-blue-500 to-purple-500"
                                                    : "bg-slate-800"
                                                }`} style={{ width: `${Math.max(progress, isComplete ? 100 : downloadedCards > 0 ? 100 : 0)}%` }} />

                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between min-h-16 gap-3">
                                                    {/* Logo del set */}
                                                    {images?.logo ? (
                                                        <div className="relative h-14 w-40 flex-1">
                                                            <Image
                                                                src={images.logo}
                                                                alt={`${set.name} logo`}
                                                                fill
                                                                className="object-contain object-left"
                                                                sizes="160px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="h-14 flex-1 flex items-center justify-center bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                            <span className="text-slate-500 font-medium text-xs flex items-center gap-2">
                                                                <ImageOff className="w-4 h-4" />
                                                                {t("explorer.noLogo")}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Símbolo */}
                                                    {images?.symbol && (
                                                        <div className="relative h-10 w-10 shrink-0 bg-slate-800/50 rounded-lg p-1.5">
                                                            <Image
                                                                src={images.symbol}
                                                                alt={`${set.name} symbol`}
                                                                fill
                                                                className="object-contain p-1"
                                                                sizes="40px"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="pt-0">
                                                <CardTitle className="text-white text-lg mb-3 group-hover:text-purple-300 transition-colors line-clamp-1" title={set.name}>
                                                    {set.name}
                                                </CardTitle>

                                                <div className="flex items-center gap-2 text-sm mb-4">
                                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-0">
                                                        {set.total} {t("common.cards")}
                                                    </Badge>
                                                    {set.releaseDate && (
                                                        <span className="text-slate-500 text-xs flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(set.releaseDate).toLocaleDateString(locale, {
                                                                year: "numeric",
                                                                month: "short",
                                                            })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Status */}
                                                <div className="flex items-center justify-between">
                                                    {isComplete ? (
                                                        <span className="text-emerald-400 text-sm flex items-center gap-1.5 font-medium">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            {t("explorer.set.complete")}
                                                        </span>
                                                    ) : downloadedCards > 0 ? (
                                                        <span className="text-blue-400 text-sm flex items-center gap-1.5">
                                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                                            {downloadedCards} / {set.total}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500 text-sm">
                                                            {t("explorer.set.notDownloaded")}
                                                        </span>
                                                    )}

                                                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-24 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                            <p className="text-slate-500">{t("explorer.noSetsFound")}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
