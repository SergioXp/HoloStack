import { getWikiPost, getWikiPosts } from '@/lib/wiki';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { Separator } from '@/components/ui/separator';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const posts = getWikiPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export default async function WikiPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = getWikiPost(slug);

    if (!post) {
        notFound();
    }

    // Find prev/next posts
    const allPosts = getWikiPosts();
    const currentIndex = allPosts.findIndex(p => p.slug === slug);
    const prevPost = currentIndex > 0 && allPosts[currentIndex - 1].slug !== '00_Indice_Guia'
        ? allPosts[currentIndex - 1]
        : undefined;
    const nextPost = currentIndex < allPosts.length - 1
        ? allPosts[currentIndex + 1]
        : undefined;

    // Custom components for markdown
    const markdownComponents = {
        h1: ({ node, ...props }: any) => <h1 className="text-4xl font-bold text-white mb-6 mt-2" {...props} />,
        h2: ({ node, ...props }: any) => <h2 className="text-2xl font-bold text-blue-200 mt-12 mb-4 pb-2 border-b border-white/10 flex items-center gap-2" {...props} />,
        h3: ({ node, ...props }: any) => <h3 className="text-xl font-semibold text-purple-200 mt-8 mb-3" {...props} />,
        p: ({ node, ...props }: any) => <p className="leading-7 text-slate-300 mb-4" {...props} />,
        ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-slate-300" {...props} />,
        ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-slate-300" {...props} />,
        li: ({ node, children, ...props }: any) => (
            <li className="" {...props}>
                {children}
            </li>
        ),
        strong: ({ node, ...props }: any) => <strong className="font-bold text-white" {...props} />,
        blockquote: ({ node, ...props }: any) => (
            <blockquote className="border-l-4 border-blue-500 bg-blue-500/10 pl-4 py-2 my-6 text-slate-200 italic rounded-r-lg" {...props} />
        ),
        a: ({ node, href, ...props }: any) => (
            <a
                href={href}
                className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/30 hover:decoration-blue-300 transition-colors"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                {...props}
            />
        ),
        code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
                <code className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded-md text-sm font-mono" {...props}>
                    {children}
                </code>
            ) : (
                <code className="block bg-slate-900 p-4 rounded-lg my-4 overflow-x-auto text-slate-200 font-mono text-sm border border-slate-800" {...props}>
                    {children}
                </code>
            )
        },
        img: ({ node, ...props }: any) => (
            <img className="mx-auto block rounded-lg shadow-lg my-8" {...props} />
        )
    };

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <div className="mb-8">
                <Link href="/wiki">
                    <Button variant="ghost" className="text-slate-400 hover:text-white pl-0 gap-2">
                        <ChevronLeft className="w-4 h-4" />
                        Volver al índice
                    </Button>
                </Link>
            </div>

            <article className="prose prose-invert prose-lg max-w-none prose-headings:scroll-mt-20">
                <ReactMarkdown components={markdownComponents}>
                    {post.content}
                </ReactMarkdown>
            </article>

            <hr className="my-12 border-white/10" />

            {/* Navigation Footer */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
                {prevPost ? (
                    <Link href={`/wiki/${prevPost.slug}`} className="flex-1">
                        <Button variant="outline" className="w-full h-auto p-4 flex justify-start gap-4 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-left group">
                            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                            <div className="overflow-hidden">
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Anterior</div>
                                <div className="font-semibold text-slate-300 group-hover:text-blue-300 truncate transition-colors">
                                    {prevPost.title.replace(/^\d+\.\s*/, '')}
                                </div>
                            </div>
                        </Button>
                    </Link>
                ) : <div className="flex-1" />}

                {nextPost ? (
                    <Link href={`/wiki/${nextPost.slug}`} className="flex-1">
                        <Button variant="outline" className="w-full h-auto p-4 flex justify-end gap-4 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-right group">
                            <div className="overflow-hidden">
                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Siguiente</div>
                                <div className="font-semibold text-slate-300 group-hover:text-blue-300 truncate transition-colors">
                                    {nextPost.title.replace(/^\d+\.\s*/, '')}
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                        </Button>
                    </Link>
                ) : <div className="flex-1" />}
            </div>
        </div>
    );
}
