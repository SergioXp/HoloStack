"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface BackgroundCard {
    id: string;
    name: string;
    images: string; // JSON string
}

export function FloatingCardsBackground({ cards }: { cards: BackgroundCard[] }) {
    // Si no hay suficientes cartas, no renderizamos nada para evitar errores visuales
    if (!cards || cards.length < 4) return null;

    // Dividimos las cartas en 4 columnas
    const columns = [
        cards.slice(0, Math.floor(cards.length / 4)),
        cards.slice(Math.floor(cards.length / 4), Math.floor(cards.length / 2)),
        cards.slice(Math.floor(cards.length / 2), Math.floor(3 * cards.length / 4)),
        cards.slice(Math.floor(3 * cards.length / 4))
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none bg-slate-950">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full h-[150vh] -mt-20 opacity-40">
                {columns.map((columnCards, colIndex) => (
                    <div
                        key={colIndex}
                        className={cn(
                            "flex flex-col gap-6",
                        )}
                        style={{
                            // Animación de desplazamiento infinito hacia arriba
                            animation: `marquee-up ${30 + colIndex * 10}s linear infinite`,
                            // Desplaza el inicio para que no empiecen todas igual
                            marginTop: `-${colIndex * 100}px`
                        }}
                    >
                        {/* Renderizamos duplicado para el loop infinito suave */}
                        {[...columnCards, ...columnCards, ...columnCards].map((card, i) => {
                            let imageUrl = "";
                            try {
                                const parse = JSON.parse(card.images);
                                imageUrl = parse.large || parse.small;
                            } catch (e) { return null; }

                            if (!imageUrl) return null;

                            return (
                                <div
                                    key={`${card.id}-${i}`}
                                    className="relative w-full aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl skew-y-6 grayscale-50 hover:grayscale-0 transition-all duration-700"
                                    style={{
                                        // Rotación aleatoria ligera
                                        transform: `rotate(${Math.sin(i) * 5}deg)`
                                    }}
                                >
                                    <Image
                                        src={imageUrl}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        sizes="300px"
                                        unoptimized // Para evitar sobrecarga en vercel/next image optimization con muchas imgs de fondo
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes marquee-up {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
            `}</style>
        </div>
    );
}
