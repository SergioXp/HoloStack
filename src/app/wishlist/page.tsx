"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, ShoppingCart, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { db } from "@/db"; // Server only, can't use here. Need API.

export default function WishlistPage() {
    const { t } = useI18n();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/wishlist");
            if (res.ok) {
                setItems(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Remove from wishlist?")) return;
        try {
            await fetch(`/api/wishlist?id=${id}`, { method: "DELETE" });
            fetchWishlist(); // Refresh
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8 pb-24">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
                            {t("wishlist.pageTitle")}
                        </h1>
                        <p className="text-slate-400">{t("wishlist.subtitle", { count: items.length })}</p>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-20 px-4 rounded-3xl bg-slate-900/30 border border-slate-800 border-dashed">
                        <Heart className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-300">{t("wishlist.emptyTitle")}</h3>
                        <p className="text-slate-500 mt-2 mb-6">{t("wishlist.emptyDesc")}</p>
                        <Link href="/explorer">
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                                {t("wishlist.exploreButton")}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => {
                            const card = item.card;
                            const image = card?.images ? JSON.parse(card.images).small : "/card-back.png";
                            const prices = card?.tcgplayerPrices;
                            const marketPrice = prices?.marketPrice || prices?.holofoil?.market || prices?.normal?.market || 0;

                            return (
                                <Card key={item.id} className="bg-slate-900/50 border-slate-800 overflow-hidden group hover:border-pink-500/50 transition-all">
                                    <div className="relative aspect-[2.5/3.5] bg-slate-950 p-4 flex justify-center">
                                        <img
                                            src={image}
                                            alt={card?.name}
                                            loading="lazy"
                                            className="h-full object-contain drop-shadow-xl transition-transform group-hover:scale-110 duration-300"
                                        />
                                        <Badge
                                            className={`absolute top-2 right-2 border-0 ${item.priority === 'high' ? 'bg-red-500' :
                                                item.priority === 'low' ? 'bg-slate-500' : 'bg-blue-500'
                                                }`}
                                        >
                                            {item.priority === 'high' ? t("wishlist.priorities.high") : item.priority === 'low' ? t("wishlist.priorities.low") : t("wishlist.priorities.normal")}
                                        </Badge>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-white truncate pr-2" title={card?.name}>{card?.name}</h3>
                                                <p className="text-xs text-slate-400">{item.set?.name} · {card?.number}/{item.set?.printedTotal}</p>
                                            </div>
                                            {marketPrice > 0 && (
                                                <div className="text-emerald-400 font-mono font-medium">
                                                    ${marketPrice.toFixed(2)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <Link href={`/explorer/set/${card?.setId}?card=${card?.id}`} className="w-full">
                                                <Button size="sm" variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    {t("wishlist.viewButton")}
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="w-full bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-200"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                {t("wishlist.deleteButton")}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
