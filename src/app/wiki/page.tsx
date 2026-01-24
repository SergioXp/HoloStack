import Link from 'next/link';
import { getWikiPosts } from '@/lib/wiki';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function WikiPage() {
    const posts = getWikiPosts();

    // Separate index from content chapters
    const indexPost = posts.find(p => p.slug === '00_Indice_Guia');
    const chapters = posts.filter(p => p.slug !== '00_Indice_Guia');

    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            {/* Hero Section */}
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4 ring-1 ring-blue-500/30">
                    <GraduationCap className="w-10 h-10 text-blue-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Guía del Coleccionista
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Domina el arte del coleccionismo de Pokémon TCG. Desde identificar tu primera carta hasta completar sets maestros.
                </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">

                {/* Sidebar / Index */}
                <div className="space-y-6">
                    <div className="sticky top-24">
                        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BookOpen className="w-5 h-5 text-purple-400" />
                                    Índice General
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {chapters.map((post) => (
                                    <Link href={`/wiki/${post.slug}`} key={post.slug} className="block group">
                                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                                                {post.order}
                                            </div>
                                            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors line-clamp-1">
                                                {post.title.replace(/^\d+\.\s*/, '')}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-blue-500 w-2 h-8 rounded-full"></span>
                        Capítulos
                    </h2>
                    <div className="grid gap-6">
                        {chapters.map((post, index) => (
                            <Link href={`/wiki/${post.slug}`} key={post.slug} className="group">
                                <Card className="h-full border-slate-800 bg-linear-to-b from-slate-900 via-slate-900/50 to-slate-950 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group-hover:-translate-y-1">
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                Capítulo {post.order}
                                            </Badge>
                                            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors transform group-hover:translate-x-1" />
                                        </div>
                                        <CardTitle className="text-xl group-hover:text-blue-200 transition-colors">
                                            {post.title.replace(/^\d+\.\s*/, '')}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 mt-2 text-base">
                                            {post.excerpt}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
