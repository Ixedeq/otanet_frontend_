/**
 * SEO Helper Functions for dynamic meta tag generation
 */

export const generateMangaPageMeta = (manga, hash, slug) => {
  if (!manga) return {};

  const tagsArray = Array.isArray(manga.tags)
    ? manga.tags
    : typeof manga.tags === "string"
      ? [manga.tags]
      : [];
  const canonical = `https://ota-network.com/${slug}/${hash}`;

  return {
    title: `${manga.title} - Read Online Free | OtaNet Manga Reader`,
    description: `Read ${manga.title} online for free. ${manga.description || "Explore chapters and enjoy high-quality manga reading experience."}`,
    keywords: `${manga.title}, manga, read online, ${tagsArray.slice(0, 5).join(", ")}`,
    ogTitle: manga.title,
    ogDescription: manga.description || "Read manga online for free",
    ogImage:
      manga.cover ||
      manga.coverImage ||
      "https://ota-network.com/otanet-logo.png",
    canonical: canonical,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: manga.title,
      image:
        manga.cover ||
        manga.coverImage ||
        "https://ota-network.com/otanet-logo.png",
      description: manga.description || "",
      url: canonical,
      genre: tagsArray.slice(0, 5),
      inLanguage: "en",
    },
  };
};

export const generateChapterPageMeta = (
  mangaTitle,
  chapterNumber,
  slug,
  hash,
) => {
  const canonical = `https://ota-network.com/read/${slug}/${hash}/chapter-${chapterNumber.toString().replace(/\./g, "-")}`;

  return {
    title: `${mangaTitle} - Chapter ${chapterNumber} | Read Free Online`,
    description: `Read ${mangaTitle} Chapter ${chapterNumber} online for free with high-quality images.`,
    keywords: `${mangaTitle}, chapter ${chapterNumber}, manga, read online`,
    ogTitle: `${mangaTitle} - Chapter ${chapterNumber}`,
    ogDescription: `Read Chapter ${chapterNumber} of ${mangaTitle}`,
    ogImage: "https://ota-network.com/otanet-logo.png",
    canonical: canonical,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${mangaTitle} - Chapter ${chapterNumber}`,
      description: `Read Chapter ${chapterNumber} of ${mangaTitle}`,
      url: canonical,
      isPartOf: {
        "@type": "CreativeWork",
        name: mangaTitle,
      },
    },
  };
};

export const generateSearchPageMeta = (searchTerm) => {
  const canonical = `https://ota-network.com/search/${encodeURIComponent(searchTerm)}`;

  return {
    title: `Search: ${searchTerm} | OtaNet Manga Reader`,
    description: `Search results for "${searchTerm}". Find manga titles matching your search query on OtaNet. Thousands of manga available to read online for free.`,
    keywords: `${searchTerm}, manga search, read manga, ${searchTerm} manga`,
    ogTitle: `Search Results: ${searchTerm}`,
    ogDescription: `Find manga related to ${searchTerm} on OtaNet`,
    ogImage: "https://ota-network.com/otanet-logo.png",
    canonical: canonical,
  };
};

export const generateTagPageMeta = (tags) => {
  const tagString = Array.isArray(tags) ? tags.join(", ") : tags;
  const tagParams = Array.isArray(tags) ? tags.join(",") : tags;
  const canonical = `https://ota-network.com/search/tags?include=${encodeURIComponent(tagParams)}`;

  return {
    title: `Manga by Tags: ${tagString} | OtaNet`,
    description: `Browse manga with tags: ${tagString}. Discover new series with your favorite genres on OtaNet. Free online manga reader.`,
    keywords: `${tagString}, manga, genres, read online, manga tags`,
    ogTitle: `Manga - ${tagString}`,
    ogDescription: `Manga with ${tagString} tags - Browse free online`,
    ogImage: "https://ota-network.com/otanet-logo.png",
    canonical: canonical,
  };
};

export const generateRecentMangaMeta = (page = 1) => {
  const canonical = `https://ota-network.com/recent/${page}`;

  return {
    title: `Recent Manga Releases | OtaNet Free Reader`,
    description: `Discover the latest manga releases on OtaNet. Browse new chapters and series updated daily. Read free manga online.`,
    keywords:
      "recent manga, new manga releases, latest chapters, free manga, manga reader",
    ogTitle: "Latest Manga Releases",
    ogDescription: "Browse the newest manga releases and chapters on OtaNet",
    ogImage: "https://ota-network.com/otanet-logo.png",
    canonical: canonical,
  };
};

export const generateBookmarksPageMeta = () => {
  return {
    title: "My Bookmarks | OtaNet Manga Reader",
    description:
      "View your bookmarked manga on OtaNet. Keep track of your favorite series and continue reading where you left off.",
    keywords: "bookmarks, saved manga, my manga, manga reader",
    ogTitle: "My Bookmarks",
    ogDescription: "Your bookmarked manga collection",
    ogImage: "https://ota-network.com/otanet-logo.png",
    canonical: "https://ota-network.com/bookmarks",
  };
};

export const generateErrorPageMeta = (errorType = "404") => {
  return {
    title: `${errorType} Error | OtaNet Manga Reader`,
    description:
      "Oops! Something went wrong. Visit OtaNet to browse thousands of free manga online.",
    ogTitle: `Page Not Found - OtaNet`,
    ogDescription: "Return to OtaNet to continue reading manga",
  };
};
