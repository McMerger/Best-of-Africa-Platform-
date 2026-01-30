import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    type?: string;
    publishedTime?: string;
    author?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    type = 'article',
    publishedTime,
    author = 'Best of Africa'
}) => {
    useEffect(() => {
        // Update Title
        document.title = `${title} | Best of Africa`;

        // Helper to update meta tags
        const updateMeta = (name: string, content: string, attribute = 'name') => {
            if (!content) return;
            let element = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Standard Meta
        updateMeta('description', description || '');
        updateMeta('theme-color', '#1a1a1a'); // Dark theme color

        // Open Graph / Facebook
        updateMeta('og:type', type, 'property');
        updateMeta('og:title', title, 'property');
        updateMeta('og:description', description || '', 'property');
        updateMeta('og:image', image || '', 'property');
        updateMeta('og:site_name', 'Best of Africa', 'property');

        // Twitter
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:title', title);
        updateMeta('twitter:description', description || '');
        updateMeta('twitter:image', image || '');

        // Article Specific
        if (publishedTime) {
            updateMeta('article:published_time', publishedTime, 'property');
        }
        updateMeta('author', author);

    }, [title, description, image, type, publishedTime, author]);

    return null;
};
