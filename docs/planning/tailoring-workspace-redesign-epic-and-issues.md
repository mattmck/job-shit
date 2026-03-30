# Tailoring Workspace Redesign Epic and Issue Breakdown

## Epic: Redesign tailoring workspace into a full application command center

### Description
The current app has a strong direction, but the real workflow is still too fragmented and cramped. The highest-value surfaces — **job list, editor, and preview** — do not have enough space, editing is fragile, export workflows are clunky, and too much critical work still happens outside the app in Huntr, ChatGPT, Grammarly, company sites, and job tabs.

This epic covers the redesign needed to turn the app into a true application workspace: one place to browse jobs, tailor in bulk, edit comfortably, preview clearly, export efficiently, manage prompts, answer common application questions, and prep for interviews quickly using the exact materials associated with the application.

### Goals
- Make the job list, editor, and preview genuinely usable.
- Reduce out-of-band work.
- Prevent destructive content loss.
- Improve bulk tailoring and export workflows.
- Add integrated interview prep.

### Success criteria
- More jobs visible at once without browser zoom hacks.
- Editor is large enough to use comfortably.
- Preview is large enough to catch format and content issues.
- Format changes no longer silently destroy content.
- Users can prep for an interview from one role-specific workspace instead of reopening multiple tabs.

---

## Child issues

### 1. Redesign job list for density, filtering, and bulk actions
**Problem**  
The job list is too cramped; only a couple rows are visible, and it is too hard to scan/select the jobs you want to tailor.

**Scope**
- Increase visible row density.
- Reduce layout clutter around the table/list.
- Add filtering by:
  - company
  - role
  - status
  - loaded but not yet tailored
- Add bulk actions:
  - select all visible
  - select by filter
  - add selected to queue
- Add row-level actions:
  - open job page
  - open/edit in Huntr
  - open interview prep
  - open artifacts/editor

**Acceptance criteria**
- User can see substantially more rows at a glance.
- Common “Loaded but not yet tailored” selection flow is easy.
- Row actions reduce the need to cross-reference outside tabs.

---

### 2. Redesign structured editor for size, comfort, and context
**Problem**  
The structured editor is one of the biggest pain points: too small, too much scrolling, poor context, and annoying controls.

**Scope**
- Increase editor panel size substantially.
- Increase text area heights and widths.
- Increase editing control/button sizes.
- Improve long bullet editing experience.
- Keep surrounding section context visible while editing.
- Reduce back-and-forth scrolling.

**Acceptance criteria**
- Editor can comfortably handle long bullet edits.
- User can edit without constant context loss.
- Editing feels materially less tedious.

---

### 3. Preserve content when switching structured section formats
**Problem**  
Changing a section from one format type to another can wipe all text.

**Scope**
- Add safe transformations between section types:
  - text
  - bullets
  - jobs
  - other supported structures
- Add confirmation or preview for risky conversions.
- Add undo/recovery support.

**Acceptance criteria**
- No silent content destruction.
- Conversions preserve as much user input as possible.
- User can recover if transformation is wrong.

---

### 4. Expand preview into a real review surface
**Problem**  
Preview is too small, even though it is one of the most important surfaces.

**Scope**
- Increase preview size substantially.
- Support side-by-side editor + preview.
- Allow switching between resume and cover letter preview.
- Optimize preview for:
  - format review
  - content spotting
  - quick iteration

**Acceptance criteria**
- Preview is large enough to be meaningfully useful.
- User can detect both formatting and content issues more easily.

---

### 5. Improve queue UX for bulk tailoring and review
**Problem**  
Bulk tailoring is central to the workflow, but the queue/review experience should be clearer and more operational.

**Scope**
- Improve scanability of queue state.
- Surface successes/failures clearly.
- Make it easy to jump from queue results to:
  - editor
  - preview
  - regenerate
  - interview prep
- Support efficient review after a batch run.

**Acceptance criteria**
- Bulk tailoring feels reliable and clear.
- Failed/problematic jobs are easy to identify and fix.

---

### 6. Add workspace-level prompt management and versioning
**Problem**  
Prompt editing is now important, but current controls are too small and unclear, and regenerate flows need more control.

**Scope**
- Create workspace-level prompt library/versioning.
- Add larger prompt editing surfaces.
- Support prompts for:
  - keyword extraction
  - tailoring
  - regeneration
  - common questions
- Add regenerate modal with extra instruction field.
- Track which prompt version generated which output.

