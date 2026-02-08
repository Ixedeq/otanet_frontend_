/**
 * SEO Meta Component - Reusable component for setting page meta tags
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
}) => {
  const siteName = "OtaNet";
  const defaultImage = "https://ota-network.com/og-image.jpg";

  return (
    <Helmet>
      <title>{title || `${siteName} - Manga Reader`}</title>
      <meta
        name="description"
        content={description || "Read manga online for free"}
      />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph / Social Media */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage || defaultImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage || defaultImage} />

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
