"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Layers, Library as LibraryIcon, Database, Sparkles, Settings, Wallet, Heart, ChartBar, Printer, BookOpen, BarChart3 } from "lucide-react";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

export default function Header() {
    const pathname = usePathname();
    const { t } = useI18n();
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexProgress, setIndexProgress] = useState(0);
    const [indexStatus, setIndexStatus] = useState("");
    const [openDialog, setOpenDialog] = useState(false);

    const runGlobalIndex = async () => {
        setIsIndexing(true);
        setIndexProgress(0);
        setIndexStatus(t("sync.inProgress"));

        try {
            const eventSource = new EventSource("/api/sync/index-all");

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.message) setIndexStatus(data.message);
                if (data.progress) setIndexProgress(data.progress);

                if (data.status === "complete") {
                    eventSource.close();
                    setIsIndexing(false);
                    setIndexStatus(`✅ ${data.message}`);
                } else if (data.status === "error") {
                    eventSource.close();
                    setIsIndexing(false);
                    setIndexStatus(`❌ ${data.message}`);
                }
            };

            eventSource.onerror = () => {
                setIndexStatus(t("common.error"));
                eventSource.close();
                setIsIndexing(false);
            };

        } catch (error) {
            setIndexStatus(t("common.error"));
            setIsIndexing(false);
        }
    };

    const navItems = [
        { name: t("nav.home"), href: "/", icon: LayoutGrid },
        { name: t("nav.explorer"), href: "/explorer", icon: Layers },
        { name: t("nav.collections"), href: "/collections", icon: LibraryIcon },
        { name: t("nav.wishlist"), href: "/wishlist", icon: Heart },
        { name: t("nav.stats"), href: "/stats", icon: ChartBar },
        { name: t("nav.budgets"), href: "/budgets", icon: Wallet },
        { name: t("portfolio.title"), href: "/portfolio", icon: BarChart3 },
        { name: t("binder.title"), href: "/binder", icon: BookOpen },
        { name: t("proxies.print"), href: "/proxies", icon: Printer },
    ];

    const isHome = pathname === "/";

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300",
            isHome
                ? "border-transparent bg-linear-to-b from-background/80 via-background/40 to-transparent"
                : "border-border bg-background/80"
        )}>
            <div className="container flex h-16 items-center px-4 md:px-8">
                {/* Logo */}
                <Link href="/" className="mr-8 flex items-center space-x-3 group">
                    <div className="relative">
                        <span className="text-2xl group-hover:scale-110 transition-transform inline-block">🎴</span>
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-bold text-lg text-foreground hidden sm:inline-block tracking-tight drop-shadow-md">
                        HoloStack
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center space-x-1 flex-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 drop-shadow-md"
                                )}
                            >
                                <item.icon className="h-4 w-4 mr-2" />
                                <span className="hidden md:inline">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Settings Button */}
                    <Link href="/settings">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "text-slate-400 hover:text-white hover:bg-slate-800/50",
                                pathname === "/settings" && "bg-slate-800 text-white"
                            )}
                        >
                            <Settings className="h-5 w-5" />
                        </Button>
                    </Link>

                    {/* Sync Button */}
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all",
                                    isIndexing && "border-blue-500/50 bg-blue-950/30"
                                )}
                            >
                                <Database className={cn("h-4 w-4 mr-2", isIndexing && "animate-pulse text-blue-400")} />
                                <span className="hidden sm:inline text-xs">
                                    {isIndexing ? `${indexProgress}%` : t("nav.sync")}
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl">
                                    <Sparkles className="h-5 w-5 text-yellow-400" />
                                    {t("sync.title")}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    {t("sync.description")}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                {/* Info Card */}
                                <div className="bg-linear-to-r from-blue-950/50 to-purple-950/50 border border-blue-500/20 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">🚀</div>
                                        <div>
                                            <p className="text-blue-200 font-medium mb-1">TCGdex API</p>
                                            <p className="text-blue-300/70 text-sm">
                                                {t("sync.warning")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-300">{indexStatus || t("sync.start")}</span>
                                        <span className="text-white font-mono font-bold">{indexProgress}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                indexProgress === 100
                                                    ? "bg-linear-to-r from-green-500 to-emerald-400"
                                                    : "bg-linear-to-r from-blue-500 to-purple-500"
                                            )}
                                            style={{ width: `${indexProgress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Button
                                    onClick={runGlobalIndex}
                                    disabled={isIndexing || indexProgress === 100}
                                    className={cn(
                                        "w-full h-12 text-base font-semibold rounded-xl transition-all",
                                        indexProgress === 100
                                            ? "bg-green-600 hover:bg-green-500"
                                            : "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                                    )}
                                >
                                    {isIndexing ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {t("sync.inProgress")}
                                        </span>
                                    ) : indexProgress === 100 ? (
                                        `✓ ${t("sync.complete")}`
                                    ) : (
                                        t("sync.start")
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </header>
    );
}
