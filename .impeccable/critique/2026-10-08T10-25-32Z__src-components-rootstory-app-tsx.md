---
target: current family tree UX
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
timestamp: 2026-10-08T10-25-32Z
slug: src-components-rootstory-app-tsx
---
# Rootstory Family Tree UX Critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Selection, zoom, autosave, and collapse state are visible, but spatial commands provide weak confirmation. |
| 2 | Match system / real world | 3/4 | Kinship language is natural; generation and direction labels remain system-oriented. |
| 3 | User control and freedom | 2/4 | Undo and history are strong, but fit, center, and reveal behavior do not match their labels. |
| 4 | Consistency and standards | 2/4 | Desktop relationship geometry works, while mobile wrapping breaks the same visual grammar. |
| 5 | Error prevention | 3/4 | Validation, previews, confirmations, and snapshots are strong; collapse remains active when it has no useful effect. |
| 6 | Recognition rather than recall | 2/4 | The legend helps, but users must remember line meanings and former partner shares styling with sibling. |
| 7 | Flexibility and efficiency | 2/4 | Search and alternate views help; true fit, pan, selected-node centering, and large-tree navigation are absent. |
| 8 | Aesthetic and minimalist design | 3/4 | The tree is calm and compact, but simultaneous command surfaces compete with it. |
| 9 | Error recovery | 3/4 | Data recovery is excellent; spatial and relationship mistakes are not visibly explained. |
| 10 | Help and documentation | 2/4 | Local helper copy exists, but the primary tree workflow does not teach its visual semantics. |
| **Total** |  | **25/40** | **Usable foundation; not production-ready across viewports.** |

## Design Specificity Verdict

Rootstory is moderately product-specific. Kinship roles, archive language, privacy safeguards, and the relationship graph belong to family history. The surrounding rounded cards, indigo controls, icon toolbar, and tabbed inspector remain category-generic enough to fit a CRM. The strongest domain opportunity—continuity between people and generations—is present structurally but not yet fully expressed through interaction.

The deterministic detector returned zero findings. That is useful but incomplete: browser testing exposed responsive relationship failures, control overlap, and missing accessible relationship semantics that the source scanner cannot infer.

## Overall Impression

The desktop demo is calm, legible, and immediately operable. Selecting a person feels dependable, and the shared parent junctions are easier to read than the earlier tree. My satisfaction is roughly **6.5/10 on desktop, 3/10 on mobile, and 5.5/10 overall**. The biggest opportunity is to make graph navigation and relationship meaning correct and self-explanatory at every viewport before adding more visual polish.

## What’s Working

1. Person selection updates the card state and details panel immediately and consistently.
2. Shared parent junctions and partner adjacency make the small desktop tree substantially easier to trace.
3. Autosave, undo, version history, import preview, delete confirmation, and privacy copy create unusually strong trust.

## Cognitive Load

Four of eight checks fail: single focus, visual hierarchy, one thing at a time, and minimal choices. The tree competes with global archive actions, four view choices, a multi-control tree toolbar, a legend, four person actions, and five detail tabs. Users must also remember line styles while tracing unlabeled edges. Chunking, grouping, persistent context, and dialog-based progressive disclosure work well.

## Emotional Journey

Entry feels calm and trustworthy. The first successful person selection is satisfying. Confidence drops when line meanings need the legend, when search removes the surrounding family, or when fit/center controls do not perform conventional spatial actions. High-stakes data actions are the strongest part of the experience because they provide clear preview, confirmation, and recovery.

## Priority Issues

### [P1] Mobile relationship paths become incorrect

At 390px, generation peers wrap into a vertical column while the edge router still assumes side-by-side peers. The partner path crosses Ada’s card instead of connecting correctly to Noa, and parent junctions degenerate. Relationship accuracy is the product’s core promise; an incorrect line is worse than a hidden line. Prevent independent wrapping or route from actual post-wrap positions with a mobile-specific layout.

Suggested command: `$impeccable adapt`

### [P1] Mobile controls obscure the tree

The multi-row floating toolbar overlaps the first person card because the canvas reserves less vertical space than the controls consume. Put controls in layout, collapse them into one compact toolbar, or reserve their measured height.

Suggested command: `$impeccable adapt`

### [P1] Spatial navigation labels overpromise

“Fit tree” selects a fixed 70% zoom rather than fitting rendered bounds. “Center on me” changes selection but does not center the viewport, and “View in tree” does not ensure the target is visible. Implement a single honest navigation model: fit rendered bounds, center the selected node, and reveal a person after search or details navigation.

Suggested command: `$impeccable harden`

### [P1] Search removes the relationship context

Searching for Noa reduces the graph to one card and removes all relationship lines. A family-tree search should answer “where is this person?” Keep the graph, dim nonmatches, highlight the active result, and center it. Reserve destructive filtering for an explicit filter mode.

Suggested command: `$impeccable clarify`

### [P1] Relationship meaning is inaccessible and under-specified

SVG edges are aria-hidden with no structured textual equivalent. Screen-reader users can find people but cannot determine parent, partner, or sibling relationships. Visually, former partner and sibling share the same dashed treatment. Add a structured relationship summary for the selected person and give semantically different relations distinct labels/treatments.

Suggested command: `$impeccable audit`

### [P2] The command surface competes with the tree

Global archive actions, view navigation, tree navigation, collapse, generation jump, legend, person actions, and five tabs are all simultaneously visible. Consolidate archive utilities, group spatial controls, and disable or hide actions that do not apply to the selected node.

Suggested command: `$impeccable distill`

## Persona Red Flags

**Mara, older family archivist:** thin relationship lines, compact detail tabs, icon-only utilities, and ambiguous dashed relations increase hesitation. Mobile overlap makes the first generation partially unreadable.

**Dev, genealogy power user:** no true fit, pan, selected-node centering, overview map, branch path, or contextual search. The eight-person demo masks how quickly navigation will degrade with hundreds of people.

**Jordan, first-time contributor:** the interface presents archive utilities, multiple views, tree tools, details actions, and five tabs before teaching the tree model. Misleading spatial labels and unexplained relationship lines weaken confidence in editing.

## Minor Observations

- Replace “down / up / left / right” with “Top to bottom,” “Bottom to top,” and equivalent labels.
- Disable Collapse for leaves and show the number of hidden descendants for real branches.
- Preserve a compact relationship key on mobile.
- The selected card could be more distinct without adding decorative weight.
- The accessibility tree maps pressed person buttons unusually; verify with a real screen reader.
- The detector’s zero findings should not be read as a clean UX bill of health.

## Questions to Consider

- Is Rootstory primarily a family graph with supporting records, or a record manager with a graph?
- If the legend disappeared, could a new user correctly explain every visible relationship?
- Should search locate someone in their family context or filter everyone else away?
- Should “Center on me” mean the archive owner specifically, or should every selected person be centerable?
