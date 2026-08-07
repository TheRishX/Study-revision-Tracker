import DOMPurify from 'dompurify';
import 'highlight.js/styles/github-dark-dimmed.css';
import { ArrowLeft, ArrowUpDown, ExternalLink, Grid2X2, List, RefreshCw } from 'lucide-react';
import { marked } from 'marked';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const WORDPRESS_POSTS_ENDPOINT = 'https://public-api.wordpress.com/rest/v1.1/sites/psalmify.wordpress.com/posts/?number=100';
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
  const sanitizedHtml = DOMPurify.sanitize(html);
  const document = new DOMParser().parseFromString(sanitizedHtml, 'text/html');

  // WordPress's CodeMirror editor stores every source line in a separate
  // `.cm-line` element. Reading the parent code block with textContent would
  // otherwise concatenate those lines and destroy the author's formatting.
  for (const code of document.querySelectorAll<HTMLElement>('pre code')) {
    const wordpressLines = Array.from(code.querySelectorAll<HTMLElement>('.cm-line'));
    if (wordpressLines.length > 0) {
      code.textContent = wordpressLines
        .map(line => line.textContent ?? '')
        .join('\n');
    }
  }

  return document.body.innerHTML;
};

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  day: 'numeric', month: 'short', year: 'numeric',
}).format(new Date(value));

const getPostCategories = (post: WordPressPost) => (
  Object.values(post.categories ?? {})
    .map(category => category.name.trim())
    .filter(Boolean)
);

