import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Obtener APP_MODE - default SERVER requiere autenticación
const APP_MODE = process.env.APP_MODE || "SERVER";

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/register", "/api"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Ignorar rutas públicas
    for (const route of publicRoutes) {
        if (pathname.startsWith(route)) {
            return NextResponse.next();
        }
    }

    // Modo LOCAL: permitir todo
    if (APP_MODE === "LOCAL") {
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
