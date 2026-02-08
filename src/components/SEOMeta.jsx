/**
 * SEO Meta Component - Reusable component for setting page meta tags
 * Supports Open Graph, Twitter Cards, and JSON-LD structured data
 */
import { Helmet } from "react-helmet-async";

export const SEOMeta = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
  structuredData,
  author,
  publishedDate,
  modifiedDate,
}) => {
  const siteName = "OtaNet";
  const defaultImage = "https://ota-network.com/otanet-logo.png";
  const defaultDescription = "Free online manga reader with thousands of titles";

  return (
    <Helmet>
      <title>{title || `${siteName} - Free Manga Reader`}</title>
      <meta
        name="description"
        content={description || defaultDescription}
      />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Author and Date Meta */}
      {author && <meta name="author" content={author} />}
      {publishedDate && <meta property="article:published_time" content={publishedDate} />}
      {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}

      {/* Open Graph / Social Media */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle || title || siteName} />
      <meta property="og:description" content={ogDescription || description || defaultDescription} />
      <meta property="og:image" content={ogImage || defaultImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || title || siteName} />
      <meta name="twitter:description" content={ogDescription || description || defaultDescription} />
      <meta name="twitter:image" content={ogImage || defaultImage} />
      <meta name="twitter:site" content="@OtaNetManga" />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOMeta;
