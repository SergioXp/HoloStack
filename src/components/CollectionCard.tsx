"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface CollectionCardProps {
    card: any;
    ownedQuantity: number;
    totalInSet: number;
}

export default function CollectionCard({ card, ownedQuantity, totalInSet }: CollectionCardProps) {
    const { t } = useI18n();
    const isOwned = ownedQuantity > 0;
    const cardImages = card.images ? JSON.parse(card.images) : null;

    return (
        <Card className={cn(
            "border-slate-800 overflow-hidden transition-all duration-300",
            !isOwned ? "bg-slate-900/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100" : "bg-slate-800 hover:scale-105"
        )}>
            <CardContent className="p-2 relative">
                {/* Badge de Cantidad */}
                {isOwned && (
                    <div className="absolute top-2 right-2 z-10 font-bold bg-green-500 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg shadow-green-500/20">
                        {ownedQuantity}
                    </div>
                )}

                {/* Imagen */}
                <div className="relative aspect-[2.5/3.5] rounded-md overflow-hidden mb-2">
                    {cardImages?.small ? (
                        <Image
                            src={cardImages.small}
                            alt={card.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, 20vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <span className="text-slate-600 text-xs">{t("common.noImage")}</span>
                        </div>
                    )}
                </div>

                {/* Info mínima */}
                <div className="flex justify-between items-center text-xs">
                    <span className={cn(
                        "font-medium truncate max-w-[70%]",
                        isOwned ? "text-white" : "text-slate-500"
                    )}>
                        {card.name}
                    </span>
                    <span className="text-slate-600">
                        {card.number}/{totalInSet}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
