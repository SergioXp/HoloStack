
"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Library, FolderOpen, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Collection {
    id: string;
    name: string;
    type: string;
    itemCount?: number;
}

interface CollectionSelectorModalProps {
    onSelect: (collectionId: string) => void;
    isLoading?: boolean;
}

export function CollectionSelectorModal({ onSelect, isLoading }: CollectionSelectorModalProps) {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && collections.length === 0) {
            setLoading(true);
            fetch("/api/collections")
                .then(res => res.json())
                .then(data => setCollections(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const handleSelect = (id: string) => {
        onSelect(id);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white hover:bg-slate-800">
                    <Library className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("collectionSelector.button")}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("collectionSelector.title")}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[300px] pr-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {collections.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">
                                    No collections found
                                </div>
                            ) : (
                                collections.map(col => (
                                    <button
                                        key={col.id}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 hover:border-slate-700 transition-all group"
                                        onClick={() => handleSelect(col.id)}
                                        disabled={isLoading}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-purple-500/50 transition-colors">
                                                <FolderOpen className="h-5 w-5 text-slate-500 group-hover:text-purple-400" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-sm group-hover:text-purple-300 transition-colors">{col.name}</div>
                                                <div className="text-xs text-slate-500 capitalize">{col.type}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
