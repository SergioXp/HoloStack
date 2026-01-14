"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";

interface DbSet {
    id: string;
    name: string;
    series: string;
    releaseDate: string | null;
    total: number;
    images?: string;
}

interface TimelineViewProps {
    sets: DbSet[];
}

export function TimelineView({ sets }: TimelineViewProps) {
    const { locale } = useI18n();
    const dateLocale = locale === "es" ? es : enUS;

    // Filter sets with dates and sort chronologically descending (newest first)
    const sortedSets = [...sets]
        .filter(s => s.releaseDate)
        .sort((a, b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime());

    // Group by year for visual separation
    const setsByYear: Record<string, DbSet[]> = {};
    sortedSets.forEach(set => {
        const year = set.releaseDate!.substring(0, 4);
        if (!setsByYear[year]) setsByYear[year] = [];
        setsByYear[year].push(set);
    });

    const years = Object.keys(setsByYear).sort((a, b) => Number(b) - Number(a));

    return (
        <div className="relative max-w-4xl mx-auto py-12 px-4">
            {/* Vertical Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-linear-to-b from-purple-500/0 via-purple-500/50 to-purple-500/0" />

            {years.map((year, yearIndex) => (
                <div key={year} className="mb-16 relative">
                    {/* Year Marker */}
                    <div className="flex items-center justify-center mb-8 relative z-10">
                        <Badge variant="outline" className="bg-slate-900 border-purple-500/50 text-purple-300 px-4 py-1 text-lg font-bold">
                            {year}
                        </Badge>
                    </div>

                    <div className="space-y-12">
                        {setsByYear[year].map((set, setIndex) => {
                            const isEven = setIndex % 2 === 0;
                            const setImages = set.images ? JSON.parse(set.images) : null;
                            const releaseDate = new Date(set.releaseDate!);

                            return (
                                <Link
                                    key={set.id}
                                    href={`/explorer/set/${set.id}`}
                                    className="group relative flex items-center md:justify-center w-full"
                                >
                                    {/* Timeline Dot */}
                                    <div className="absolute left-8 md:left-1/2 -ml-[5px] w-2.5 h-2.5 rounded-full bg-purple-500 border-2 border-slate-900 group-hover:scale-150 group-hover:bg-purple-400 transition-all duration-300 shadow-[0_0_10px_var(--color-purple-500)] z-20" />

                                    {/* Content Card */}
                                    <div className={cn(
                                        "ml-20 md:ml-0 md:w-5/12 transition-all duration-300 group-hover:-translate-y-1",
                                        isEven ? "md:mr-auto md:text-right" : "md:ml-auto md:order-last"
                                    )}>
                                        <div className={cn(
                                            "bg-slate-900/40 border border-slate-800 p-4 rounded-xl backdrop-blur-sm hover:bg-slate-900/60 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-900/10 transition-all group",
                                            "flex gap-4 items-center",
                                            isEven ? "md:flex-row-reverse" : "md:flex-row"
                                        )}>
                                            {/* Symbol */}
                                            {setImages?.symbol && (
                                                <div className="w-12 h-12 shrink-0 bg-slate-800/50 rounded-lg p-2 flex items-center justify-center">
                                                    <img src={setImages.symbol} alt="" className="max-w-full max-h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline gap-2 mb-1 justify-start md:justify-end flex-wrap">
                                                    {isEven ? (
                                                        <>
                                                            <span className="text-xs text-slate-500 font-mono hidden md:inline">{set.total} cards</span>
                                                            <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors">{set.name}</h3>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors">{set.name}</h3>
                                                            <span className="text-xs text-slate-500 font-mono hidden md:inline">{set.total} cards</span>
                                                        </>
                                                    )}
                                                    {/* Mobile Order Fix */}
                                                    <h3 className="md:hidden text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors w-full">{set.name}</h3>
                                                </div>

                                                <p className="text-sm text-slate-400">
                                                    {format(releaseDate, "d MMM", { locale: dateLocale })}
                                                    <span className="md:hidden ml-2 text-xs text-slate-600">• {set.total} cards</span>
                                                </p>
                                                <Badge variant="secondary" className="mt-2 text-[10px] bg-slate-800 text-slate-400 group-hover:bg-purple-900/20 group-hover:text-purple-300">
                                                    {set.series}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
