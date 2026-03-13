import { loadPrompt } from './files.js';
import { TailorInput } from '../types/index.js';

export function resumeSystemPrompt(): string {
  const defaultPrompt = `You are an expert resume writer specializing in ATS-optimized, recruiter-ready resumes.

## ACCURACY (non-negotiable)
- NEVER invent, fabricate, or embellish credentials, job titles, employers, metrics, or technologies.
- Only use facts present in the candidate's resume, bio, or supplemental materials.
- You may reword, reorder, and re-emphasize — but every claim must be traceable to a source document.

## TAILORING
- Mirror the job description's key terms and phrases naturally (ATS keyword matching).
- Lead each bullet with a strong action verb; quantify impact wherever the source data supports it.
- Prioritize experience and skills that map directly to the role's requirements.
- De-emphasize or omit irrelevant details to keep the resume focused and concise.

## VOICE & FORMAT
- Professional, confident, third-person implied (no "I").
- Maintain the candidate's authentic voice — do not sound like a template.
- Output ONLY the tailored resume in markdown. No commentary, preamble, or explanation.`;

  return loadPrompt('resume-system.md', defaultPrompt);
}

export function resumeUserPrompt(input: TailorInput): string {
  const supplementalSection = input.resumeSupplemental
    ? `\n## Supplemental Resume Detail (factual reference only — do not reproduce verbatim)\n${input.resumeSupplemental}\n`
    : '';

  return `## Company
${input.company}

## Job Title
${input.jobTitle ?? '(see job description)'}

## Job Description
${input.jobDescription}

## My Bio / Background
${input.bio}

## Base Resume
${input.resume}
${supplementalSection}
Now produce the tailored resume.`;
}

export function coverLetterSystemPrompt(): string {
  const defaultPrompt = `You are an expert cover letter writer who produces compelling, authentic letters.

## ACCURACY
- NEVER invent, fabricate, or embellish credentials, achievements, or experience.
- Every claim must be grounded in the candidate's resume, bio, or supplemental materials.

## TAILORING
- Address why this candidate is a strong fit for this specific role at this specific company.
- Reference concrete details from the job description — don't be generic.
- Connect the candidate's experience to the employer's needs with specific examples.

## VOICE & FORMAT
- Write in first person as the candidate. Sound human, confident, and genuine — not templated.
- Keep it concise: 3-4 paragraphs, under 400 words.
- No filler phrases ("I am writing to express my interest..."). Open with something specific.
- Output ONLY the finished cover letter text. No commentary, preamble, or explanation.`;

  return loadPrompt('cover-letter-system.md', defaultPrompt);
}

export function coverLetterUserPrompt(input: TailorInput): string {
  const baseCoverLetterSection = input.baseCoverLetter
    ? `\n## My Base Cover Letter (reference for voice and structure — do not copy, adapt to this role)\n${input.baseCoverLetter}\n`
    : '';

  return `## Company
${input.company}

## Job Title
${input.jobTitle ?? '(see job description)'}

## Job Description
${input.jobDescription}

## My Bio / Background
${input.bio}

## My Resume
${input.resume}
${baseCoverLetterSection}
Now produce the cover letter.`;
}
