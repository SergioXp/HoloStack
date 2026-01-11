"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from "recharts";
import { useI18n } from "@/lib/i18n";

interface PriceHistoryData {
    date: string;
    marketPrice: number;
    source: string;
}

interface PriceChartProps {
    data: PriceHistoryData[];
    currency?: string;
}

export default function PriceChart({ data, currency = "USD" }: PriceChartProps) {
    const { t, locale } = useI18n();

    // Ordenar datos por fecha y formatear
    const chartData = useMemo(() => {
        return [...data]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(item => ({
                ...item,
                dateFormatted: new Date(item.date).toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "short"
                }),
                priceFormatted: `$${item.marketPrice.toFixed(2)}`
            }));
    }, [data, locale]);

    // Calcular estadísticas
    const stats = useMemo(() => {
        if (chartData.length === 0) return null;

        const prices = chartData.map(d => d.marketPrice);
        const current = prices[prices.length - 1];
        const first = prices[0];
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const change = current - first;
        const changePercent = first > 0 ? (change / first) * 100 : 0;

        return { current, first, min, max, change, changePercent };
    }, [chartData]);

    if (chartData.length === 0) {
        return (
            <div className="bg-slate-900 rounded-lg p-6 text-center">
                <p className="text-slate-500">{t("cardDetail.noHistory")}</p>
                <p className="text-slate-600 text-sm mt-2">
                    {t("cardDetail.historyUpdate")}
                </p>
            </div>
        );
    }

    // Colores según tendencia
    const isPositive = stats && stats.change >= 0;
    const lineColor = isPositive ? "#22c55e" : "#ef4444";
    const gradientId = "priceGradient";

    return (
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            {/* Header con estadísticas */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">{t("cardDetail.marketPrices")}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                            ${stats?.current.toFixed(2)}
                        </span>
                        {stats && (
                            <span className={`text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                                {isPositive ? "+" : ""}{stats.changePercent.toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
                {stats && (
                    <div className="text-right text-xs text-slate-500">
                        <div>{t("cardDetail.min")}: ${stats.min.toFixed(2)}</div>
                        <div>{t("cardDetail.max")}: ${stats.max.toFixed(2)}</div>
                    </div>
                )}
            </div>

            {/* Gráfico */}
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="dateFormatted"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                            domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #334155",
                                borderRadius: "8px",
                                color: "#fff"
                            }}
                            labelStyle={{ color: "#94a3b8" }}
                            formatter={(value: number | undefined) => [`$${(value ?? 0).toFixed(2)}`, t("cardDetail.price")]}
                            labelFormatter={(label) => `${t("cardDetail.date")}: ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="marketPrice"
                            stroke={lineColor}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Footer con info */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                <span>{t("cardDetail.source", { source: chartData[chartData.length - 1]?.source || "TCGPlayer" })}</span>
                <span>{t("cardDetail.records", { count: chartData.length })}</span>
            </div>
        </div>
    );
}
