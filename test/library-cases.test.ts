import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { TAXONOMY, validateCase } from '../src/validate-case.js';
import { REPO_ROOT } from './helpers/paths.js';

const CASES_DIR = path.join(REPO_ROOT, 'library', 'cases');
const CASE_IMAGES_DIR = path.join(REPO_ROOT, 'site', 'public', 'case-images');

const caseDirs = fs.readdirSync(CASES_DIR, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(entry.parentPath, entry.name))
  .filter((directory) => fs.existsSync(path.join(directory, 'case.yaml')));

describe('prompt library cases', () => {
  it('keeps the public taxonomy file aligned with the validator', () => {
    const taxonomy = parse(fs.readFileSync(path.join(REPO_ROOT, 'library', 'taxonomy.yaml'), 'utf8'));
    expect(taxonomy.version).toBe(1);
    for (const [dimension, values] of Object.entries(TAXONOMY)) {
      expect(taxonomy.dimensions[dimension].values).toEqual(values);
    }
  });

  it('ships 163 distinct cases across deliverables', () => {
    expect(caseDirs.length).toBe(163);
  });

  it.each(caseDirs)('%s conforms to the case contract', (directory) => {
    const file = path.join(directory, 'case.yaml');
    const doc = parse(fs.readFileSync(file, 'utf8'));
    expect(validateCase(doc)).toEqual([]);

    const promptFile = path.join(directory, 'prompt.md');
    expect(fs.existsSync(promptFile), `${directory} is missing prompt.md`).toBe(true);
    expect(fs.readFileSync(promptFile, 'utf8')).toContain('## Prompt');
  });

  it('uses globally unique case identifiers', () => {
    const ids = caseDirs.map((directory) => parse(fs.readFileSync(path.join(directory, 'case.yaml'), 'utf8')).id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides one generated preview image for every case', () => {
    for (const directory of caseDirs) {
      const { id } = parse(fs.readFileSync(path.join(directory, 'case.yaml'), 'utf8'));
      expect(fs.existsSync(path.join(CASE_IMAGES_DIR, `${id}.png`)), `${id} is missing a preview image`).toBe(true);
    }
  });
});
