import { Font } from "@react-pdf/renderer";
import ClassicTemplate from "./ClassicTemplate";
import ModernTemplate from "./ModernTemplate";
import CompactTemplate from "./CompactTemplate";
import { TEMPLATE_META } from "./meta";

/**
 * react-pdf hyphenates long words by default, which turns a surname like
 * "Barahate" into "Bara-hate" in a narrow sidebar. Returning the word whole
 * disables splitting everywhere.
 */
Font.registerHyphenationCallback((word) => [word]);

/**
 * Binds each metadata entry to its component. This module pulls in
 * @react-pdf/renderer, so it must only ever be imported from inside the
 * lazily-loaded preview -- never from the builder page or the picker.
 */
const COMPONENTS = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  compact: CompactTemplate,
};

export const TEMPLATES = TEMPLATE_META.map((t) => ({ ...t, component: COMPONENTS[t.id] }));

// Unknown or missing templateId falls back to the first template rather than
// rendering nothing.
export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];