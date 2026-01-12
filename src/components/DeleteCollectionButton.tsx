"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteCollection } from "@/app/actions/collection";
import { useI18n } from "@/lib/i18n";
// import { useToast } from "@/hooks/use-toast"; // Toast not installed yet

export default function DeleteCollectionButton({ collectionId, collectionName }: { collectionId: string, collectionName: string }) {
    const { t } = useI18n();
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    // const { toast } = useToast(); 

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteCollection(collectionId);
            if (result.success) {
                // toast({ title: "Colección eliminada" });
                router.push("/collections");
                router.refresh();
            } else {
                // toast({ title: "Error", description: result.error, variant: "destructive" });
                alert(result.error);
                setIsDeleting(false);
            }
        } catch (error) {
            console.error(error);
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                    <Trash2 className="h-5 w-5" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                        {t("deleteDialog.descriptionPre")} <span className="font-semibold text-white">&quot;{collectionName}&quot;</span>{t("deleteDialog.descriptionPost")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-300">{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                        disabled={isDeleting}
                    >
                        {isDeleting ? t("common.deleting") : t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
