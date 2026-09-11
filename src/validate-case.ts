export const TAXONOMY = {
  deliverable: [
    'ui-interface', 'infographic', 'poster-editorial', 'brand-identity',
    'product-commerce', 'architecture-space', 'portrait-character',
    'scene-storytelling', 'comic-drama', 'avatar-expression', 'aigc-creation',
    'film-storyboard', 'game-asset', 'social-content', 'surface-pattern',
    'illustration-art', 'document-publishing', 'educational-visual',
  ],
  medium: ['photography', '3d-render', 'vector-graphic', 'illustration', 'mixed-media'],
  workflow: ['text-to-image', 'image-to-image', 'inpainting', 'compositing', 'series-consistency'],
  capability: [
    'text-rendering', 'layout-hierarchy', 'subject-consistency', 'product-fidelity',
    'material-lighting', 'spatial-reasoning', 'data-visualization', 'instruction-following',
  ],
  model: ['universal', 'gpt-image', 'nano-banana', 'midjourney', 'stable-diffusion'],
} as const;

const SOURCE_KINDS = ['original'];
const REFERENCE_LICENSES = ['none'];
const STATUSES = ['draft', 'verified', 'archived'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateStringArray(
  value: unknown,
  path: string,
  errors: string[],
  options: { min?: number; allowed?: readonly string[] } = {},
): void {
  if (!Array.isArray(value) || value.some((item) => !isNonBlankString(item))) {
    errors.push(`${path}: must be an array of non-empty strings`);
    return;
  }
  if (options.min !== undefined && value.length < options.min) {
    errors.push(`${path}: must contain at least ${options.min} value(s)`);
  }
  if (options.allowed) {
    for (const item of value) {
      if (!options.allowed.includes(item)) errors.push(`${path}: unknown value ${JSON.stringify(item)}`);
    }
  }
}

export function validateCase(doc: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(doc)) return ['case document must be an object'];

  if (!isNonBlankString(doc.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.id)) {
    errors.push('id: must be lowercase kebab-case');
  }
  for (const field of ['title', 'summary']) {
    if (!isNonBlankString(doc[field])) errors.push(`${field}: must be a non-empty string`);
  }

  if (!isObject(doc.taxonomy)) {
    errors.push('taxonomy: must be an object');
  } else {
    for (const [dimension, allowed] of Object.entries(TAXONOMY)) {
      validateStringArray(doc.taxonomy[dimension], `taxonomy.${dimension}`, errors, { min: 1, allowed });
    }
  }
  validateStringArray(doc.tags, 'tags', errors, { min: 3 });

  if (!isObject(doc.license)) {
    errors.push('license: must be an object');
  } else {
    if (!isNonBlankString(doc.license.prompt)) errors.push('license.prompt: must be a non-empty string');
    if (!isNonBlankString(doc.license.reference) || !REFERENCE_LICENSES.includes(doc.license.reference)) {
      errors.push(`license.reference: must be one of ${REFERENCE_LICENSES.join(', ')}`);
    }
  }

  if (!isObject(doc.source)) {
    errors.push('source: must be an object');
  } else {
    if (!isNonBlankString(doc.source.kind) || !SOURCE_KINDS.includes(doc.source.kind)) {
      errors.push(`source.kind: must be one of ${SOURCE_KINDS.join(', ')}`);
    }
    if (!isNonBlankString(doc.source.rights_note)) errors.push('source.rights_note: must be a non-empty string');
    if (doc.source.kind !== 'original' && !isNonBlankString(doc.source.url)) {
      errors.push('source.url: is required for non-original sources');
    }
  }

  if (!isObject(doc.prompt)) {
    errors.push('prompt: must be an object');
  } else {
    if (!isNonBlankString(doc.prompt.language)) errors.push('prompt.language: must be a non-empty string');
    validateStringArray(doc.prompt.variables, 'prompt.variables', errors);
    if (Array.isArray(doc.prompt.variables)) {
      for (const variable of doc.prompt.variables) {
        if (isNonBlankString(variable) && !/^[a-z][a-z0-9_]*$/.test(variable)) {
          errors.push(`prompt.variables: ${JSON.stringify(variable)} must be snake_case`);
        }
      }
    }
    if (doc.prompt.cover_values !== undefined) {
      if (!isObject(doc.prompt.cover_values)) {
        errors.push('prompt.cover_values: must be an object');
      } else if (Array.isArray(doc.prompt.variables)) {
        for (const variable of doc.prompt.variables) {
          const value = doc.prompt.cover_values[variable];
          if (!isObject(value) || !isNonBlankString(value.zh) || !isNonBlankString(value.en)) {
            errors.push(`prompt.cover_values.${variable}: must provide non-empty zh and en values`);
          }
        }
        for (const variable of Object.keys(doc.prompt.cover_values)) {
          if (!doc.prompt.variables.includes(variable)) errors.push(`prompt.cover_values.${variable}: is not declared in prompt.variables`);
        }
      }
    }
  }

  if (!isObject(doc.evaluation)) {
    errors.push('evaluation: must be an object');
  } else {
    if (!isNonBlankString(doc.evaluation.status) || !STATUSES.includes(doc.evaluation.status)) {
      errors.push(`evaluation.status: must be one of ${STATUSES.join(', ')}`);
    }
    validateStringArray(doc.evaluation.tested_models, 'evaluation.tested_models', errors, {
      allowed: TAXONOMY.model,
    });
    validateStringArray(doc.evaluation.limitations, 'evaluation.limitations', errors);
    if (doc.evaluation.status === 'verified') {
      if (!Array.isArray(doc.evaluation.tested_models) || doc.evaluation.tested_models.length === 0) {
        errors.push('evaluation.tested_models: verified cases require at least one model');
      }
      if (!isNonBlankString(doc.evaluation.last_verified) || !/^\d{4}-\d{2}-\d{2}$/.test(doc.evaluation.last_verified)) {
        errors.push('evaluation.last_verified: verified cases require a YYYY-MM-DD date');
      }
    }
  }
  return errors;
}
