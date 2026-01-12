"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function SetNotFound() {
    const { t } = useI18n();
    return (
        <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 p-8 flex items-center justify-center">
            <div className="text-center">
                <p className="text-slate-400 mb-4">{t("explorer.set.notFound")}</p>
                <Link href="/explorer" className="text-blue-400 hover:text-blue-300">
                    {t("explorer.set.backToExplorer")}
                </Link>
            </div>
        </div>
    );
}
