# Ritual Mind, design system and motion language

This document is the visual contract for the product. The product owner named `ritual-mind-professional.jsx` as the reference implementation. That file was not present in the repository at build time, so this document, together with the design tokens below and the six strict presentation rules, is the authoritative standard. Every page matches these rules.

## 1. Non negotiable presentation rules

1. No emoji anywhere. Not in the interface, not in feed items, not in buttons, not in documentation. Icons are stroke based geometric SVG on a 24 pixel grid with a 1.5 pixel stroke, or lucide-react outline icons.
2. No em dashes and no double hyphens in copy. Sentences are separated by periods.
3. Single dark theme. There is no light mode, no theme toggle, and no color scheme switcher. The UI layer does not read prefers-color-scheme.
4. Professional tone. Sentence case. No exclamation marks. No hype words such as revolutionary, seamless, unlock, or game changing.
5. Two font weights per family. Inter 400 and 700 for interface. JetBrains Mono 400 and 700 for numbers and addresses. Italic only in legal or citation contexts.
6. Consistency across every page. The icon set, spacing rhythm, card treatment, ring timing, and feed behavior are identical everywhere.

## 2. Color tokens

The palette is dark editorial. Orange is the single brand accent. Semantic colors mean exactly one thing.

Backgrounds.
- `--bg-base` #050505. The page.
- `--bg-raised` #080808. Large sections that sit above the page.
- `--bg-sunken` #0A0A0A. Recessed wells.

Surfaces.
- `--surface-1` #111111. Panels.
- `--surface-2` #161616. Nested panels and inputs.
- `--card` #1A1A1A. Cards.

Borders.
- `--border` #2B2B2B. Default hairline.
- `--border-bright` #3A3A3A. Hover and focus containers.

Text.
- `--text` #FFFFFF. Primary.
- `--text-muted` #A0A0A0. Secondary.
- `--text-dim` #606060. Tertiary and labels.

Brand and accents. Each accent is semantic.
- `--orange` #F97316. Brand. Primary action, active nav, brand marks, the composite ring in its mid band.
- `--green` #22C55E. Healthy score, verified, success, growth up. Composite above 700.
- `--red` #EF4444. Failure, flagged, penalty, growth down. Composite below 400.
- `--blue` #3B82F6. Links and neutral information.
- `--purple` #A855F7. Agent and AI generated content.
- `--cyan` #06B6D4. Precompile and data operations.
- `--gold` #EAB308. Pending, fees, and top three leaderboard emphasis.

Score band rule. Composite ring color is green above 700, orange from 400 to 699 inclusive, and red below 400. Sub score rings use the same thresholds scaled to their own maximums.

## 3. Typography

Families.
- Interface. Inter, weights 400 and 700 only.
- Numeric and address. JetBrains Mono, weights 400 and 700 only.

Scale. Sizes use a fixed step scale. Display uses clamp for fluid scaling without breakpoints.
- Display 1. clamp(2.75rem, 5vw, 4.5rem), Inter 700, letter spacing -0.02em. Hero.
- Display 2. clamp(2rem, 3.5vw, 3rem), Inter 700, letter spacing -0.02em. Section headers.
- Title. 1.25rem, Inter 700, letter spacing -0.01em. Card titles.
- Body. 0.9375rem, Inter 400, line height 1.6.
- Small. 0.8125rem, Inter 400. Secondary copy.
- Label. 0.6875rem, Inter 700, letter spacing 0.08em, uppercase. Data labels.
- Data. 0.875rem, JetBrains Mono 400. Values.
- Data strong. 0.875rem, JetBrains Mono 700. Emphasized values.
- Mono small. 0.75rem, JetBrains Mono 400. Addresses, truncated to 0x1234...5678.

Long form copy is capped at 68 characters per line with a 1.7 line height.

## 4. Spacing and layout

