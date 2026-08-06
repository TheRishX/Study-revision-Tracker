import DOMPurify from 'dompurify';
import 'highlight.js/styles/github-dark-dimmed.css';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { marked } from 'marked';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const POSTS_ENDPOINT = '/api/blogs';
const WORDPRESS_POSTS_ENDPOINT = 'https://public-api.wordpress.com/rest/v1.1/sites/psalmify.wordpress.com/posts/?number=12';
const ADMIN_PANEL_URL = 'https://psalmify.wordpress.com/wp-admin/';

interface WordPressPost {
  ID: number;
  URL: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  featured_image?: string;
  post_thumbnail?: { URL?: string } | null;
  categories?: Record<string, { name: string }>;
}

interface WordPressResponse {
  posts?: WordPressPost[];
}

const fetchPosts = async (endpoint: string) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Could not load posts (${response.status})`);
    return await response.json() as WordPressResponse;
  } finally {
    window.clearTimeout(timeout);
  }
};

const plainText = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
};

const renderContent = (content: string) => {
  const source = content || '';
  const containsHtml = /<\/?(?:p|div|h[1-6]|ul|ol|li|pre|code|blockquote|figure|figcaption|img|table|thead|tbody|tr|th|td|hr|br|section|article|span|strong|em|a)\b[^>]*>/i.test(source);
  const html = containsHtml
    ? source
    : marked.parse(source, { async: false, breaks: true, gfm: true }) as string;
  return DOMPurify.sanitize(html);
};

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  day: 'numeric', month: 'short', year: 'numeric',
}).format(new Date(value));

export const BlogPage: React.FC = () => {
  const articleRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<WordPressPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      let data: WordPressResponse;
      try {
        data = await fetchPosts(POSTS_ENDPOINT);
      } catch (proxyError) {
        console.warn('Blog proxy unavailable; fetching directly from WordPress:', proxyError);
        data = await fetchPosts(WORDPRESS_POSTS_ENDPOINT);
      }
      setPosts(data.posts ?? []);
    } catch (loadError) {
      console.error('Unable to load blog posts:', loadError);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const articleHtml = useMemo(
    () => selectedPost ? renderContent(selectedPost.content || selectedPost.excerpt) : '',
    [selectedPost],
  );

  useEffect(() => {
    if (!articleRef.current || !articleHtml) return;
    let cancelled = false;
    void Promise.all([
      import('highlight.js'),
      import('prettier/standalone'),
      import('prettier/plugins/babel'),
      import('prettier/plugins/estree'),
      import('prettier/plugins/typescript'),
      import('prettier/plugins/html'),
      import('prettier/plugins/postcss'),
    ]).then(async ([{ default: hljs }, prettier, { default: babel }, { default: estree }, { default: typescript }, { default: html }, { default: postcss }]) => {
      if (cancelled || !articleRef.current) return;
      for (const code of articleRef.current.querySelectorAll<HTMLElement>('pre code')) {
        const source = code.textContent ?? '';
        const declaredLanguage = [...code.classList]
          .find(className => className.startsWith('language-'))
          ?.slice('language-'.length)
          .toLowerCase();
        const looksLikeJavaScript = /\b(?:const|let|var|function|import|export)\b|=>|console\.|register\s*\(/.test(source);
        const language = declaredLanguage || (looksLikeJavaScript ? 'javascript' : hljs.highlightAuto(source).language || '');
        const parser = ['javascript', 'js', 'jsx'].includes(language) ? 'babel'
          : ['typescript', 'ts', 'tsx'].includes(language) ? 'typescript'
            : language === 'json' ? 'json'
              : ['html', 'xml', 'svg'].includes(language) ? 'html'
                : ['css', 'scss', 'less'].includes(language) ? language
                  : null;

        let formattedSource = source;
        if (parser) {
          try {
            formattedSource = (await prettier.format(source, {
              parser,
              plugins: [babel, estree, typescript, html, postcss],
              printWidth: 88,
              tabWidth: 2,
              useTabs: false,
            })).trimEnd();
          } catch {
            formattedSource = source;
          }
        }
        const result = language && hljs.getLanguage(language)
          ? hljs.highlight(formattedSource, { language })
          : hljs.highlightAuto(formattedSource);
        code.innerHTML = result.value;
        code.classList.add('hljs');
      }
    });
    return () => { cancelled = true; };
  }, [articleHtml]);

  const openPost = (post: WordPressPost) => {
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArticleClick = (event: React.MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest('a');
    if (!link) return;
    event.preventDefault();
    window.open(link.href, '_blank', 'noopener,noreferrer');
  };

  if (selectedPost) {
    const image = selectedPost.featured_image || selectedPost.post_thumbnail?.URL;
    const category = (Object.values(selectedPost.categories ?? {}) as Array<{ name: string }>)[0]?.name;

    return (
      <article className="blog-reader pb-16">
        <button type="button" className="blog-back-button" onClick={() => setSelectedPost(null)}>
          <ArrowLeft className="h-4 w-4" /> Back to blogs
        </button>

        <header className="blog-reader-header">
          <p className="eyebrow">Rewise blog</p>
          <h1 className="blog-reader-title">{plainText(selectedPost.title)}</h1>
          <div className="blog-reader-meta">
            {category && <span>{category}</span>}
            {category && <span aria-hidden="true">•</span>}
            <time dateTime={selectedPost.date}>{formatDate(selectedPost.date)}</time>
          </div>
        </header>

        {image && <img src={image} alt="" className="blog-reader-hero" />}
        <div
          ref={articleRef}
          className="blog-article-body"
          onClick={handleArticleClick}
          dangerouslySetInnerHTML={{ __html: articleHtml }}
        />
      </article>
    );
  }

  return (
    <section className="blog-page pb-16">
      <div className="mb-8 sm:mb-10">
        <p className="eyebrow">Rewise journal</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="blog-title">Latest blogs</h1>
            <p className="blog-subtitle mt-2">Ideas, guides, and reflections for better learning.</p>
          </div>
          <a className="subtle-button" href={ADMIN_PANEL_URL} target="_blank" rel="noreferrer">
            Admin panel <ExternalLink className="h-3.5 w-3.5" />
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
              <button type="button" key={post.ID} className="blog-card text-left" onClick={() => openPost(post)}>
                {image && <img src={image} alt="" className="blog-card-image" loading="lazy" />}
                <span className="flex flex-1 flex-col p-5">
                  <span className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#71805f]">
                    {category && <span>{category}</span>}
                    {category && <span aria-hidden="true">•</span>}
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </span>
                  <span className="blog-card-title">{plainText(post.title)}</span>
                  <span className="blog-card-excerpt mt-3">{plainText(post.excerpt)}</span>
                  <span className="blog-read-link mt-5">Read article</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
