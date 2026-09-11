---
name: image-prompt-atlas
description: Use when a user needs to find, adapt, or assemble AI image prompts from Image Prompt Atlas's reviewed cases and industrial templates. Do not use for reverse-engineering a supplied image; use img2prompt instead.
---

# Image Prompt Atlas

Use the generated catalog at `data/prompt-library.json` as the source of truth. It contains the same original cases and templates as the website, plus cover values, variables, model compatibility, evaluation status, and limitations.

## Select the right asset

1. Start from the requested **deliverable**, then refine by workflow, capability, and target model.
2. Return 1–3 matching cases with their title, why they match, cover values, variables, and limitations.
3. When the user needs a new brief rather than an example, pair the best case with one compatible industrial template.
4. Preserve each `{{variables}}` ID exactly when adapting a prompt. Use `variable_labels.zh` or `variable_labels.en` to explain its meaning in the user's language; only fill the ID after collecting the user's brief.

## Quality rules

- Treat `evaluation.status: draft` as an unverified starting point; never claim it is tested output.
- Include any listed limitations when they materially affect the request.
- Prefer `universal` prompts unless the user explicitly names a target model.

## Response shape

For a recommendation, use this compact structure:

```markdown
### 推荐案例
- `case-id` — why it matches; compatible models; verification status.

### 推荐模板
- `template-id` — variables to collect before generating.

### 可直接使用的提示词
<adapted prompt with variables resolved or clearly marked>
```

Use `skills/img2prompt` when the user supplies a reference image and asks to reproduce or analyze it. This skill selects reusable library assets; it does not infer an image's visual specification.
