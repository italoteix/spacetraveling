import { useEffect, useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import { formatPost } from '../../utils/posts';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

export interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();
  const [formatedPost] = useState(() => formatPost(post));
  const [readTime, setReadTime] = useState(0);

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
        <div className={`${commonStyles.post__details} ${styles.details}`}>
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
        {formatedPost.data.content.map(content => (
          <div className={styles.post} key={content.heading}>
            <h2 className={styles.post__title}>{content.heading}</h2>
            {content.body.map(body => (
              <p key={body.text.slice(0, 9)} className={styles.post__body}>
                {body.text}
              </p>
            ))}
          </div>
        ))}
      </section>
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
