"use client";

import Image from "next/image";
import Link from "next/link";
import PriceChart from "@/components/PriceChart";
import { useI18n } from "@/lib/i18n";
import { useSearchParams } from "next/navigation";

interface CardDetailClientProps {
    card: {
        id: string;
        name: string;
        number: string;
        supertype: string;
        subtypes: string | null;
        types: string | null;
        hp: string | null;
        rarity: string | null;
        artist: string | null;
        images: string | null;
    };
    set: {
        name: string;
        printedTotal: number;
    } | null;
    currentPrice: {
        variant: string;
        price: number;
    } | null;
    priceHistoryData: {
        date: string;
        marketPrice: number;
        source: string;
    }[];
}

// ... inside component ...
export default function CardDetailClientPage({ card, set, currentPrice, priceHistoryData }: CardDetailClientProps) {
    const { t } = useI18n();
    const searchParams = useSearchParams();
    const fromPath = searchParams.get("from");
    const backLink = fromPath || "/explorer";
    const backText = fromPath?.includes("/collections") ? t("collectionDetail.backToCollections") : t("explorer.set.backToExplorer");

    // Parsear datos JSON de la carta
    const cardImages = card.images ? JSON.parse(card.images) : null;
    const cardTypes = card.types ? JSON.parse(card.types) : [];
    const cardSubtypes = card.subtypes ? JSON.parse(card.subtypes) : [];

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Navegación */}
                <Link href={backLink} className="text-slate-400 hover:text-white mb-6 inline-block">
                    ← {backText}
                </Link>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Columna izquierda: Imagen */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-sm aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl">
                            {cardImages?.large ? (
                                <Image
                                    src={cardImages.large}
                                    alt={card.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <span className="text-slate-600">{t("cardItem.noImage")}</span>
                                </div>
                            )}
                        </div>

                        {/* Set info */}
                        {set && (
                            <div className="mt-4 flex items-center gap-3 text-slate-400">
                                <span>{set.name}</span>
                                <span className="text-slate-600">•</span>
                                <span>#{card.number}/{set.printedTotal}</span>
                            </div>
                        )}
                    </div>

                    {/* Columna derecha: Información */}
                    <div className="space-y-6">
                        {/* Título y tipo */}
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{card.name}</h1>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 rounded-full bg-slate-800 text-sm text-slate-300">
                                    {card.supertype}
                                </span>
                                {cardSubtypes.map((subtype: string) => (
                                    <span key={subtype} className="px-3 py-1 rounded-full bg-slate-800 text-sm text-slate-400">
                                        {subtype}
                                    </span>
                                ))}
                                {cardTypes.map((type: string) => (
                                    <span key={type} className="px-3 py-1 rounded-full bg-blue-900/50 text-sm text-blue-300">
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* HP */}
                        {card.hp && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">HP:</span>
                                <span className="text-2xl font-bold text-white">{card.hp}</span>
                            </div>
                        )}

                        {/* Precio actual */}
                        {currentPrice && (
                            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                                <div className="text-sm text-slate-500 mb-1">{t("cardDetail.marketPrice")}</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-green-400">
                                        ${currentPrice.price.toFixed(2)}
                                    </span>
                                    <span className="text-slate-500 text-sm capitalize">
                                        ({currentPrice.variant})
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Historial de precios */}
                        <div>
                            <h2 className="text-lg font-semibold text-white mb-3">{t("cardDetail.priceHistory")}</h2>
                            <PriceChart data={priceHistoryData} />
                        </div>

                        {/* Rareza y artista */}
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 pt-4 border-t border-slate-800">
                            {card.rarity && <span>{t("cardDetail.rarity")}: <strong className="text-slate-300">{card.rarity}</strong></span>}
                            {card.artist && <span>{t("cardDetail.artist")}: <strong className="text-slate-300">{card.artist}</strong></span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
