import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { getTemplate } from "../templates";
import { toTemplateData } from "../utils/resumeData";

/**
 * Re-rendering a PDF is expensive -- far more so than a React re-render. Typing
 * would rebuild the document on every keystroke, so the preview follows the
 * draft on a delay and catches up once you pause.
 */
function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Filenames: "Samruddhi Barahate - Backend.pdf"
const fileName = (draft) => {
  const parts = [draft.contact.fullName?.trim(), draft.name?.trim()].filter(Boolean);
  const base = parts.join(" - ") || "resume";
  return `${base.replace(/[\\/:*?"<>|]/g, "")}.pdf`;
};

/**
 * A4 is 210 x 297mm, so width = height x 0.7071. Capping the viewer's width
 * off the available height keeps the whole page visible instead of letting it
 * fill the container's width and run off the bottom.
 */
const A4_RATIO = 0.7071;

const DownloadButton = ({ element, name, dark }) => (
  <PDFDownloadLink document={element} fileName={name}>
    {({ loading }) => (
      <span
        className={`inline-block rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
          dark ? "bg-white text-ink hover:bg-white/90" : "bg-ink text-white hover:bg-ink/90"
        }`}
      >
        {loading ? "Preparing…" : "Download PDF"}
      </span>
    )}
  </PDFDownloadLink>
);

export default function ResumePreview({ draft }) {
  const debouncedDraft = useDebouncedValue(draft, 700);
  const isStale = debouncedDraft !== draft;
  const [expanded, setExpanded] = useState(false);

  // The template element is memoised on the debounced data, so it isn't
  // rebuilt unless the content actually changed.
  const { element, name } = useMemo(() => {
    const template = getTemplate(debouncedDraft.templateId);
    const Component = template.component;
    return {
      element: <Component data={toTemplateData(debouncedDraft)} />,
      name: fileName(debouncedDraft),
    };
  }, [debouncedDraft]);

  // Escape closes the full-screen view; the body scroll lock stops the page
  // behind it from scrolling under the overlay.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => e.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded]);

  const viewer = (
    <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: "none" }}>
      {element}
    </PDFViewer>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="eyebrow shrink-0 text-muted">
          Preview{isStale && <span className="normal-case tracking-normal"> · updating…</span>}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-ink/30"
          >
            Full screen
          </button>
          <DownloadButton element={element} name={name} />
        </div>
      </div>

      {/* min-h-0 is what lets this flex child actually shrink to the column
          height instead of overflowing it -- without it the viewer pushes
          past the container and gets its own scrollbar. */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-[#4a4d52]">
        {/* Only one PDFViewer is mounted at a time. Rendering both the inline
            and the full-screen one would run the PDF engine twice for the
            same document. */}
        {!expanded && viewer}
      </div>

      {/**
       * Rendered through a portal into <body>, NOT in place.
       *
       * position:fixed with z-50 still isn't enough here: the builder's sticky
       * bar uses backdrop-blur, which creates its own stacking context, and an
       * overlay nested inside the page tree can end up painting underneath it
       * no matter how high its z-index goes. Escaping to <body> puts the
       * overlay in the root stacking context, where z-index means what you
       * expect. It also dodges any ancestor overflow:hidden clipping.
       */}
      {expanded &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#16161d]">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-white">{draft.name}</p>
                <p className="truncate text-[12px] text-white/45">{name}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DownloadButton element={element} name={name} dark />
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="rounded-lg border border-white/25 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
                >
                  Close <span className="text-white/50">Esc</span>
                </button>
              </div>
            </header>

            {/* Clicking the dark area around the page closes, like a lightbox */}
            <div
              className="min-h-0 flex-1 overflow-auto p-5"
              onClick={(e) => e.target === e.currentTarget && setExpanded(false)}
            >
              <div
                className="mx-auto h-full w-full overflow-hidden rounded-lg bg-white shadow-2xl"
                style={{ maxWidth: `calc((100vh - 116px) * ${A4_RATIO})` }}
              >
                {viewer}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}