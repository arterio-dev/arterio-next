'use client';

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showEllipsis = totalPages > 7;

  if (showEllipsis) {
    pages.push(1);

    if (currentPage > 3) {
      pages.push(-1);
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push(-2);
    }

    pages.push(totalPages);
  } else {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-16 mb-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-10 w-10 items-center justify-center border border-black/10 text-black/60 hover:text-black hover:border-black/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-black/60 disabled:hover:border-black/10"
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {pages.map((page, index) => {
          if (page < 0) {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-10 w-10 items-center justify-center text-black/40"
              >
                ···
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-10 w-10 items-center justify-center border text-sm tracking-wide transition-colors ${
                currentPage === page
                  ? "border-black bg-black text-white"
                  : "border-black/10 text-black/60 hover:text-black hover:border-black/30"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-10 w-10 items-center justify-center border border-black/10 text-black/60 hover:text-black hover:border-black/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-black/60 disabled:hover:border-black/10"
        aria-label="Próxima página"
      >
        <ChevronRight size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
