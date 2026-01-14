
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TextProxyCardProps {
    card: {
        name: string;
        hp?: string;
        types?: string[];
        attacks?: Array<{
            name: string;
            cost?: string[];
            damage?: string;
            text?: string;
        }>;
        abilities?: Array<{
            type: string;
            name: string;
            text: string;
        }>;
        weaknesses?: Array<{ type: string; value: string }>;
        retreatCost?: string[];
        number: string;
        setName?: string;
        rarity?: string;
    };
    className?: string;
}

import { useI18n } from "@/lib/i18n";

export function TextProxyCard({ card, className }: TextProxyCardProps) {
    const { t } = useI18n();
    const parseList = (val: any) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
            try {
                // Handle cases where it might be a simple comma string or a JSON string
                if (val.startsWith("[")) return JSON.parse(val);
                return [val];
            } catch { return []; }
        }
        return [];
    };

    const types = parseList(card.types);
    const attacks = parseList(card.attacks);
    const abilities = parseList(card.abilities);
    const weaknesses = parseList(card.weaknesses);
    const escapeCost = parseList(card.retreatCost);

    return (
        <Card className={cn(
            "w-full h-full p-3 flex flex-col justify-between border-2 border-slate-900 bg-white text-black print:border-black",
            className
        )}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-1 mb-1">
                <div>
                    <h3 className="font-bold text-sm leading-tight">{card.name}</h3>
                    <div className="text-[10px] text-slate-500 font-mono">
                        {card.setName} #{card.number}
                    </div>
                </div>
                <div className="text-right">
                    {card.hp && <span className="font-bold text-red-600 block text-xs">HP {card.hp}</span>}
                    {types.length > 0 && (
                        <div className="flex gap-0.5 justify-end">
                            {types.map((t: string, i: number) => (
                                <span key={i} className="text-[10px] font-bold uppercase">{t.substring(0, 3)}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col gap-2 overflow-hidden text-[10px]">
                {/* Abilities */}
                {abilities.map((ability: any, i: number) => (
                    <div key={i} className="bg-slate-50 p-1 rounded border border-slate-100">
                        <span className="font-bold text-red-700 block text-[9px] uppercase">{ability.type}</span>
                        <span className="font-bold mr-1">{ability.name}:</span>
                        <span className="leading-tight">{ability.effect || ability.text}</span>
                    </div>
                ))}

                {/* Attacks */}
                {attacks.map((attack: any, i: number) => (
                    <div key={i} className="border-b border-slate-100 last:border-0 pb-1">
                        <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-bold flex items-center gap-1">
                                {attack.cost && (
                                    <span className="text-[9px] text-slate-500 font-mono">
                                        [{parseList(attack.cost).map((c: string) => c.substring(0, 1)).join("")}]
                                    </span>
                                )}
                                {attack.name}
                            </span>
                            <span className="font-bold text-md">{attack.damage}</span>
                        </div>
                        {(attack.effect || attack.text) && (
                            <p className="leading-tight opacity-80">{attack.effect || attack.text}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-1 mt-1 grid grid-cols-3 gap-1 text-[9px] text-center">
                <div>
                    <span className="block text-slate-400 text-[8px] uppercase">{t("proxies.textCard.weak")}</span>
                    {weaknesses.length > 0 ? (
                        weaknesses.map((w: any, i: number) => (
                            <span key={i} className="font-bold">{w.type.substring(0, 3)} {w.value}</span>
                        ))
                    ) : "-"}
                </div>
                <div>
                    <span className="block text-slate-400 text-[8px] uppercase">{t("proxies.textCard.retreat")}</span>
                    {escapeCost.length > 0 ? (
                        <span className="font-bold">{escapeCost.length}</span>
                    ) : "-"}
                </div>
                <div>
                    <span className="block text-slate-400 text-[8px] uppercase">{t("proxies.textCard.rarity")}</span>
                    <span className="font-bold truncate">{card.rarity || "-"}</span>
                </div>
            </div>
        </Card>
    );
}
