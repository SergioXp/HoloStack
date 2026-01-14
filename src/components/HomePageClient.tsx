"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

interface HomePageClientProps {
    stats: {
        totalCards: number;
        totalSets: number;
        totalCollections: number;
        totalOwnedCards: number;
        totalValue: number;
        recentCards: {
            id: string;
            name: string;
            images: string | null;
            rarity: string | null;
            set: string | null;
            addedAt: Date | null;
        }[];
    }
}

export default function HomePageClient({ stats }: HomePageClientProps) {
    const { t } = useI18n();

    return (
        <div className="min-h-screen bg-slate-950 overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-linear-to-br from-purple-900/20 via-slate-950 to-blue-900/20" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-linear-to-r from-yellow-500/5 to-red-500/5 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Hero Section */}
                <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center">
                    {/* Floating Cards Animation - CSS Only */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>🎴</div>
                        <div className="absolute top-40 right-20 text-5xl opacity-15 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>⭐</div>
                        <div className="absolute bottom-40 left-20 text-4xl opacity-20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>✨</div>
                        <div className="absolute bottom-20 right-10 text-6xl opacity-15 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '0.3s' }}>🃏</div>
                    </div>

                    {/* Logo */}
                    <div className="mb-8 relative">
                        <div className="text-8xl mb-4 animate-pulse">🎴</div>
                        <div className="absolute inset-0 blur-2xl bg-yellow-500/20 rounded-full scale-150" />
                    </div>

                    {/* Title */}
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 mb-6 tracking-tight">
                        {t("home.title")}
                    </h1>
                    <p className="text-2xl md:text-3xl text-slate-300 mb-4 font-light">
                        {t("home.subtitle")}
                    </p>
                    <p className="text-slate-500 max-w-xl mx-auto mb-10 text-lg">
                        {t("home.description")}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-16">
                        <Link href="/explorer">
                            <Button size="lg" className="bg-linear-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-black font-bold px-10 h-14 text-lg rounded-full shadow-xl shadow-orange-500/25 transition-all hover:scale-105 hover:shadow-orange-500/40">
                                🔍 {t("home.exploreButton")}
                            </Button>
                        </Link>
                        <Link href="/collections">
                            <Button size="lg" variant="outline" className="border-2 border-purple-500/50 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 hover:border-purple-400 h-14 px-10 text-lg rounded-full backdrop-blur-sm transition-all hover:scale-105">
                                📚 {t("home.collectionsButton")}
                            </Button>
                        </Link>
                    </div>

                    {/* Quick Stats */}
                    {stats.totalCards > 0 && (
                        <div className="flex flex-wrap justify-center gap-8 text-center">
                            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl px-6 py-4">
                                <div className="text-3xl font-bold text-white">{stats.totalCards.toLocaleString()}</div>
                                <div className="text-sm text-slate-400 uppercase tracking-wider">{t("home.stats.cardsIndexed")}</div>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl px-6 py-4">
                                <div className="text-3xl font-bold text-purple-400">{stats.totalSets}</div>
                                <div className="text-sm text-slate-400 uppercase tracking-wider">{t("home.stats.setsAvailable")}</div>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl px-6 py-4">
                                <div className="text-3xl font-bold text-emerald-400">{stats.totalOwnedCards}</div>
                                <div className="text-sm text-slate-400 uppercase tracking-wider">{t("home.stats.inCollection")}</div>
                            </div>
                            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl px-6 py-4">
                                <div className="text-3xl font-bold text-yellow-400">
                                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(stats.totalValue)}
                                </div>
                                <div className="text-sm text-slate-400 uppercase tracking-wider">{t("home.stats.totalValue")}</div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Features Section */}
                <section className="py-24 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-white mb-4">{t("home.features.title")}</h2>
                            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                                {t("home.features.subtitle")}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <Card className="bg-linear-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                                        📚
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">{t("home.features.explore.title")}</h3>
                                    <p className="text-slate-400 mb-6 leading-relaxed">
                                        {t("home.features.explore.description")}
                                    </p>
                                    <Link href="/explorer" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                                        {t("home.features.cta")}
                                        <span>→</span>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Feature 2 */}
                            <Card className="bg-linear-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                                        ✨
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">{t("home.features.track.title")}</h3>
                                    <p className="text-slate-400 mb-6 leading-relaxed">
                                        {t("home.features.track.description")}
                                    </p>
                                    <Link href="/collections" className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                                        {t("home.features.viewCollections")}
                                        <span>→</span>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Feature 3 */}
                            <Card className="bg-linear-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden group hover:border-green-500/50 transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
                                        💰
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-3">{t("home.features.value.title")}</h3>
                                    <p className="text-slate-400 mb-6 leading-relaxed">
                                        {t("home.features.value.description")}
                                    </p>
                                    <span className="text-green-400 font-semibold inline-flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        {t("home.features.autoUpdate")}
                                    </span>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section className="py-24 px-4 bg-linear-to-b from-slate-950 to-slate-900">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-white mb-4">{t("home.howItWorks.title")}</h2>
                            <p className="text-slate-400 text-lg">{t("home.howItWorks.subtitle")}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-linear-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-4xl font-bold text-black mx-auto mb-6 shadow-xl shadow-yellow-500/20">
                                    1
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{t("home.howItWorks.step1.title")}</h3>
                                <p className="text-slate-400">
                                    {t("home.howItWorks.step1.description")}
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-6 shadow-xl shadow-purple-500/20">
                                    2
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{t("home.howItWorks.step2.title")}</h3>
                                <p className="text-slate-400">
                                    {t("home.howItWorks.step2.description")}
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-4xl font-bold text-white mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                                    3
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{t("home.howItWorks.step3.title")}</h3>
                                <p className="text-slate-400">
                                    {t("home.howItWorks.step3.description")}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-slate-800 py-12 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🎴</span>
                                <span className="text-xl font-bold text-white">{t("home.title")}</span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-slate-500">
                                <span>{t("home.footer.apiData")}</span>
                                <span>•</span>
                                <span>{t("home.footer.pricesData")}</span>
                            </div>

                            <div className="text-slate-600 text-sm">
                                {t("home.footer.copyright", { year: new Date().getFullYear() })}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
