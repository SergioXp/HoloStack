"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon, Library, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/PageHeader";

interface CollectionWithStats {
    id: string;
    name: string;
    type: string;
    filters: string | null;
    createdAt: Date | null;
    uniqueCardCount: number;
    totalValue: number;
}

interface SetBasicInfo {
    id: string;
    name: string;
    total: number;
    printedTotal: number;
}

interface CollectionsIndexClientProps {
    collections: CollectionWithStats[];
    sets: SetBasicInfo[];
}

export default function CollectionsIndexClient({ collections, sets }: CollectionsIndexClientProps) {
    const { t, locale } = useI18n();
    const setsMap = new Map(sets.map(s => [s.id, s]));

    // Calculate total stats
    const totalCards = collections.reduce((acc, c) => acc + c.uniqueCardCount, 0);

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-br from-purple-900/10 via-slate-950 to-blue-900/10" />
                <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <PageHeader
                        title={t("collections.title")}
                        description={t("collections.subtitle")}
                        icon={Library}
                        stats={collections.length > 0 ? (
                            <div className="flex gap-4">
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 backdrop-blur-sm">
                                    <span className="text-xl font-bold text-white">{collections.length}</span>
                                    <span className="text-slate-400 ml-2 text-sm">{t("common.collections")}</span>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 backdrop-blur-sm">
                                    <span className="text-xl font-bold text-emerald-400">{totalCards}</span>
                                    <span className="text-slate-400 ml-2 text-sm">{t("collections.uniqueCards")}</span>
                                </div>
                            </div>
                        ) : null}
                        actions={collections.length > 0 ? (
                            <Link href="/collections/new">
                                <Button className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-6 h-12 rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-105">
                                    <PlusIcon className="mr-2 h-5 w-5" />
                                    {t("collections.newCollection")}
                                </Button>
                            </Link>
                        ) : null}
                    />

                    {/* Content */}
                    {collections.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 px-4 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30 backdrop-blur-sm">
                            <div className="w-24 h-24 rounded-full bg-linear-to-br from-slate-800 to-slate-700 flex items-center justify-center mb-8 shadow-xl">
                                <Sparkles className="w-12 h-12 text-slate-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">{t("collections.emptyState.title")}</h3>
                            <p className="text-slate-400 mb-8 max-w-md text-center text-lg leading-relaxed">
                                {t("collections.emptyState.description")}
                            </p>
                            <Link href="/collections/new">
                                <Button size="lg" className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-6 text-lg font-semibold shadow-xl shadow-purple-500/20 rounded-2xl transition-all hover:scale-105">
                                    <PlusIcon className="mr-2 h-5 w-5" />
                                    {t("collections.createFirst")}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {collections.map(collection => {
                                let totalCards = 0;
                                let progress = 0;
                                let setName = "";

                                if (collection.type === 'auto' && collection.filters) {
                                    try {
                                        const filters = JSON.parse(collection.filters);
                                        if (filters.set) {
                                            const setInfo = setsMap.get(filters.set);
                                            totalCards = setInfo?.total || 0;
                                            setName = setInfo?.name || "";
                                        }
                                    } catch { }

                                    if (totalCards > 0) {
                                        progress = Math.round((collection.uniqueCardCount / totalCards) * 100);
                                    }
                                } else {
                                    totalCards = collection.uniqueCardCount;
                                    progress = 100;
                                }

                                const isComplete = progress === 100 && collection.type === 'auto';

                                return (
                                    <Link key={collection.id} href={`/collections/${collection.id}`} className="group">
                                        <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-600 transition-all duration-300 h-full flex flex-col overflow-hidden relative backdrop-blur-sm group-hover:shadow-2xl group-hover:shadow-purple-900/10 group-hover:scale-[1.02]">
                                            {/* Top Gradient Bar */}
                                            <div className={`absolute top-0 left-0 w-full h-1 ${isComplete
                                                ? "bg-linear-to-r from-emerald-500 to-green-400"
                                                : "bg-linear-to-r from-purple-500 to-pink-500"
                                                } opacity-60 group-hover:opacity-100 transition-opacity`} />

                                            <CardHeader className="pb-3">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <CardTitle className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                                                            {collection.name}
                                                        </CardTitle>
                                                        {setName && (
                                                            <p className="text-xs text-slate-500 mt-1 truncate">{setName}</p>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className={`shrink-0 capitalize border-0 font-medium ${collection.type === 'auto'
                                                        ? 'bg-purple-500/10 text-purple-300'
                                                        : 'bg-blue-500/10 text-blue-300'
                                                        }`}>
                                                        {collection.type === 'auto' ? t("collections.auto") : t("collections.manual")}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="text-slate-500 text-xs mt-2">
                                                    {t("collections.createdOn")} {collection.createdAt ? new Date(collection.createdAt).toLocaleDateString(locale, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    }) : ""}
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="mt-auto pt-0">
                                                <div className="mb-4 flex items-center gap-2">
                                                    <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 font-normal hover:bg-slate-800">
                                                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(collection.totalValue)}
                                                    </Badge>
                                                </div>

                                                {collection.type === 'auto' ? (
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-3xl font-bold text-white">{collection.uniqueCardCount}</span>
                                                                    <span className="text-sm text-slate-500">/ {totalCards}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{t("common.cards")}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`text-3xl font-bold ${isComplete ? "text-emerald-400" : "text-white"}`}>
                                                                    {progress}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-700 ease-out ${isComplete
                                                                    ? "bg-linear-to-r from-emerald-500 to-green-400"
                                                                    : "bg-linear-to-r from-purple-500 to-pink-500"
                                                                    }`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-3xl font-bold text-white">{collection.uniqueCardCount}</p>
                                                            <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{t("common.cards")}</p>
                                                        </div>
                                                        <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
