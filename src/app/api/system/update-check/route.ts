import { NextResponse } from "next/server";
import { APP_VERSION, DOCKER_IMAGE, GITHUB_REPO } from "@/lib/constants/version";
import { hasNewerVersion } from "@/lib/version-utils";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Consultamos la API de GitHub Releases
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
            next: { revalidate: 3600 }, // Cachear 1 hora
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                // Opcional: User-Agent es requerido por GitHub API
                'User-Agent': 'HoloStack-App'
            }
        });

        if (!response.ok) {
            // Si falla GitHub (ej: rate limit), intentamos un fallback silencioso o error controlado
            return NextResponse.json({ error: "No se pudo consultar GitHub Releases" }, { status: response.status === 403 ? 200 : 500 });
        }

        const data = await response.json();
        const latestVersion = data.tag_name?.replace('v', '') || data.name?.replace('v', '') || "unknown";

        // Comparar versiones
        const hasUpdate = latestVersion !== "unknown" && hasNewerVersion(APP_VERSION, latestVersion);

        return NextResponse.json({
            currentVersion: APP_VERSION,
            latestVersion: latestVersion,
            hasUpdate,
            lastUpdated: data.published_at,
            dockerImage: DOCKER_IMAGE,
            releaseUrl: data.html_url
        });
    } catch (error) {
        console.error("Update check error:", error);
        return NextResponse.json({ error: "Error al comprobar actualizaciones" }, { status: 500 });
    }
}
