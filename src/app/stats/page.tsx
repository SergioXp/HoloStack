"use client";

import { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, TrendingUp, CreditCard, Layers, Award } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function StatsPage() {
    const { t } = useI18n();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/stats");
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-950 p-8 pb-24">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white text-sm mb-4 transition-colors">
                        <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                        {t("common.backToHome")}
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Estadísticas de Colección</h1>
                    <p className="text-slate-400">Análisis detallado de tu progreso y valor</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-slate-900/50 border-slate-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Valor Estimado</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-400">
                                ${data.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Basado en precios de mercado</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Cartas</CardTitle>
                            <Layers className="h-4 w-4 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{data.totalCards.toLocaleString()}</div>
                            <p className="text-xs text-slate-500 mt-1">Copias totales en colección</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900/50 border-slate-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Series Unicas</CardTitle>
                            <Award className="h-4 w-4 text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{data.seriesData.length}</div>
                            <p className="text-xs text-slate-500 mt-1">Eras coleccionadas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Rarity Distribution */}
                    <Card className="bg-slate-900/50 border-slate-800 text-white">
                        <CardHeader>
                            <CardTitle>Distribución por Rareza</CardTitle>
                            <CardDescription className="text-slate-400">Composición de tu colección</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.rarityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.rarityData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Series Distribution */}
                    <Card className="bg-slate-900/50 border-slate-800 text-white">
                        <CardHeader>
                            <CardTitle>Cartas por Serie</CardTitle>
                            <CardDescription className="text-slate-400">Volumen por era</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.seriesData.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Cards List */}
                <Card className="bg-slate-900/50 border-slate-800 text-white">
                    <CardHeader>
                        <CardTitle>Top 5 Cartas de Mayor Valor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.topCards.map((card: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <div className="font-bold text-slate-500 w-6">#{idx + 1}</div>
                                    {card.image && (
                                        <img src={card.image} alt={card.name} className="w-10 h-14 object-contain" />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-medium text-white">{card.name}</div>
                                        <div className="text-xs text-slate-400">{card.rarity}</div>
                                    </div>
                                    <div className="font-bold text-emerald-400">
                                        ${card.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
