"use client";

import { CreditCard, Layers, Heart, Wallet, Box, Library, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { GlobalSearchResult } from "@/lib/global-search";

interface SearchResultsClientProps {
    query: string;
    results: GlobalSearchResult[];
}

export function SearchResultsClient({ query, results }: SearchResultsClientProps) {
    const { t } = useI18n();

    // Si no hay query, mostrar estado vacío
    if (query.length < 2) {
        return (
            <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-center text-slate-400">
                <Search className="h-16 w-16 mb-4 opacity-20" />
                <h1 className="text-2xl font-bold text-white mb-2">{t("search.resultsTitle")}</h1>
                <p>{t("search.enterQuery")}</p>
            </div>
        );
    }

    const grouped = {
        card: results.filter(r => r.type === 'card'),
        set: results.filter(r => r.type === 'set'),
        collection: results.filter(r => r.type === 'collection'),
        wishlist: results.filter(r => r.type === 'wishlist'),
        portfolio: results.filter(r => r.type === 'portfolio'),
        budget: results.filter(r => r.type === 'budget'),
    };

    const sections = [
        { type: 'portfolio', label: t("search.sections.portfolio"), icon: Box, color: 'text-purple-400', items: grouped.portfolio },
        { type: 'wishlist', label: t("search.sections.wishlist"), icon: Heart, color: 'text-pink-400', items: grouped.wishlist },
        { type: 'set', label: t("search.sections.sets"), icon: Layers, color: 'text-amber-400', items: grouped.set },
        { type: 'collection', label: t("search.sections.collections"), icon: Library, color: 'text-blue-400', items: grouped.collection },
        { type: 'budget', label: t("search.sections.budgets"), icon: Wallet, color: 'text-green-400', items: grouped.budget },
        { type: 'card', label: t("search.sections.cards"), icon: CreditCard, color: 'text-emerald-400', items: grouped.card },
    ].filter(s => s.items.length > 0);

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t("search.resultsTitle")}</h1>
                    <p className="text-slate-400">{t("search.foundMatches", { count: results.length, query: query })}</p>
                </div>

                {sections.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                        <p className="text-slate-400 text-lg">{t("search.noResults", { query })}</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {sections.map((section) => (
                            <div key={section.type} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-2">
                                    <section.icon className={`h-6 w-6 ${section.color}`} />
                                    <h2 className="text-xl font-bold text-white">{section.label}</h2>
                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 ml-auto">
                                        {section.items.length}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {section.items.map((item) => (
                                        <Link key={`${item.type}-${item.id}`} href={item.url}>
                                            <div className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-lg p-3 flex items-center gap-4 transition-all group h-full">
                                                <div className="relative w-12 h-16 bg-slate-800 rounded flex items-center justify-center overflow-hidden shrink-0 border border-slate-700/50">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.title}
                                                            fill
                                                            className={section.type === 'set' ? "object-contain p-2" : "object-cover"}
                                                        />
                                                    ) : (
                                                        <section.icon className={`h-6 w-6 opacity-30 ${section.color}`} />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-400 truncate">
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
