

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconColor?: string; // e.g. "from-purple-500 to-pink-500"
    actions?: React.ReactNode;
    stats?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    iconColor = "from-purple-500 to-pink-500",
    actions,
    stats,
    className
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12", className)}>
            <div>
                <div className="flex items-center gap-4 mb-2 md:mb-4">
                    {Icon && (
                        <div className={cn(
                            "w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-linear-to-br flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0",
                            iconColor
                        )}>
                            <Icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{title}</h1>
                        {description && (
                            <p className="text-slate-400 text-base md:text-lg">{description}</p>
                        )}
                    </div>
                </div>
                {stats && <div className="mt-4 md:mt-6">{stats}</div>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}
