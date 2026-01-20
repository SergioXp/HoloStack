"use client";

import { useEffect } from "react";

export function ElectronDetector() {
    useEffect(() => {
        // Check if running in Electron (exposed via preload.ts)
        if ((window as any).electron) {
            document.body.classList.add("is-electron");
        }
    }, []);

    return null;
}
