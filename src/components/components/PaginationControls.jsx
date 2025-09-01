import React from "react";

export default function PaginationControls({ currentPage, totalPages, goNext, goPrev }) {
  return (
    <div className="pagination-controls">
      <button onClick={goPrev} disabled={currentPage === 1}>
        Previous
      </button>
      <span>
        {currentPage} / {totalPages}
      </span>
      <button onClick={goNext} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  );
}
