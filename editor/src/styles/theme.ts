import { extendTheme } from "@chakra-ui/react";
import theme from "@metapages/metaframe-chakra-theme";

/**
 * framejs.io editor theme.
 *
 * We start from the shared @metapages/metaframe-chakra-theme, then overlay the
 * "blueprint / drafting table" design language from framejs.app so the two
 * apps look like one product. The token *values* below are the same ones in
 * ./blueprint.css (--paper, --ink, --accent, …) — kept as literal hex here
 * (rather than var()) so Chakra's build-time color math never chokes on a CSS
 * variable. To restyle both apps in lockstep, change a token in both places.
 *
 * Chakra's neutral `gray` scale is remapped onto the blueprint neutrals so the
 * existing components (header, panels, dividers) adopt the palette without
 * per-component edits. `blue` becomes the cobalt accent.
 */

// Blueprint light palette — mirror of :root in blueprint.css
const paper = "#fbfaf7";
const surface = "#ffffff";
const surface2 = "#f4f2ec";
const ink = "#1a1712";
const ink2 = "#56514a";
const ink3 = "#8b857a";
const line = "#e8e4da";
const lineStrong = "#d5cfc3";
const accent = "#1f2edb";
const accentHover = "#1824ae";
const accentSoft = "#edeefe";

export const mfTheme = extendTheme(
  {
    fonts: {
      // IBM Plex Sans for chrome/body, IBM Plex Mono for data/labels/code.
      heading: `'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif`,
      body: `'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif`,
      mono: `'IBM Plex Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace`,
    },
    // Remap Chakra's neutral scale onto the blueprint neutrals. Components in
    // this app lean on gray.100 (recessed bg), gray.300 (hairlines) and
    // gray.600 (text/icons).
    colors: {
      gray: {
        50: surface,
        100: surface2,
        200: line,
        300: lineStrong,
        400: ink3,
        500: ink3,
        600: ink2,
        700: ink,
        800: ink,
        900: ink,
      },
      // Cobalt accent — used by colorScheme="blue" and default focus rings.
      blue: {
        50: accentSoft,
        100: accentSoft,
        400: accent,
        500: accent,
        600: accentHover,
        700: accentHover,
      },
      accent: {
        soft: accentSoft,
        500: accent,
        600: accentHover,
      },
    },
    // `borderBottom="1px"` etc. resolve through this border token; make the
    // shared "1px" a warm hairline instead of the old cool #DEDEDE.
    borders: {
      "1px": `1px solid ${line}`,
    },
    styles: {
      global: {
        // Chakra's CSS reset sets body bg/color; override to the paper ground.
        body: {
          background: paper,
          color: ink,
        },
      },
    },
  },
  theme,
);
