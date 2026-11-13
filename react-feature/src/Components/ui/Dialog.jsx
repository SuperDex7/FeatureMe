import { useEffect, useId, useRef } from "react";
import Icon from "./Icon";

// Accessible modal dialog: Escape and backdrop click close it, focus moves into
// it on open and back to the previously focused element on close, and the page
// behind it can't scroll. Styles: .fm-dialog* in Styling/components.css.
function Dialog({ open, onClose, title, children, footer, size = "md", closeDisabled = false }) {
  const titleId = useId();
  const panelRef = useRef(null);
  // Read at keypress time, so a dialog stacked on top (e.g. a confirmation)
  // can block this one from closing on the same Escape press.
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    // Prefer an explicitly marked field, then the first control in the body, then the close button
    (panel?.querySelector("[data-autofocus]")
      || panel?.querySelector(".fm-dialog__body :is(input, textarea, select, button)")
      || panel?.querySelector("button"))?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape" && !closeDisabledRef.current) onCloseRef.current();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
    // Only runs when the dialog opens or closes; handlers are read through refs
  }, [open]);

  if (!open) return null;

  return (
    <div className="fm-dialog-overlay" onClick={() => !closeDisabled && onClose()}>
      <div
        ref={panelRef}
        className={`fm-dialog fm-dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fm-dialog__head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="fm-icon-btn" onClick={onClose} disabled={closeDisabled} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="fm-dialog__body">{children}</div>
        {footer && <div className="fm-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}

export default Dialog;
