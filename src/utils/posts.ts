import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';

import { Post as HomePost } from '../pages';
import { Post as SlugPost } from '../pages/post/[slug]';

// export interface Post {
//   uid?: string;
//   first_publication_date: string | null;
//   data: {
//     title: string;
//     subtitle: string;
//     author: string;
//     banner: {
//       url: string;
//     };
//     content: {
//       heading: string;
//       body: {
//         text: string;
//       }[];
//     }[];
//   };
// }

export const formatPosts = (posts: HomePost[]) => {
  const formatedPosts = posts.map(post => ({
    uid: post.uid,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title:
        typeof post.data.title === 'string'
          ? post.data.title
          : RichText.asText(post.data.title),
      subtitle:
        typeof post.data.subtitle === 'string'
          ? post.data.subtitle
          : RichText.asText(post.data.subtitle),
      author:
        typeof post.data.author === 'string'
          ? post.data.author
          : RichText.asText(post.data.author),
    },
  }));

  return formatedPosts;
};

export const formatPost = (post: SlugPost) => ({
  first_publication_date: format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  ),
  data: {
    title:
      typeof post.data.title === 'string'
        ? post.data.title
        : RichText.asText(post.data.title),
    banner: { url: post.data.banner.url },
    author:
      typeof post.data.author === 'string'
        ? post.data.author
        : RichText.asText(post.data.author),
    content: post.data.content.map(content => ({
      heading: content.heading,
      body: content.body.map(contentBody => ({
        text: contentBody.text,
      })),
    })),
  },
});
