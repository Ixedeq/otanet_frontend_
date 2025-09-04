import React from "react";

export default function MangaSkeleton() {
  return (
    <div className="manga-card skeleton">
      <div className="skeleton-cover"></div>
      <div className="skeleton-title"></div>
      <div className="skeleton-desc"></div>
      <div className="skeleton-desc short"></div>
    </div>
  );
}
