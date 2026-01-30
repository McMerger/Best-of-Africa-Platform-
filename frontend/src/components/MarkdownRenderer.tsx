import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
    const htmlContent = useMemo(() => {
        if (!content) return '';

        let processed = content
            // 1. Sanitize to prevent basic failures (though we trust backend)
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')

            // 2. Headers with IDs
            .replace(/^### (.*$)/gm, (_, text) => {
                const id = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return `<h3 id="${id}" class="text-xl font-bold mt-6 mb-3 text-foreground scroll-mt-24">${text}</h3>`;
            })
            .replace(/^## (.*$)/gm, (_, text) => {
                const id = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return `<h2 id="${id}" class="text-2xl font-bold mt-8 mb-4 text-primary scroll-mt-24">${text}</h2>`;
            })
            .replace(/^# (.*$)/gm, (_, text) => {
                const id = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return `<h1 id="${id}" class="text-3xl font-bold mt-10 mb-6 text-foreground scroll-mt-24">${text}</h1>`;
            })

            // 3. Horizontal Rules
            .replace(/^---$/gm, '<hr class="my-8 border-border"/>')

            // 4. Bold (Double Asterisk)
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')

            // 5. Italic (Single Asterisk)
            .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')

            // 6. Lists (Unordered)
            .replace(/^\s*-\s+(.*$)/gm, '<li class="ml-4 list-disc pl-1 mb-1">$1</li>')

            // 7. Blockquotes
            .replace(/^>\s+(.*$)/gm, '<blockquote class="border-l-4 border-primary/50 pl-4 py-1 my-4 italic text-muted-foreground bg-muted/20">$1</blockquote>')

            // 8. Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>');

        // 9. Wrap Lists in <ul> (Naive approach: adjacent <li>s need wrapping, or just let them float as items in styling)
        // A better approach for lists without full parser:
        // We will just let them be <li>s and the container will handle them if we can, or we replace paragraphs around them.
        // Actually, valid HTML requires <ul>. Let's try a regex for grouping.
        // For simplicity in this "fix", we might leave them as styled divs if <ul> wrapping is too complex for regex.
        // Let's settle for simple paragraph handling first.

        // 10. Paragraphs: Double newline to <p>
        processed = processed.split(/\n\n+/).map(block => {
            if (block.trim().startsWith('<h') || block.trim().startsWith('<li') || block.trim().startsWith('<blockquote') || block.trim().startsWith('<hr')) {
                return block;
            }
            return `<p class="mb-4 leading-relaxed text-foreground/90">${block.replace(/\n/g, '<br/>')}</p>`;
        }).join('\n');

        // Wrap adjacent <li>s in <ul> (Regex pass to find sequences of <li>...</li> and wrap them)
        // This is tricky with simple strings. We will rely on the "ArticleDetailPage" container styling 
        // usually prose handles this, but since we are replacing prose with custom HTML...
        // Let's do a basic wrap.
        processed = processed.replace(/(<li.*?>.*?<\/li>\s*)+/g, '<ul class="my-4 space-y-2 list-none">$1</ul>');

        return processed;
    }, [content]);

    return (
        <div
            className={cn("markdown-content", className)}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};
