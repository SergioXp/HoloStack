import { NextResponse } from "next/server";
import { APP_VERSION, DOCKER_IMAGE } from "@/lib/constants/version";
import { hasNewerVersion, sortVersionTags } from "@/lib/version-utils";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Consultamos la API pública de Docker Hub para el repositorio
        const response = await fetch(`https://hub.docker.com/v2/repositories/${DOCKER_IMAGE}/tags?page_size=10&ordering=last_updated`, {
            next: { revalidate: 3600 } // Cachear 1 hora
        });

        if (!response.ok) {
            return NextResponse.json({ error: "No se pudo consultar Docker Hub" }, { status: 500 });
        }

        const data = await response.json();
        const tags = data.results || [];

        // Ordenar tags semánticos de mayor a menor
        const tagNames = tags.map((t: { name: string }) => t.name);
        const versionTags = sortVersionTags(tagNames);

        const latestVersion = versionTags[0] || "unknown";

        // También podemos ver cuándo se actualizó 'latest'
        const latestTag = tags.find((t: { name: string }) => t.name === 'latest');
        const lastUpdated = latestTag ? latestTag.last_updated : null;

        // Comparar versiones usando la utilidad testeada
        const hasUpdate = latestVersion !== "unknown" && hasNewerVersion(APP_VERSION, latestVersion);

        return NextResponse.json({
            currentVersion: APP_VERSION,
            latestVersion: latestVersion === "unknown" ? (latestTag ? "latest" : "unknown") : latestVersion,
            hasUpdate,
            lastUpdated,
            dockerImage: DOCKER_IMAGE
        });
    } catch (error) {
        console.error("Update check error:", error);
        return NextResponse.json({ error: "Error al comprobar actualizaciones" }, { status: 500 });
    }
}
