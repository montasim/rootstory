---
target: Rootstory app UI
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-10-08T15-50-52Z
slug: src-components-rootstory-app-tsx
---
Method: dual-agent (A: /root/design_review · B: /root/detector_evidence)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Save and failure states exist, but successful edits close with little visible feedback. |
| 2 | Match with the real world | 3/4 | Family language is strong; GEDCOM and connected versus unconnected people require product knowledge. |
| 3 | User control and freedom | 3/4 | Undo, history, cancel, and confirmations are strong; Undo is remote or hidden on mobile. |
| 4 | Consistency and standards | 3/4 | Components are cohesive, but Add person and Add relative look similar despite different outcomes. |
| 5 | Error prevention | 3/4 | Validation and previews are good; the global Add person action still makes accidental orphan records easy. |
| 6 | Recognition rather than recall | 3/4 | Labels are generally clear, but users must remember tree-line meanings and creation-mode differences. |
| 7 | Flexibility and efficiency | 2/4 | Search, filters, history, and tree controls help, but tree work remains pointer-first and repetitive. |
| 8 | Aesthetic and minimalist design | 3/4 | Calm and coherent, but the detail panel and oversized Add relative action overpower core content. |
| 9 | Error recovery | 3/4 | Errors are specific; history labels are too generic to support confident restoration. |
| 10 | Help and documentation | 2/4 | Field hints are useful; first-run guidance for the tree and archive model is absent. |
| **Total** |  | **28/40** | **Good mechanics; hierarchy and IA need work.** |

## Design Specificity Verdict

Rootstory is recognizably genealogical through its tree, relationship language, timeline, calendar, and local-only privacy model. Its visual system is still category-interchangeable: the Geist typography, navy actions, cards, and dialogs could belong to a CRM or records manager. The main missed opportunity is emotional hierarchy. Opening a relative currently feels like editing a database record rather than encountering a family story.

The deterministic detector returned zero findings (`[]`) for `src/components/rootstory-app.tsx`. That means the source avoids its known mechanical anti-patterns; it does not mean the rendered experience is issue-free. Browser geometry found concrete responsive defects at 320 px, while manual review found hierarchy and IA problems outside the detector's scope. No detector false positives were present.

No live overlay was injected because the available browser evaluation surface is read-only. Evidence came from independent desktop/mobile screenshots, accessibility snapshots, live geometry, computed contrast, and the CLI scan.

## Overall Impression

The app is trustworthy, mechanically careful, and domain-capable. Its biggest weakness is that administrative actions dominate the experience of a person. The selected Add relative button is the clearest symptom: it spans nearly the entire modal, visually outranking the person's identity, story, dates, and existing relationships.

## What's Working

- Local-only language, backup hierarchy, import previews, and destructive confirmations establish unusual confidence around sensitive family data.
- Forms have strong labels, hints, validation, focus treatment, semantic dialogs, and accessible names. Tested light-theme contrast passed AA.
- Tree, People, Timeline, and Calendar are genuinely useful domain views rather than decorative dashboard sections.

## Priority Issues

### 1. [P1] Add person and Add relative hide a critical product distinction

**Where:** global header/mobile `+`, person detail action row, Add person description.

**Why it matters:** Add person creates an unconnected record; Add relative creates a tree connection. A first-time user can choose the wrong path, fail to find the new person in the tree, and assume data was lost.

**Fix:** move standalone creation into People as a secondary action named **Create unconnected person**. Keep **Add relative to [name]** as the contextual primary action. Offer **Connect to the tree** after standalone creation.

**Suggested command:** `$impeccable clarify`

### 2. [P1] Narrow mobile headers clip navigation

**Where:** 320×700 header.

**Why it matters:** Open navigation occupies x=292–336 in a 320 px viewport. Sixteen pixels are clipped, leaving only 28×44 visibly hittable even though the underlying control is 44×44. Users on narrow devices lose part of a primary control with no horizontal recovery.

**Fix:** remove the fixed-width pressure from the family selector, allow it to flex and truncate earlier, and guarantee both Add person and navigation retain 44×44 visible areas plus edge padding.

**Suggested command:** `$impeccable adapt`

