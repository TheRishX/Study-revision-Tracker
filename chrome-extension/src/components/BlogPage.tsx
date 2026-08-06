import { ExternalLink, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const WORDPRESS_POSTS_ENDPOINT = 'https://public-api.wordpress.com/rest/v1.1/sites/psalmify.wordpress.com/posts/?number=12';

interface WordPressPost {
  ID: number;
  URL: string;
  title: string;
  excerpt: string;
  date: string;
  featured_image?: string;
  post_thumbnail?: { URL?: string } | null;
  categories?: Record<string, { name: string }>;
}

interface WordPressResponse {
  posts?: WordPressPost[];
}

const plainText = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
};

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  day: 'numeric', month: 'short', year: 'numeric',
}).format(new Date(value));

export const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(WORDPRESS_POSTS_ENDPOINT, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Could not load posts (${response.status})`);
      const data = await response.json() as WordPressResponse;
      setPosts(data.posts ?? []);
    } catch (loadError) {
      console.error('Unable to load Psalmify posts:', loadError);
      setError(true);
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  return (
    <section className="blog-page pb-16">
      <div className="mb-8 sm:mb-10">
        <p className="eyebrow">From Psalmify</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="blog-title">Latest blogs</h1>
            <p className="blog-subtitle mt-2">Fresh posts from Psalmify to read alongside your study routine.</p>
          </div>
          <a className="subtle-button" href="https://psalmify.wordpress.com/" target="_blank" rel="noreferrer">
            Visit Psalmify <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="blog-status">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#4d5f38] border-t-transparent" />
          <p>Loading the latest posts…</p>
        </div>
      ) : error ? (
        <div className="blog-status">
          <p>We couldn’t load the blogs right now. Please check your connection and try again.</p>
          <button type="button" onClick={() => void loadPosts()} className="primary-button">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="blog-status"><p>No blog posts are available yet.</p></div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => {
            const image = post.featured_image || post.post_thumbnail?.URL;
            const category = (Object.values(post.categories ?? {}) as Array<{ name: string }>)[0]?.name;
            return (
              <article key={post.ID} className="blog-card">
                {image && <img src={image} alt="" className="blog-card-image" loading="lazy" />}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#71805f]">
                    {category && <span>{category}</span>}
                    {category && <span aria-hidden="true">•</span>}
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </div>
                  <h2 className="blog-card-title">{plainText(post.title)}</h2>
                  <p className="blog-card-excerpt mt-3">{plainText(post.excerpt)}</p>
                  <a href={post.URL} target="_blank" rel="noreferrer" className="blog-read-link mt-5">
                    Read post <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
