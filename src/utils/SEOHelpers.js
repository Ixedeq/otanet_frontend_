/**
 * SEO Helper Functions for dynamic meta tag generation
 */

export const generateMangaPageMeta = (manga) => {
  if (!manga) return {};
  
  return {
    title: `${manga.title} - Read Manga Online | OtaNet`,
    description: `Read ${manga.title} online for free. ${manga.description || 'Explore chapters and enjoy high-quality manga reading experience.'}`,
    keywords: `${manga.title}, manga, read online, ${manga.tags?.join(', ') || ''}`,
    ogTitle: manga.title,
    ogDescription: manga.description || 'Read manga online for free',
    ogImage: manga.coverImage || 'https://ota-network.com/default-cover.jpg',
  };
};

export const generateChapterPageMeta = (mangaTitle, chapterNumber) => {
  return {
    title: `${mangaTitle} - Chapter ${chapterNumber} | OtaNet`,
    description: `Read ${mangaTitle} Chapter ${chapterNumber} online for free with high-quality images.`,
    keywords: `${mangaTitle}, chapter ${chapterNumber}, manga, read online`,
    ogTitle: `${mangaTitle} - Chapter ${chapterNumber}`,
    ogDescription: `Read Chapter ${chapterNumber} of ${mangaTitle}`,
  };
};

export const generateSearchPageMeta = (searchTerm) => {
  return {
    title: `Search Results for "${searchTerm}" | OtaNet Manga Reader`,
    description: `Search results for "${searchTerm}". Find manga titles matching your search query on OtaNet.`,
    keywords: `${searchTerm}, manga search, read manga`,
    ogTitle: `Search: ${searchTerm}`,
    ogDescription: `Find manga related to ${searchTerm}`,
  };
};

export const generateTagPageMeta = (tags) => {
  const tagString = tags.join(', ');
  return {
    title: `Manga with tags: ${tagString} | OtaNet`,
    description: `Browse manga with tags: ${tagString}. Discover new series with your favorite genres.`,
    keywords: `${tagString}, manga, genres, read online`,
    ogTitle: `Manga - ${tagString}`,
    ogDescription: `Manga with ${tagString} tags`,
  };
};
