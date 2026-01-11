
"use client";

import { useState, useEffect } from "react";
import { Tag, Plus, X, Loader2, Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface TagType {
    id: number;
    name: string;
    color: string;
}

interface TagManagerProps {
    itemId: string;
    variantName: string;
}

export function TagManager({ itemId, variantName }: TagManagerProps) {
    const { t } = useI18n();
    const [assignedTags, setAssignedTags] = useState<TagType[]>([]);
    const [allTags, setAllTags] = useState<TagType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTags();
        }
    }, [isOpen, itemId]);

    const fetchTags = async () => {
        setIsLoading(true);
        try {
            // Fetch assigned tags
            const assignedRes = await fetch(`/api/collection-items/${itemId}/tags`);
            if (assignedRes.ok) {
                setAssignedTags(await assignedRes.json());
            }

            // Fetch all available tags
            const allRes = await fetch("/api/tags");
            if (allRes.ok) {
                setAllTags(await allRes.json());
            }
        } catch (error) {
            console.error("Error loading tags:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        setIsCreating(true);
        try {
            const res = await fetch("/api/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTagName, color: "slate" }),
            });
            if (res.ok) {
                const newTag = await res.json();
                setAllTags([...allTags, newTag]);
                setNewTagName("");
                // Auto assign
                await handleToggleTag(newTag);
            }
        } catch (error) {
            console.error("Error creating tag:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleToggleTag = async (tag: TagType) => {
        const isAssigned = assignedTags.some((t) => t.id === tag.id);
        const method = isAssigned ? "DELETE" : "POST";

        // Optimistic update
        if (isAssigned) {
            setAssignedTags(assignedTags.filter((t) => t.id !== tag.id));
        } else {
            setAssignedTags([...assignedTags, tag]);
        }

        try {
            await fetch(`/api/collection-items/${itemId}/tags`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tagId: tag.id }),
            });
        } catch (error) {
            // Revert on error
            console.error("Error toggling tag:", error);
            if (isAssigned) {
                setAssignedTags([...assignedTags, tag]);
            } else {
                setAssignedTags(assignedTags.filter((t) => t.id !== tag.id));
            }
        }
    };

    const availableTags = allTags.filter(
        (t) => !assignedTags.some((at) => at.id === t.id)
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={t("tags.manage")}
                >
                    <Tag className={cn("h-3 w-3", assignedTags.length > 0 ? "text-primary fill-primary/20" : "text-slate-400")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                        <h4 className="font-medium text-sm">{t("tags.title")}</h4>
                        <span className="text-xs text-muted-foreground">{variantName}</span>
                    </div>

                    {/* Assigned Tags */}
                    <div className="flex flex-wrap gap-1.5 min-h-[20px]">
                        {assignedTags.length === 0 && (
                            <p className="text-xs text-muted-foreground w-full text-center py-1">
                                {t("tags.noTags")}
                            </p>
                        )}
                        {assignedTags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="px-1.5 py-0.5 text-xs flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive group"
                                onClick={() => handleToggleTag(tag)}
                            >
                                {tag.name}
                                <X className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Badge>
                        ))}
                    </div>

                    <div className="border-t pt-2">
                        <p className="text-xs text-muted-foreground mb-2">{t("tags.assign")}</p>
                        <ScrollArea className="h-24 w-full rounded border bg-muted/20">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="p-1 space-y-1">
                                    {availableTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleToggleTag(tag)}
                                            className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            {tag.name}
                                        </button>
                                    ))}
                                    {availableTags.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                            No more tags
                                        </p>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Input
                            placeholder={t("tags.create")}
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="h-7 text-xs"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateTag();
                            }}
                        />
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-7 w-7 shrink-0"
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim() || isCreating}
                        >
                            {isCreating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Plus className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
