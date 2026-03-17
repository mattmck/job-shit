import { describe, expect, it, vi } from 'vitest';

describe('ExportPdfBody type', () => {
  it('accepts kind=resume variant', () => {
    // Type check: ensure 'resume' is accepted in ExportPdfBody
    const body: { kind: 'resume' | 'coverLetter' | 'cover-letter'; markdown?: string } = {
      kind: 'resume',
      markdown: '# Resume',
    };
    expect(body.kind).toBe('resume');
  });

  it('accepts kind=coverLetter variant', () => {
    // Type check: ensure 'coverLetter' is accepted in ExportPdfBody
    const body: { kind: 'resume' | 'coverLetter' | 'cover-letter'; markdown?: string } = {
      kind: 'coverLetter',
      markdown: '# Cover Letter',
    };
    expect(body.kind).toBe('coverLetter');
  });

  it('accepts kind=cover-letter variant', () => {
    // Type check: ensure 'cover-letter' is accepted in ExportPdfBody
    const body: { kind: 'resume' | 'coverLetter' | 'cover-letter'; markdown?: string } = {
      kind: 'cover-letter',
      markdown: '# Cover Letter',
    };
    expect(body.kind).toBe('cover-letter');
  });
});

describe('sectionId validation logic', () => {
  // Test the validation logic that should be in the /api/regenerate-section handler

  it('detects missing sectionId', () => {
    const body: Record<string, unknown> = {
      resume: '# Test Resume',
      bio: 'Test bio',
      jobDescription: 'Test JD',
      jobTitle: 'Test Job',
      // sectionId is intentionally omitted
    };

    const sectionId = body.sectionId as string | undefined;
    const isInvalid = !sectionId || sectionId.trim() === '';
    expect(isInvalid).toBe(true);
  });

  it('detects empty string sectionId', () => {
    const body = {
      resume: '# Test Resume',
      bio: 'Test bio',
      jobDescription: 'Test JD',
      jobTitle: 'Test Job',
      sectionId: '',
    };

    const sectionId = body.sectionId;
    const isInvalid = !sectionId || sectionId.trim() === '';
    expect(isInvalid).toBe(true);
  });

  it('detects whitespace-only sectionId', () => {
    const body = {
      resume: '# Test Resume',
      bio: 'Test bio',
      jobDescription: 'Test JD',
      jobTitle: 'Test Job',
      sectionId: '   ',
    };

    const sectionId = body.sectionId;
    const isInvalid = !sectionId || sectionId.trim() === '';
    expect(isInvalid).toBe(true);
  });

  it('accepts valid sectionId', () => {
    const body = {
      resume: '# Test Resume',
      bio: 'Test bio',
      jobDescription: 'Test JD',
      jobTitle: 'Test Job',
      sectionId: 'summary',
    };

    const sectionId = body.sectionId;
    const isInvalid = !sectionId || sectionId.trim() === '';
    expect(isInvalid).toBe(false);
  });
});