**Acceptance criteria**
- User can safely edit and evolve prompts.
- Regeneration can include additional context/instructions.
- Prompt management feels deliberate, not fragile.

---

### 7. Add style controls for generated writing
**Problem**  
Generated content often feels too fluffy, too long, and not punchy enough, especially cover letters.

**Scope**
- Add generation controls for:
  - concise
  - edgy
  - punchy
  - more formal
  - less formal
- Add shortener/refiner pass for cover letters.
- Support shorter paragraph preferences.

**Acceptance criteria**
- Generated writing needs less Grammarly cleanup.
- User can steer tone without editing prompts manually every time.

---

### 8. Integrate common application questions into tailoring pipeline
**Problem**  
Answers to common application questions are still too external/manual, and adding/editing question sets is cumbersome.

**Scope**
- Add reusable common-question library.
- Allow adding/editing questions.
- Auto-generate answers during tailoring.
- Store answers with the job.
- Reuse role-specific context automatically.

**Acceptance criteria**
- Less copy/paste into ChatGPT.
- Question-answer generation becomes a normal part of the workflow.

---

### 9. Build interview prep workspace with interview-type rundowns
**Problem**  
Interview prep currently requires manually reopening and cross-referencing the JD, company site, and submitted resume, often under time pressure. The app should handle this directly.

**Scope**
- Add Interview Prep view per job.
- Pull together:
  - JD
  - company summary/site info
  - tailored resume
  - tailored cover letter
  - generated common-question answers
- Add interview-type presets:
  - phone screen
  - recruiter screen
  - hiring manager
  - technical screen
  - technical panel
  - final round
- Generate “what I need to know” rundown for each type:
  - what they assess
  - strongest relevant background
  - likely questions
  - stories to emphasize
  - risks/gaps
  - good questions to ask
- Add fast-prep / panic mode for imminent interviews.

**Acceptance criteria**
- User can prep for an interview from one workspace instead of many tabs.
- Fast-prep mode works well for urgent scenarios.
- Generated prep feels role-specific, not generic.

---

### 10. Add direct job-page and Huntr links/actions throughout workflow
**Problem**  
Cross-referencing external sources is too manual today.

**Scope**
- Add direct “open job posting” action.
- Add direct “open/edit in Huntr” action.
- Surface these in:
  - job list
  - job detail
  - interview prep
- Support pull-down refresh/reload of updated job data where possible.

**Acceptance criteria**
- Fewer manual lookups in separate tabs.
- User can jump directly to source systems.

---

### 11. Add export cart and zip-based bulk download flow
**Problem**  
Quick downloads are useful, but repeated individual downloads are painful, especially in Chrome.

**Scope**
- Keep fast individual downloads.
- Add export cart model.
- Allow adding jobs to export cart.
- Add zip export containing:
  - resume PDF / HTML / MD
  - cover letter PDF / HTML / MD
  - for each selected job

**Acceptance criteria**
- Individual download remains fast.
- Bulk export becomes dramatically less tedious.

---

### 12. Restore and redesign theme editor as a dedicated panel
**Problem**  
Theme editing is incomplete/broken; palette controls disappeared, and PDF export is effectively hardcoded around the blue theme.

**Scope**
- Restore color palette controls.
- Create dedicated theme editor panel.
- Show live resume + cover letter previews.
- Add font controls.
- Fix theme-aware PDF export.
- Nice-to-have: palette extraction from company site/logo.

**Acceptance criteria**
- Non-blue themes export correctly.
- Theme editing is visible and usable.
- User can tune colors/fonts live.

---

### 13. Improve handling of personal projects in generated content
**Problem**  
Personal projects are often merged awkwardly or shoved into the wrong section.

**Scope**
- Add explicit support for personal-project sections.
- Improve generation rules so projects are not collapsed into one blob or oddly formatted bullets.
- Make section placement/formating configurable.

**Acceptance criteria**
- Personal projects can consistently appear in their own section.
- Output better matches user preference.

---

## Suggested labels
- epic
- workflow
- ux
- frontend
- editor
- preview
- prompting
- exports
- interview-prep
- integration
- theme
- generation

## Suggested milestones
### Milestone 1: Core usability
- Job list redesign
- Structured editor redesign
- Safe format switching
- Preview expansion
- Queue UX

### Milestone 2: Integrated workflow
- Prompt management
- Common questions
- Interview prep workspace
- Huntr/job page linking

### Milestone 3: Finishing and polish
- Export cart
- Theme editor
- Personal project handling
- Writing style controls
