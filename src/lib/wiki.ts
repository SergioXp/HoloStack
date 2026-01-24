import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'src/content/wiki');

export type WikiPost = {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    order: number;
};

export function getWikiPosts(): WikiPost[] {
    // Get file names under /docs/guia_pokemon_tcg
    const fileNames = fs.readdirSync(postsDirectory);

    const allPostsData = fileNames
        .filter((fileName) => fileName.endsWith('.md'))
        .map((fileName) => {
            // Remove ".md" from file name to get slug
            const slug = fileName.replace(/\.md$/, '');

            // Read markdown file as string
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');

            // Use gray-matter to parse the post metadata section
            // Although our current MD files don't have frontmatter, we'll try to extract title and order from filename/content
            const { content } = matter(fileContents);

            // Extract title from the first line (# Title)
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : slug;

            // Extract excerpt (first paragraph after title)
            const contentWithoutTitle = content.replace(/^#\s+.+$/m, '').trim();
            const excerptMatch = contentWithoutTitle.match(/^((?:.|\n)+?)(\n\n|$)/);
            const excerpt = excerptMatch ? excerptMatch[1].slice(0, 150) + '...' : '';

            // Extract order from filename (e.g. 01_Primeros_Pasos -> 1)
            const orderMatch = slug.match(/^(\d+)_/);
            const order = orderMatch ? parseInt(orderMatch[1]) : 99;

            return {
                slug,
                title,
                excerpt,
                content,
                order,
            };
        });

    // Sort posts by order
    return allPostsData.sort((a, b) => a.order - b.order);
}

export function getWikiPost(slug: string): WikiPost | null {
    try {
        const fullPath = path.join(postsDirectory, `${slug}.md`);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        const { content } = matter(fileContents);

        // Extract title
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : slug;

        // Extract excerpt
        const contentWithoutTitle = content.replace(/^#\s+.+$/m, '').trim();
        const excerptMatch = contentWithoutTitle.match(/^((?:.|\n)+?)(\n\n|$)/);
        const excerpt = excerptMatch ? excerptMatch[1].slice(0, 150) + '...' : '';

        const orderMatch = slug.match(/^(\d+)_/);
        const order = orderMatch ? parseInt(orderMatch[1]) : 99;

        return {
            slug,
            title,
            excerpt,
            content,
            order,
        };
    } catch (error) {
        return null;
    }
}
