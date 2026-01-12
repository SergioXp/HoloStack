"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2, CreditCard, Layers, Heart, Wallet, Library, Box, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface SearchResult {
    type: "card" | "set" | "collection" | "wishlist" | "portfolio" | "budget";
    id: string;
    title: string;
    subtitle: string;
    image: string | null;
    url: string;
}

export function GlobalSearch() {
    const router = useRouter();
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce manual
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const fetchResults = async () => {
            if (debouncedQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/search/global?q=${encodeURIComponent(debouncedQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [debouncedQuery]);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false);
        setQuery(""); // Opcional: limpiar búsqueda
        router.push(result.url);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "card": return <CreditCard className="h-4 w-4 text-emerald-400" />;
            case "set": return <Layers className="h-4 w-4 text-amber-400" />;
            case "collection": return <Library className="h-4 w-4 text-blue-400" />;
            case "wishlist": return <Heart className="h-4 w-4 text-pink-400" />;
            case "portfolio": return <Box className="h-4 w-4 text-purple-400" />;
            case "budget": return <Wallet className="h-4 w-4 text-green-400" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    const getCategoryLabel = (type: string) => {
        const keyMap: Record<string, string> = {
            card: "cards",
            set: "sets",
            collection: "collections",
            wishlist: "wishlist",
            portfolio: "portfolio",
            budget: "budgets"
        };
        const key = keyMap[type] || "cards";
        return t(`search.sections.${key}`);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-10 w-full rounded-md transition-all"
                    placeholder={t("search.placeholder")}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
                )}
            </div>

            {isOpen && (results.length > 0 || debouncedQuery.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e2330] border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {results.length === 0 && !loading ? (
                            <div className="p-4 text-center text-slate-400">
                                {t("search.noResults", { query })}
                            </div>
                        ) : (
                            <div className="py-2">
                                {results.slice(0, 8).map((result) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        className="flex items-center px-4 py-2 hover:bg-slate-800/80 cursor-pointer group border-b border-transparent hover:border-slate-800 last:border-0 transition-colors"
                                        onClick={() => handleSelect(result)}
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 mr-3 relative flex items-center justify-center bg-slate-800 rounded overflow-hidden border border-slate-700">
                                            {result.image ? (
                                                <Image
                                                    src={result.image}
                                                    alt={result.title}
                                                    width={32}
                                                    height={32}
                                                    className="object-contain"
                                                />
                                            ) : (
                                                getIcon(result.type)
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white truncate flex items-center gap-2">
                                                {result.title}
                                                {result.type === 'wishlist' && <Heart className="h-3 w-3 text-pink-500 fill-current" />}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate">
                                                {result.subtitle}
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 ml-3 text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                                            {getCategoryLabel(result.type)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer: View All */}
                    <div
                        className="bg-slate-900 border-t border-slate-700 p-2 text-center clickable hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => {
                            setIsOpen(false);
                            router.push(`/search?q=${encodeURIComponent(query)}`);
                        }}
                    >
                        <span className="text-xs text-blue-400 font-medium flex items-center justify-center gap-1 group">
                            {t("search.showAll")} ({results.length > 8 ? '10+' : results.length})
                            <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
