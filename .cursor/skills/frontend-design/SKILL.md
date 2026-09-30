---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults. Use when creating or restyling pages, components, or visual layouts.
license: Anthropic skills repository, see https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
---

# Frontend Design

来源：<https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md>

Approach this as the design lead at a design studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. This client has already rejected proposals that felt cliché or templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take aesthetic risk if justified.

## Ground your designs in the subject matter

If the brief does not identify what the product or subject matter is, identify it yourself before designing, and confirm with the client. You can come up with one concrete subject, the design's audience, and the design's primary job, as a proposal. If there's any information in your memory about the client's preferences or context about what they're building, use that as a hint. The subject's industry, subject matter, materials, and vernacular are where distinctive visual choices come from. Build with the brief's real content and subject matter throughout.

## Design principles

For web designs, the hero is the first thing viewers will see. Open with the most characteristic thing in the subject's world. Be deliberate: a big number with a small label, supporting stats, and a gradient accent is the default treatment, so only use it if that's truly the best option.

Typography carries the personality of the page. Use one family or two, and if two, make them clearly distinct. Choose typefaces deliberately. Set a clear type scale with intentional weights and spacing. Default to line lengths of less than 80 characters.

Avoid these default typographic treatments:
- Accenting just a single word or phrase in a headline.
- Using all caps for labels.
- Adding unnecessary typographic labels above content.

Visual structure is information. Structural devices encode useful information about the content rather than decorate it. Numbered markers (01 / 02 / 03) are only appropriate if the content is a sequence.

Use non-user-triggered motion sparingly. A single orchestrated moment lands better than fade-and-slide-up on every section. Motion that answers a person's action is welcome when it shows what changed.

## Process

AI-generated design often clusters around these defaults. They are legitimate for some briefs, but they are defaults rather than choices. Where the brief pins down a visual direction, follow it exactly.

1. A warm cream background with a high-contrast serif and a terracotta accent.
2. A near-black background with a single bright acid-green or vermilion accent.
3. A broadsheet layout with hairline rules, zero border-radius, and dense columns.
4. The SaaS-card kit: identical rounded cards, one radius on everything, the same soft grey shadow, and gradient washes as decoration.
5. Template chrome: tracked-out all-caps eyebrows, middle-dot meta strings, em-dash labels, tinted near-black, monospace data labels, arrows appended to every link.

Work in two passes. First write a compact token system: 4–6 named colors, type roles, a layout concept, and the principles that make this page specific. Review that plan against the brief. If any part would appear on any similar page, revise it before writing code.

Spend boldness in one place. Keep everything around it quiet. Build responsive, keyboard-focusable, reduced-motion-aware UI. Critique with a screenshot when the environment supports it.

## Writing

Words exist to make the interface easier to use. Name things by what the user understands. A control says exactly what happens: the button "Publish" produces "Published." Errors explain what happened and how to fix it. Empty screens invite an action. Sentence case, plain verbs, one job per written element.