### 3. [P2] The person detail surface overweights graph editing

**Where:** 25.2rem desktop panel, 85svh mobile sheet, full-width Add relative button, five-tab strip.

**Why it matters:** The selected button looks heavy because it consumes almost the entire action row and uses the strongest fill. It implies that adding another person is the primary purpose of viewing Azizur. On desktop the sidebar and detail panel leave only about 56% of a 1280 px viewport for core content; on mobile the tall sheet can contain large empty areas.

**Fix:** make Add relative a normal-width contextual button beside Edit; keep delete and focus as quiet icon actions. Reduce or collapse the detail panel outside Tree. Put photo, lifespan, a short story, and key relationships in Overview before Home and Work.

**Suggested command:** `$impeccable layout`

### 4. [P2] Mobile tree starts with selected people clipped off-canvas

**Where:** Tree at 390×844.

**Why it matters:** Farhana begins clipped on the left and Rafiq on the right. The scrollbar and Drag to explore label explain movement, but users first need orientation. The icon-only center control does not clearly explain its target.

**Fix:** center the selected person after layout, navigation, and viewport changes on mobile; add safe canvas padding; name the compact control **Center Farhana**.

**Suggested command:** `$impeccable adapt`

### 5. [P2] Person tabs conceal Media at 320 px

**Where:** mobile person-detail tab strip.

**Why it matters:** The strip is 392 px wide inside a 320 px viewport; Media is initially entirely offscreen. Horizontal scrolling technically works, but there is no visible cue that another tab exists.

**Fix:** use a compact segmented layout, shorten or prioritize tabs, or expose an intentional scroll affordance such as an edge fade with snap behavior.

**Suggested command:** `$impeccable adapt`

### 6. [P2] History is too vague for emotionally valuable data

**Where:** Version history entries such as Changed settings and Edited Azizur Rahman.

**Why it matters:** Repeated generic labels and identical Restore buttons do not reveal which snapshot contains the desired state. Restoring the wrong version is especially stressful in a family archive.

**Fix:** show changed fields, family name, relative time, and a concise preview; add confirmation before restore and coalesce rapid setting changes.

**Suggested command:** `$impeccable harden`

### 7. [P2] Relationship types are comprehensive but hard to scan

**Where:** Add relative → Relationship type.

**Why it matters:** Nine flat choices force users to scan similar terms and reason about directionality.

**Fix:** group into Parent/child, Partner, and Sibling/other; phrase choices from the selected person's perspective; reveal the existing relationship preview immediately after selection.

**Suggested command:** `$impeccable distill`

## Persona Red Flags

- **Jordan, first-timer:** chooses Add person, expects a tree connection, then cannot find the record in Tree. There is no first-run explanation of connected versus unconnected people or tree-line meanings.
- **Sam, accessibility-dependent:** semantic coverage is strong, but tree zoom can reduce text to 40% and relationship understanding still depends heavily on line geometry. The screen-reader fallback also says awkward phrases such as “are sibling.”
- **Casey, distracted mobile user:** meets a clipped menu control at 320 px, a selected person partly off-canvas, an 85svh detail sheet without a drag affordance, and a hidden Media tab.

## Minor Observations

- The family selector is only 38 px high on desktop, below the otherwise consistent 44 px target floor.
- The archive name truncates aggressively, making identity harder to verify.
- Phone uses a Home icon in Contact.
- PDF actually opens browser print; label it **Print / save as PDF**.
- Timeline alternates among Remembered, Remembrances, and In remembrance.
- Calendar silently excludes partial dates except when explaining an empty state.
- Share & transfer packs seven export/import actions into one dense dialog; import falls below the fold.
- Successful additions lack a meaningful confirmation such as “Maliha was added to Farhana's branch.”
- Mobile details have no visible drag handle despite behaving like a bottom sheet.
- At 390 px, Share & transfer text can clip in the two-column mobile utility grid.

## Questions to Consider

- Is Rootstory primarily for constructing a graph or preserving stories? The current hierarchy says graph construction.
- Should unconnected people be a global creation path at all, or a deliberate exception inside People?
- What one meaningful thing should Overview reveal before Home and Work?
- Should history behave like an activity log or a recoverable change timeline?
