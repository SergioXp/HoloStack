"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutGrid, Layers, Library as LibraryIcon, Database, Sparkles, Settings, Wallet, Heart, ChartBar, Printer, BookOpen, BarChart3, Menu, PackageOpen, ShoppingBag } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ...



import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ChangelogModal } from "@/components/ChangelogModal";


export default function Header() {
    const pathname = usePathname();
    const { t } = useI18n();
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexProgress, setIndexProgress] = useState(0);
    const [indexStatus, setIndexStatus] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [changelogOpen, setChangelogOpen] = useState(false);

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

    const inventoryItems = [
        { name: t("nav.collections"), href: "/collections", icon: LibraryIcon },
        { name: t("binder.title"), href: "/binder", icon: BookOpen },
        { name: t("nav.wishlist"), href: "/wishlist", icon: Heart },
        { name: t("nav.bulk"), href: "/bulk", icon: PackageOpen },
        { name: t("proxies.print"), href: "/proxies", icon: Printer },
    ];

    const marketItems = [
        { name: t("nav.explorer"), href: "/explorer", icon: Layers },
        { name: t("portfolio.title"), href: "/portfolio", icon: BarChart3 },
        { name: t("nav.stats"), href: "/stats", icon: ChartBar },
        { name: t("nav.budgets"), href: "/budgets", icon: Wallet },
    ];

    const isHome = pathname === "/";

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300",
            "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300",
            // Add padding-left when in Electron mode to avoid traffic lights overlap - Handled in globals.css via body.is-electron
            isHome
                ? "border-transparent bg-linear-to-b from-background/80 via-background/40 to-transparent"
                : "border-border bg-background/80"
        )}>
            <div className="w-full flex h-16 items-center px-4 md:px-8">
                {/* Logo */}
                <Link href="/" className="mr-8 flex items-center space-x-3 group">
                    <div className="relative">
                        <Image
                            src="/icon.png"
                            alt="HoloStack Logo"
                            width={32}
                            height={32}
                            className="group-hover:scale-110 transition-transform duration-300 rounded-lg shadow-lg shadow-primary/10"
                        />
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="font-bold text-lg text-foreground hidden sm:inline-block tracking-tight drop-shadow-md">
                        HoloStack
                    </span>
                </Link>

                {/* Mobile Menu Trigger */}
                <div className="md:hidden mr-auto">
                    <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-300">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none bg-slate-950/95 backdrop-blur-xl border-none flex flex-col pt-12">
                            <DialogHeader className="px-6 text-left">
                                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                                    <Image src="/icon.png" alt="Logo" width={28} height={28} className="rounded-md" /> HoloStack
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Menú Principal
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                                {/* Dashboard */}
                                <Link
                                    href="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 text-slate-200"
                                >
                                    <LayoutGrid className="h-5 w-5 mr-3 text-blue-400" />
                                    {t("nav.home")}
                                </Link>

                                {/* Inventory Group */}
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">{t("nav.inventory")}</h4>
                                    <div className="space-y-1">
                                        {inventoryItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center p-3 rounded-lg text-base font-medium transition-all",
                                                    pathname.startsWith(item.href)
                                                        ? "bg-slate-800 text-white"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5 mr-3" />
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Market Group */}
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">{t("nav.market")}</h4>
                                    <div className="space-y-1">
                                        {marketItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center p-3 rounded-lg text-base font-medium transition-all",
                                                    pathname.startsWith(item.href)
                                                        ? "bg-slate-800 text-white"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5 mr-3" />
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-3">
                                <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                                    <Button
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white h-12 text-lg"
                                        variant="default"
                                    >
                                        <Settings className="h-5 w-5 mr-3" />
                                        {t("nav.settings")}
                                    </Button>
                                </Link>
                                <Button
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white h-12 text-lg"
                                    onClick={() => setOpenDialog(true)}
                                >
                                    <Database className="h-5 w-5 mr-3" />
                                    {t("nav.sync")}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-2 flex-1">
                    {/* Inicio */}
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            pathname === "/"
                                ? "bg-primary/10 text-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        <span>{t("nav.home")}</span>
                    </Link>

                    {/* Inventario Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1.5 ring-slate-700">
                                <LibraryIcon className="h-4 w-4" />
                                <span>{t("nav.inventory")}</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 bg-slate-950 border-slate-800 text-slate-300">
                            {inventoryItems.map((item) => (
                                <DropdownMenuItem key={item.href} asChild className="focus:bg-slate-900 focus:text-white cursor-pointer hover:bg-slate-900">
                                    <Link href={item.href} className="w-full flex items-center py-2">
                                        <item.icon className="h-4 w-4 mr-3 text-slate-500" />
                                        <span>{item.name}</span>
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mercado Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1.5 ring-slate-700">
                                <BarChart3 className="h-4 w-4" />
                                <span>{t("nav.market")}</span>
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 bg-slate-900 border-slate-800 text-slate-300">
                            {marketItems.map((item) => (
                                <DropdownMenuItem key={item.href} asChild className="focus:bg-slate-900 focus:text-white cursor-pointer hover:bg-slate-900">
                                    <Link href={item.href} className="w-full flex items-center py-2">
                                        <item.icon className="h-4 w-4 mr-3 text-slate-500" />
                                        <span>{item.name}</span>
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </nav>

                {/* Global Search */}
                <div className="hidden lg:block flex-1 max-w-sm mx-4">
                    <GlobalSearch />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Changelog Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-yellow-400 hover:bg-slate-800/50 transition-colors"
                        onClick={() => setChangelogOpen(true)}
                        title={t('changelog.action')}
                    >
                        <Sparkles className="h-5 w-5" />
                    </Button>

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
                    {/* Market Import Button */}
                    <Link href="/import">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "text-slate-400 hover:text-white hover:bg-slate-800/50",
                                pathname === "/import" && "bg-slate-800 text-white"
                            )}
                            title="Importar desde Cardmarket"
                        >
                            <ShoppingBag className="h-5 w-5" />
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
            <ChangelogModal open={changelogOpen} onOpenChange={setChangelogOpen} />
        </header>
    );
}
