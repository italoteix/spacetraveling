import { useEffect, useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import { formatPost, formatEditDate } from '../../utils/posts';
import { useUtterances } from '../../hooks/useUtterances';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

export interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  prevPost: Post | null;
  nextPost: Post | null;
  preview: boolean;
}

export default function Post({ post, prevPost, nextPost, preview }: PostProps) {
  const { isFallback } = useRouter();
  const [formatedPost] = useState(() => formatPost(post));
  const [readTime, setReadTime] = useState(0);

  const editTime = formatEditDate(post.last_publication_date);

  const commentNodeId = 'utterances-comments';
  useUtterances(commentNodeId);

  const shouldRenderNavigation = Boolean(prevPost || nextPost);

  useEffect(() => {
    if (isFallback) return;

    const computedReadTime =
      formatedPost.data.content.reduce((acc, content) => {
        const bodyWordsCounter = content.body.reduce((bodyAcc, body) => {
          const wordsList = body.text.split(' ');
          return bodyAcc + wordsList.length;
        }, 0);

        return acc + bodyWordsCounter;
      }, 0) / 200;

    setReadTime(Math.ceil(computedReadTime));
  }, [formatedPost.data.content, isFallback]);

  if (isFallback)
    return (
      <div className={commonStyles.container}>
        <p>Carregando...</p>
      </div>
    );

  return (
    <>
      <Header />
      <section className={commonStyles.container}>
        <img
          src={formatedPost.data.banner.url}
          alt=""
          className={commonStyles['full-width']}
        />
        <h1 className={styles.title}>{formatedPost.data.title}</h1>
        <div className={styles.details}>
          <div className={commonStyles.post__details}>
            <time>
              <FiCalendar />
              {formatedPost.first_publication_date}
            </time>
            <address>
              <FiUser />
              {formatedPost.data.author}
            </address>
            <span>
              <FiClock />
              {readTime} min
            </span>
          </div>
          <small className={styles['edit-info']}>{editTime}</small>
        </div>
        {formatedPost.data.content.map(content => (
          <div className={styles.post} key={content.heading}>
            <h2 className={styles.post__title}>{content.heading}</h2>
            {content.body.map((body, index) => (
              <p key={String(index)} className={styles.post__body}>
                {body.text}
              </p>
            ))}
          </div>
        ))}
      </section>
      <footer className={`${commonStyles.container} ${styles.footer}`}>
        {shouldRenderNavigation && (
          <div className={styles['navigation-links__wrapper']}>
            {prevPost && (
              <div className={styles['navigation-links__container']}>
                <p className={styles['navigation-links__title']}>
                  {RichText.asText(prevPost.data.title)}
                </p>
                <Link href={`/post/${prevPost.uid}`}>
                  <a className={styles['navigation-link']}>Post anterior</a>
                </Link>
              </div>
            )}
            {nextPost && (
              <div
                className={`${styles['navigation-links__container']} ${styles['navigation-links__container--next']}`}
              >
                <p className={styles['navigation-links__title']}>
                  {RichText.asText(nextPost.data.title)}
                </p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a className={styles['navigation-link']}>Próximo post</a>
                </Link>
              </div>
            )}
          </div>
        )}
        <div id={commentNodeId} />
        {preview && (
          <aside className={commonStyles['button--preview']}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </footer>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { fetch: [], pageSize: 3 }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const post = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });
  const prevPost = (
    await prismic.query(Prismic.Predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${post.id}`,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.Predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${post.id}`,
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title'],
    })
  ).results[0];

  return {
    props: {
      post,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null,
      preview,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
