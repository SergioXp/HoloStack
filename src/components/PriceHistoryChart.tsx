
"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useMemo } from "react";
import { formatPrice } from "@/lib/prices";
import { useI18n } from "@/lib/i18n";

interface PricePoint {
    date: string;
    marketPrice: number;
    source: string;
}

interface PriceHistoryChartProps {
    data: PricePoint[];
    currency?: string;
}

export function PriceHistoryChart({ data, currency = "EUR" }: PriceHistoryChartProps) {
    const { t } = useI18n();
    const chartData = useMemo(() => {
        return data.map(point => ({
            ...point,
            formattedDate: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }));
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">
                <p className="text-slate-500 text-sm">{t("cardDetail.noHistory")}</p>
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${currency === 'EUR' ? '€' : '$'}${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#10b981' }}
                        formatter={(value: any) => [formatPrice(Number(value), currency as any), "Price"]}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="marketPrice"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
