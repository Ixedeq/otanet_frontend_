import React from "react";
import { useParams, Link } from "react-router-dom";
import "../css/ChapterPage.css";

export default function ChapterPage() {
  const { slug, chapter } = useParams();
  console.log("Params: ", slug, chapter)

  // Dynamically import all images from the folder
  let images = [];
  try {
    const context = require.context(
      `../assets/chapters/${manga}`,
      false,
      /\.(png|jpe?g)$/
    );
    console.log(context);
    images = context.keys().map(context);
  } catch (err) {
    console.warn(`No images found for manga: ${manga}`);
  }

  return (
    <div className="chapter-page">
      <div>Hello World </div>
      <Link to="/" className="back-link">← Back to Home</Link>
      <h1 className="chapter-title">{manga}</h1>

      {images.length === 0 && <p>No pages found for this manga.</p>}

      <div className="chapter-images">
        {images.map((src, idx) => (
          <img key={idx} src={src} alt={`Page ${idx + 1}`} className="chapter-img" />
        ))}
      </div>
    </div>
  );
}

