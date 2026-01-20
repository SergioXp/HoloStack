"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { changelogData } from "@/lib/changelog-data";
import { Calendar, Sparkles } from "lucide-react";

interface ChangelogModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangelogModal({ open, onOpenChange }: ChangelogModalProps) {
    const { t } = useI18n();

    // Helper to try getting feature list, fallback to empty array if not found or not array
    const getFeatures = (version: string): string[] => {
        try {
            const safeVersion = version.replace(/\./g, '_');
            const features = t(`changelog.v${safeVersion}.features` as any);
            return Array.isArray(features) ? features : [];
        } catch (e) {
            return [];
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-slate-950/95 backdrop-blur-xl border-slate-800 text-white shadow-2xl">
                <DialogHeader className="pb-4 border-b border-slate-800/50">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-yellow-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold">{t('changelog.title')}</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400">
                        {t('changelog.description')}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[60vh] -mr-4 pr-4">
                    <div className="space-y-8 py-4 pl-2">
                        {changelogData.map((release, index) => (
                            <div key={release.version} className="relative pl-8 border-l border-slate-800 last:border-0 pb-1">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-950" />

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-white">v{release.version}</span>
                                            {index === 0 && (
                                                <Badge className="bg-blue-600 hover:bg-blue-500 text-[10px] px-2 h-5">NEW</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center text-xs text-slate-500 gap-1.5 font-mono">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(release.date).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-blue-200 mb-2">
                                            {t(`changelog.v${release.version.replace(/\./g, '_')}.title` as any)}
                                        </h3>
                                        <ul className="space-y-2">
                                            {getFeatures(release.version).map((feature, i) => (
                                                <li key={i} className="text-sm text-slate-400 flex items-start gap-2 leading-relaxed">
                                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-slate-600 shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
