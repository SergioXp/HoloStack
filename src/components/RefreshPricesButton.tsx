"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

interface RefreshPricesButtonProps {
    cardIds: string[];
}

export default function RefreshPricesButton({ cardIds }: RefreshPricesButtonProps) {
    const { t } = useI18n();
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const refreshPrices = async () => {
        if (cardIds.length === 0) {
            setMessage(t("collectionDetail.refreshPrices.noCards"));
            return;
        }

        setIsRefreshing(true);
        setStatus("loading");
        setProgress(0);
        setMessage(t("collectionDetail.refreshPrices.updating", { count: cardIds.length }));

        try {
            // Process in batches of 50
            const batchSize = 50;
            let refreshedTotal = 0;
            let errorsTotal = 0;

            for (let i = 0; i < cardIds.length; i += batchSize) {
                const batch = cardIds.slice(i, i + batchSize);

                const response = await fetch("/api/prices/refresh", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cardIds: batch }),
                });

                if (response.ok) {
                    const data = await response.json();
                    refreshedTotal += data.refreshed || 0;
                    errorsTotal += (data.results?.filter((r: any) => r.error)?.length || 0);
                }

                const progressPct = Math.round(((i + batch.length) / cardIds.length) * 100);
                setProgress(progressPct);
                setMessage(t("collectionDetail.refreshPrices.processing", { current: i + batch.length, total: cardIds.length }));
            }

            setStatus("success");
            const suffix = errorsTotal > 0 ? t("collectionDetail.refreshPrices.errorsSuffix", { errors: errorsTotal }) : "";
            setMessage(t("collectionDetail.refreshPrices.success", { refreshed: refreshedTotal }) + suffix);

            // Refresh the page to show new prices
            setTimeout(() => {
                router.refresh();
            }, 1500);

        } catch (error) {
            console.error("Error refreshing prices:", error);
            setStatus("error");
            setMessage(t("collectionDetail.refreshPrices.error"));
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={refreshPrices}
                disabled={isRefreshing}
                className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
            >
                {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : status === "success" ? (
                    <Check className="h-4 w-4 mr-2 text-emerald-400" />
                ) : status === "error" ? (
                    <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
                ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isRefreshing ? `${progress}%` : t("collectionDetail.refreshPrices.button")}
            </Button>

            {message && (
                <span className={`text-xs ${status === "success" ? "text-emerald-400" :
                    status === "error" ? "text-red-400" :
                        "text-slate-400"
                    }`}>
                    {message}
                </span>
            )}
        </div>
    );
}
