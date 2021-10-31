import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';
import { formatPosts } from '../utils/posts';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

export interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination: { next_page, results },
  preview,
}: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(() => formatPosts(results) || []);
  const [nextPage, setNextPage] = useState<string | null>(next_page || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadPosts = async () => {
    setIsLoading(true);
    try {
      const rawRes = await fetch(next_page);
      const res: ApiSearchResponse = await rawRes.json();

      const newPosts = formatPosts(res.results);

      setNextPage(res.next_page);
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
    } catch {
      // eslint-disable-next-line no-console
      console.error('Error while trying to load more');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={commonStyles.container}>
      <header className={styles.header}>
        <img src="/Logo.svg" alt="logo" />
      </header>
      <section className={styles.post__section}>
        {posts.map(post => (
          <article key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
                <small className={commonStyles.post__details}>
                  <time dateTime={post.first_publication_date}>
                    <FiCalendar />
                    {post.first_publication_date}
                  </time>
                  <address>
                    <FiUser />
                    {post.data.author}
                  </address>
                </small>
              </a>
            </Link>
          </article>
        ))}
      </section>

      {nextPage && (
        <button
          className={styles.button__load}
          type="button"
          onClick={handleLoadPosts}
          disabled={isLoading}
        >
          Carregar mais posts
        </button>
      )}

      {preview && (
        <aside
          className={`${commonStyles['button--preview']} ${styles['button--preview']}`}
        >
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 3,
      orderings: '[document.first_publication_date desc]',
      ref: previewData?.ref ?? null,
    }
  );

  return {
    props: {
      postsPagination: postsResponse,
      preview,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
