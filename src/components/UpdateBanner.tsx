"use client";

import { useState, useEffect } from "react";
import { Download, X, Info, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface UpdateInfo {
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
    lastUpdated: string | null;
    dockerImage: string;
    releaseUrl?: string;
}

export function UpdateBanner() {
    const { t } = useI18n();
    const [update, setUpdate] = useState<UpdateInfo | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        fetch("/api/system/update-check")
            .then(res => res.json())
            .then(data => {
                if (data.hasUpdate) {
                    setUpdate(data);
                }
            })
            .catch(() => {
                // Silently fail update check
            });
    }, []);

    if (!update || !update.hasUpdate || dismissed) return null;

    return (
        <>
            <div className="bg-blue-600/90 backdrop-blur-md text-white border-b border-blue-500 py-2.5 px-4 flex items-center justify-between animate-in fade-in slide-in-from-top duration-500 relative z-[60]">
                <div className="flex items-center gap-2 text-sm">
                    <div className="bg-white/20 p-1 rounded-full">
                        <RefreshCw className="h-3 w-3 text-white animate-spin-slow" />
                    </div>
                    <span className="font-medium drop-shadow-sm">
                        {t('system.updateAvailable')}:
                        <span className="ml-1 font-bold bg-white/20 px-1.5 py-0.5 rounded text-white translate-y-[1px] inline-block">
                            v{update.latestVersion.replace(/^v/, '')}
                        </span>
                    </span>
                    <span className="hidden md:inline text-blue-100 opacity-80 text-xs ml-2">
                        ({t('system.current')}: v{update.currentVersion.replace(/^v/, '')})
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-bold text-white hover:bg-white/20 hover:text-white"
                        onClick={() => setShowModal(true)}
                    >
                        <Download className="h-3 w-3 mr-1" />
                        {t('system.howToUpdate')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-200 hover:text-white hover:bg-white/20"
                        onClick={() => setDismissed(true)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-primary" />
                            {t('system.updateTitle')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('system.updateDesc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                            <p className="text-sm font-semibold">{t('system.updateSteps')}</p>
                            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                                <li>{t('system.step1')}</li>
                                <li>{t('system.step2')}</li>
                                <div className="bg-black/20 p-2 rounded font-mono text-xs select-all">
                                    docker compose pull
                                </div>
                                <li>{t('system.step3')}</li>
                                <div className="bg-black/20 p-2 rounded font-mono text-xs select-all">
                                    docker compose up -d
                                </div>
                            </ol>
                        </div>

                        <div className="flex items-start gap-3 text-xs text-muted-foreground bg-primary/5 p-3 rounded-border border border-primary/10">
                            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p>
                                {t('system.updateNote')}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between flex items-center gap-2">
                        <div className="flex gap-2 w-full sm:w-auto">
                            {update.releaseUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.open(update.releaseUrl, '_blank')}
                                    className="text-xs flex-1 sm:flex-none"
                                >
                                    <Download className="h-3 w-3 mr-2" />
                                    {t('system.download')}
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => window.open(`https://hub.docker.com/r/${update.dockerImage}`, '_blank')}
                                className="text-xs flex-1 sm:flex-none"
                            >
                                <ExternalLink className="h-3 w-3 mr-2" />
                                Docker Hub
                            </Button>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="hidden sm:inline-flex"
                        >
                            {t('common.close')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </>
    );
}
