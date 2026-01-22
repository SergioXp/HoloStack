import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Note: This middleware runs in Edge Runtime, which cannot read files.
// For Electron/desktop mode detection, we check for localhost since
// the app runs on 127.0.0.1. For SERVER mode check, we rely on env vars
// set at build time OR the fact that desktop apps always run on localhost.

// Obtener APP_MODE - default SERVER requiere autenticación
const APP_MODE = process.env.APP_MODE || "SERVER";

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/register", "/api"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get("host") || "";

    // Ignorar rutas públicas
    for (const route of publicRoutes) {
        if (pathname.startsWith(route)) {
            return NextResponse.next();
        }
    }

    // Modo LOCAL (desde env var de build) o Electron (localhost)
    // En Electron, el servidor corre en 127.0.0.1:PORT
    const isLocalhost = host.startsWith("127.0.0.1") || host.startsWith("localhost");
    if (APP_MODE === "LOCAL" || isLocalhost) {
        return NextResponse.next();
    }

    // Modo SERVER: verificar token de sesión
    const token = request.cookies.get("authjs.session-token") ||
        request.cookies.get("__Secure-authjs.session-token");

    if (!token) {
        // Sin sesión -> redirigir a login
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// Matcher: aplicar a la raíz y rutas que NO sean estáticas
export const config = {
    matcher: [
        "/",
        "/((?!_next|static|.*\\.[\\w]+$).*)",
    ],
};
