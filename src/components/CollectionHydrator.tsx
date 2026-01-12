"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, CloudDownload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CollectionHydratorProps {
    collectionId: string;
    hasFilters: boolean;
    mode?: "full" | "icon";
    className?: string;
}

export default function CollectionHydrator({ collectionId, hasFilters, mode = "full", className }: CollectionHydratorProps) {
    const { t } = useI18n();
    const [isSyncing, setIsSyncing] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");
    const [totalFiles, setTotalFiles] = useState(0);
    const [processedFiles, setProcessedFiles] = useState(0);
    const router = useRouter();

    const handleSync = () => {
        console.log("HandleSync triggered");
        setIsSyncing(true);
        setShowDialog(true);
        console.log("Dialog state set to true");
        setStatusMessage(t("hydrator.connecting"));
        setProgress(0);
        setProcessedFiles(0);
        setTotalFiles(0);

        try {
            console.log("Creating EventSource...");
            const eventSource = new EventSource(`/api/sync/collection-cards?id=${collectionId}`);

            eventSource.onopen = () => {
                console.log("Conexión SSE abierta");
            };

            eventSource.onmessage = (event) => {
                console.log("SSE Message received:", event.data);
                try {
                    const data = JSON.parse(event.data);

                    if (data.status === "starting") {
                        setStatusMessage(data.message);
                    } else if (data.status === "progress") {
                        setStatusMessage(data.message);
                        setProcessedFiles(data.count);
                        setTotalFiles(data.total);

                        if (data.total > 0) {
                            const percentage = Math.round((data.count / data.total) * 100);
                            setProgress(percentage);
                        }
                    } else if (data.status === "complete") {
                        setStatusMessage("¡Completado!");
                        setProgress(100);
                        eventSource.close();
                        setTimeout(() => {
                            setIsSyncing(false);
                            setShowDialog(false);
                            router.refresh();
                        }, 1000);
                    } else if (data.status === "error") {
                        setStatusMessage(`Error: ${data.message}`);
                        eventSource.close();
                        setIsSyncing(false);
                    }
                } catch (error) {
                    console.error("Error parsing update:", error);
                }
            };

            eventSource.onerror = (error) => {
                console.error("SSE Error:", error);
                if (eventSource.readyState !== EventSource.CLOSED) {
                    setStatusMessage(t("hydrator.connectionError"));
                    eventSource.close();
                    setIsSyncing(false);
                }
            };
        } catch (error) {
            console.error("Error initiating sync:", error);
            setStatusMessage(t("hydrator.startError"));
            setIsSyncing(false);
        }
    };

    if (!hasFilters) return null;

    return (
        <>
            {mode === "full" ? (
                <div className={cn("flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-xl border border-slate-800 max-w-md mx-auto mt-8", className)}>
                    <div className="bg-blue-500/10 p-4 rounded-full mb-4">
                        <Download className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{t("hydrator.title")}</h3>
                    <p className="text-slate-400 text-center mb-6 text-sm">
                        {t("hydrator.description")}
                    </p>
                    <Button
                        onClick={handleSync}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-500 text-white w-full"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {t("hydrator.button")}
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={handleSync}
                    variant="ghost"
                    size="icon"
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                    title={t("common.syncCloudData")}
                >
                    <CloudDownload className="h-5 w-5" />
                </Button>
            )}

            <Dialog open={showDialog} onOpenChange={(open: boolean) => {
                if (!isSyncing) {
                    setShowDialog(open);
                }
            }}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("common.syncingCollection")}</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {t("hydrator.wait")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="flex justify-between items-center text-sm font-medium text-slate-200">
                            <span>{statusMessage}</span>
                            {totalFiles > 0 ? (
                                <span>{processedFiles} / {totalFiles}</span>
                            ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                            )}
                        </div>

                        {totalFiles > 0 ? (
                            <Progress value={progress} className="h-3 bg-slate-800" />
                        ) : (
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full w-1/3 bg-blue-500 animate-pulse rounded-full" />
                            </div>
                        )}

                        <p className="text-xs text-slate-500 text-center">
                            {t("hydrator.doNotClose")}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
