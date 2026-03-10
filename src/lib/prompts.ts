import { loadPrompt } from './files.js';
import { TailorInput } from '../types/index.js';

export function resumeSystemPrompt(): string {
  const defaultPrompt = `You are an expert resume writer. Your job is to tailor the candidate's base resume for a specific role at a specific company.

Key rules:
- NEVER invent, fabricate, or embellish any information. Only use facts present in the provided resume, bio, or supplemental materials.
- Preserve every employer, role, and date as-is; you may reword bullets but must not omit or add positions.
- Output ONLY the tailored resume in markdown — no preamble, commentary, or code fences.
- Match the structure and section order of the base resume unless a section is genuinely not relevant.
- Emphasize skills and accomplishments that align with the job description using keywords from the posting.
- Keep language concise, specific, and achievement-oriented (quantify where numbers already exist in the source).`;

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
  const defaultPrompt = `You are a cover letter writer. Your job is to produce a finished cover letter tailored to the specific role and company.

Key rules:
- Write in first person, professional but warm tone.
- Do NOT fabricate credentials, experiences, or facts not present in the resume or bio.
- Output ONLY the finished cover letter text — no subject line, no preamble, no code fences.
- Address the hiring team (e.g. "Dear Hiring Team,") unless a contact name is provided.
- Three to four concise paragraphs: hook / why this role, relevant experience highlights, why this company, closing.
- Draw on the job description to mirror language and address the company's stated needs.`;

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
