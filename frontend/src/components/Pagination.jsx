import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange && onPageChange(i)}
          className={`w-9 h-9 flex items-center justify-center text-sm font-semibold rounded-lg transition-all duration-200 ${
            currentPage === i 
              ? "bg-indigo-600 text-white shadow-xs" 
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6 select-none animate-fade-in">
      <Button
        variant="secondary"
        size="sm"
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="w-9 h-9 !p-0"
        aria-label="Previous Page"
      >
        <ChevronLeft size={16} />
      </Button>
      <div className="flex items-center gap-1">{renderPageNumbers()}</div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="w-9 h-9 !p-0"
        aria-label="Next Page"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};

export default Pagination;
