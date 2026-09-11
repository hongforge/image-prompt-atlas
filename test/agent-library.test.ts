import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './helpers/paths.js';

type AgentCatalog = {
  schema_version: number;
  project: string;
  counts: { cases: number; templates: number };
  cases: Array<{ id: string; prompt: { variable_labels: Array<{ id: string; zh: string; en: string; description: { zh: string; en: string }; cover_value?: { zh: string; en: string } }>; text: { zh: string; en: string } } }>;
  templates: Array<{ id: string; variable_labels: Array<{ id: string; zh: string; en: string; description: { zh: string; en: string } }>; prompt: { zh: string; en: string }; checklist: { zh: string[]; en: string[] }; pitfalls: { zh: string[]; en: string[] }; execution: { zh: { production_sequence: string[]; review_order: string[] }; en: { production_sequence: string[]; review_order: string[] } } }>;
};

const dataFile = path.join(REPO_ROOT, 'data', 'prompt-library.json');

describe('agent-ready prompt library data', () => {
  it('exports the same reusable catalog as a stable JSON artifact', () => {
    expect(fs.existsSync(dataFile)).toBe(true);
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8')) as AgentCatalog;
    expect(data.schema_version).toBe(1);
    expect(data.project).toBe('image-prompt-atlas');
    expect(data.counts).toEqual({ cases: 193, templates: 30 });
    expect(data.cases).toHaveLength(data.counts.cases);
    expect(data.templates).toHaveLength(data.counts.templates);
    expect(data.cases.every((entry) => entry.prompt.text.zh.length > 0 && entry.prompt.text.en.length > 0)).toBe(true);
    expect(data.templates.every((entry) => entry.prompt.zh.length > 0 && entry.prompt.en.length > 0)).toBe(true);
    expect(data.cases.every((entry) => entry.prompt.variable_labels.every((variable) => variable.id && variable.zh && variable.en && variable.description.zh && variable.description.en))).toBe(true);
    expect(data.templates.every((entry) => entry.variable_labels.every((variable) => variable.id && variable.zh && variable.en && variable.description.zh && variable.description.en))).toBe(true);
    expect(data.cases.every((entry) => entry.prompt.variable_labels.every((variable) => variable.cover_value?.zh && variable.cover_value?.en))).toBe(true);
    expect(data.templates.every((entry) => entry.execution.zh.production_sequence.length === 5 && entry.execution.en.review_order.length === 5)).toBe(true);
    expect(data.cases.every((entry) => entry.prompt.text.zh.includes('## 角色') && entry.prompt.text.en.includes('## Production protocol'))).toBe(true);
    expect(data.templates.every((entry) => entry.prompt.zh.includes('## 必填需求字段') && entry.prompt.en.includes('## Required brief fields'))).toBe(true);
    expect(data.templates.every((entry) => entry.checklist.zh.length > 1 && entry.checklist.en.length > 1)).toBe(true);
    expect(data.templates.every((entry) => entry.pitfalls.zh.length > 1 && entry.pitfalls.en.length > 1)).toBe(true);
  });

  it('documents how agents select shared catalog assets', () => {
    const skill = fs.readFileSync(path.join(REPO_ROOT, 'skills', 'image-prompt-atlas', 'SKILL.md'), 'utf8');
    expect(skill).toContain('data/prompt-library.json');
    expect(skill).toContain('evaluation.status');
    expect(skill).toContain('skills/img2prompt');
  });
});

describe('GitHub-native documentation', () => {
  it.each(['docs/gallery.md', 'docs/gallery.en.md'])('%s contains every visual case', (relativePath) => {
    const body = fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
    expect(body.match(/<img src=/g)).toHaveLength(193);
    expect(body).toContain('scripts/generate-docs.ts');
  });

  it.each(['docs/templates.md', 'docs/templates.en.md'])('%s contains every industrial template', (relativePath) => {
    const body = fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
    expect(body.match(/^<a id="template-/gm)).toHaveLength(30);
    expect(body).toContain('scripts/generate-docs.ts');
  });
});