export const BlogPage: React.FC = () => {
  const articleRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<WordPressPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
      console.error('Unable to load blog posts:', loadError);
      setError(true);
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const articleHtml = useMemo(
    () => selectedPost ? renderContent(selectedPost.content || selectedPost.excerpt) : '',
    [selectedPost],
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const category of new Set(getPostCategories(post))) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const matchingPosts = selectedCategory === 'All'
      ? posts
      : posts.filter(post => getPostCategories(post).includes(selectedCategory));
    return [...matchingPosts].sort((a, b) => {
      const difference = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === 'newest' ? difference : -difference;
    });
  }, [posts, selectedCategory, sortOrder]);

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
        const isPlainText = ['text', 'txt', 'plaintext', 'plain', 'none'].includes(declaredLanguage || '');
        const isDiagram = /[├└┌┐┘┬┴┼│─━┃→⇒]/.test(source);
        const looksLikeJson = (() => {
          try { JSON.parse(source); return /^[\s]*[\[{]/.test(source); } catch { return false; }
        })();
        const looksLikeJavaScript = /\b(?:const|let|var)\s+[A-Za-z_$]|\b(?:import|export)\s+(?:\{|\*|default|[A-Za-z_$])|\bfunction\s+\w+\s*\(|=>|console\.\w+\s*\(|register\s*\(/.test(source);
        const looksLikePython = /^\s*(?:from\s+\S+\s+import|import\s+\S+|def\s+\w+\s*\(|class\s+\w+.*:)/m.test(source);
        const looksLikeMarkup = /<\/?[a-z][^>]*>/i.test(source);
        const looksLikeCss = /[.#]?[a-z][\w-]*(?:\s+[.#]?[a-z][\w-]*)*\s*\{[\s\S]*[a-z-]+\s*:/i.test(source);
        const looksLikeSql = /\b(?:SELECT[\s\S]+\bFROM|INSERT\s+INTO|CREATE\s+TABLE|UPDATE\s+\w+\s+SET)\b/i.test(source);
        const looksLikeShell = /^\s*#!\/|^\s*(?:npm|pnpm|yarn|git|curl)\s+[-\w]/m.test(source);
        const looksLikeCompiledLanguage = /^\s*#include\b|\b(?:public|private|protected)\s+(?:static\s+)?(?:class|void|int|string)|\b(?:int|void|char|double|float)\s+\w+\s*\([^)]*\)\s*\{/m.test(source);
        const hasDeclaredCodeLanguage = Boolean(declaredLanguage && !isPlainText && hljs.getLanguage(declaredLanguage));
        const hasRecognizableCode = looksLikeJson || looksLikeJavaScript || looksLikePython || looksLikeMarkup || looksLikeCss || looksLikeSql || looksLikeShell || looksLikeCompiledLanguage;

        if (isPlainText || (!hasDeclaredCodeLanguage && (isDiagram || !hasRecognizableCode))) {
          code.textContent = source;
          code.classList.remove('hljs');
          continue;
        }

        const language = hasDeclaredCodeLanguage ? declaredLanguage!
          : looksLikeJson ? 'json'
            : looksLikeJavaScript ? 'javascript'
              : looksLikePython ? 'python'
                : looksLikeMarkup ? 'html'
                  : looksLikeCss ? 'css'
                    : looksLikeSql ? 'sql'
                      : looksLikeShell ? 'bash'
                        : hljs.highlightAuto(source).language || '';
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
    const postCategories = getPostCategories(selectedPost);

    return (
      <article className="blog-reader pb-16">
        <button type="button" className="blog-back-button" onClick={() => setSelectedPost(null)}>
          <ArrowLeft className="h-4 w-4" /> Back to blogs
        </button>

        <header className="blog-reader-header">
          <p className="eyebrow">Rewise blog</p>
          <h1 className="blog-reader-title">{plainText(selectedPost.title)}</h1>
          <div className="blog-reader-meta">
            {postCategories.length > 0 && <span>{postCategories.join(' · ')}</span>}
            {postCategories.length > 0 && <span aria-hidden="true">•</span>}
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
        <>
          <div className="blog-filter-bar">
            <div className="min-w-0 flex-1">
              <div className="blog-filter-heading">
                <span>Browse by category</span>
                <span>{filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter blogs by category">
                <button
                  type="button"
                  className={`category-filter ${selectedCategory === 'All' ? 'category-filter-active' : ''}`}
                  aria-pressed={selectedCategory === 'All'}
                  onClick={() => setSelectedCategory('All')}
                >
                  All <span>{posts.length}</span>
                </button>
                {categories.map(category => (
                  <button
                    type="button"
                    key={category.name}
                    className={`category-filter ${selectedCategory === category.name ? 'category-filter-active' : ''}`}
                    aria-pressed={selectedCategory === category.name}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {category.name} <span>{category.count}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="blog-filter-actions">
              <label className="blog-sort-control">
                <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                <span>Sort</span>
                <select value={sortOrder} onChange={event => setSortOrder(event.target.value as 'newest' | 'oldest')}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
              <div className="blog-view-toggle" role="group" aria-label="Blog view">
                <button type="button" className={viewMode === 'grid' ? 'blog-view-active' : ''} aria-label="Grid view" aria-pressed={viewMode === 'grid'} title="Grid view" onClick={() => setViewMode('grid')}>
                  <Grid2X2 className="h-4 w-4" />
                </button>
                <button type="button" className={viewMode === 'list' ? 'blog-view-active' : ''} aria-label="List view" aria-pressed={viewMode === 'list'} title="List view" onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className={viewMode === 'grid' ? 'blog-post-grid' : 'blog-post-list'}>
          {filteredPosts.map(post => {
            const image = post.featured_image || post.post_thumbnail?.URL;
            const postCategories = getPostCategories(post);
            return (
              <button type="button" key={post.ID} className="blog-card text-left" onClick={() => openPost(post)}>
                {image && <img src={image} alt="" className="blog-card-image" loading="lazy" />}
                <span className="flex flex-1 flex-col p-5">
                  <span className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#71805f]">
                    {postCategories.length > 0 && <span>{postCategories.join(' · ')}</span>}
                    {postCategories.length > 0 && <span aria-hidden="true">•</span>}
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
        </>
      )}
    </section>
  );
};
