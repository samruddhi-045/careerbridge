/**
 * Template metadata ONLY -- deliberately no imports of the template components.
 *
 * The picker needs names and descriptions, not the PDF engine. Keeping these
 * apart is what lets @react-pdf/renderer stay in its own lazily-loaded chunk:
 * a single static import of a template component anywhere in the main tree
 * pulls the whole 1.4MB library back into the main bundle.
 */
export const TEMPLATE_META = [
  {
    id: "classic",
    name: "Classic",
    description: "Serif, single column. The safe choice for traditional employers and ATS.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Two columns with a coloured sidebar for contact and skills.",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense single column. Best when you're fighting to stay on one page.",
  },
];