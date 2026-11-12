import Icon from "./Icon";

// Previous / Next paging for zero-based pages. Renders nothing for a single page.
function Pagination({ page, totalPages, onChange, label = "Pages" }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <nav className="fm-pagination" aria-label={label}>
      <button type="button" className="fm-btn fm-btn--secondary" onClick={() => onChange(page - 1)} disabled={page <= 0}>
        <Icon name="chevronLeft" size={18} />
        Previous
      </button>
      <span className="fm-pagination__info">Page {page + 1} of {totalPages}</span>
      <button type="button" className="fm-btn fm-btn--secondary" onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}>
        Next
        <Icon name="chevronRight" size={18} />
      </button>
    </nav>
  );
}

export default Pagination;