Spacing uses a 4 pixel base unit. The standard steps are 4, 8, 12, 16, 24, 32, 48, 64, 96, and 128 pixels. Cards use 24 pixel internal padding on desktop and 16 pixel on mobile. Section vertical rhythm is 96 pixels on desktop and 56 pixels on mobile.

Layout favors asymmetry. The homepage hero is left weighted. Grids intentionally break one column wider to avoid a templated feel. Content maximum width is 1280 pixels, with a wide mode at 1536 pixels for dense tables and the Founder Studio.

Borders over shadows. Elevation is expressed with border brightness and a faint inner sheen, not drop shadows. A single soft glow is reserved for the composite ring and for verified badges.

## 5. Component treatments

Cards. `--card` background, one `--border` hairline, 14 pixel radius, 24 pixel padding. On hover the border moves to `--border-bright` and a 250 millisecond ease raises the surface by one step of luminance. No translation jump.

Buttons. Transparent fill with a colored border. Primary is orange border with an orange tint on hover. Secondary is a `--border` outline. Danger is a red border. Buttons never use filled saturated backgrounds. Focus shows a 2 pixel orange ring offset from the page.

Inputs. `--surface-2` background, `--border` hairline, 10 pixel radius, mono font for address and numeric fields.

Tables. Dense by default. Row height 44 pixels. Zebra striping is off. Row separation is a single hairline. The header row is sticky and uses the label type style.

Ring. The score ring is an SVG circle with a rounded cap. The track is `--border`. The value arc uses the band color. The arc fills from the twelve o clock position clockwise.

## 6. Iconography

Icons are lucide-react outline icons or custom geometric SVG built on a 24 pixel grid with a 1.5 pixel stroke, round joins, and round caps. No filled icons. No emoji. Precompile types map to a small set of geometric marks. HTTP is a bidirectional arrow. LLM and agent operations use a diamond. Cryptographic operations use a triangle. Scheduling uses a clock. All are drawn in the same stroke system so they read as one set.

## 7. Motion language

Motion is powered by Framer Motion. Motion communicates state. Nothing moves for decoration alone. Every animation respects prefers-reduced-motion and falls back to an instant state change.

Timing.
- Micro interactions, 150 to 250 milliseconds, ease out.
- Ring fill, 1200 milliseconds, a custom cubic bezier of 0.16, 1, 0.3, 1, which decelerates hard at the end so the final value reads as settled.
- Counters, 900 milliseconds, ease out, with monospace tabular figures so digits do not shift width.
- Page transitions, 300 milliseconds, a short cross fade with an 8 pixel upward settle.

Live feed. New items enter with a spring, stiffness 320 and damping 30, translating 12 pixels up into place while fading in. Existing items push down with the same spring so the list feels physical. Items never pop.

Card hover. Border brightens and a soft orange glow at 12 percent opacity fades in over 200 milliseconds. On leave it fades out over 250 milliseconds.

Scroll reveal. Sections fade in and settle 16 pixels upward when they enter the viewport, staggered by 60 milliseconds across siblings, once per session.

Network pulse. The hero TEE visualization pulses on the agent cycle. When a real AgentExecution event arrives over the WebSocket, the visualization emits one propagating ring to signal a fresh computation.

## 8. Accessibility

Contrast meets WCAG 2.1 AA. `--text-dim` at #606060 is used only for non essential labels on the base background where it still clears the ratio, never for body text on cards. State is never carried by color alone. Success pairs green with a check mark and the word verified. Failure pairs red with a cross and the word flagged. Pending pairs gold with a clock and the word pending. All interactive elements have a visible focus ring and a 44 pixel minimum touch target on mobile. The application uses semantic landmarks, a skip link, and live regions for the feed and for streaming assistant responses.

## 9. Responsiveness

The product is usable from 375 pixels to ultrawide. Below the medium breakpoint tables collapse to stacked cards, the sidebar becomes a bottom sheet, multi ring layouts stack vertically, and buttons become full width. Addresses always truncate. Charts switch to a compact variant with fewer ticks. No horizontal page scroll at any width. Wide content scrolls inside its own container.
