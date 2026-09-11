import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const DATA_FILE = path.join(REPO_ROOT, 'data', 'prompt-library.json');
const GALLERY_FILE = path.join(REPO_ROOT, 'docs', 'gallery.md');
const GALLERY_EN_FILE = path.join(REPO_ROOT, 'docs', 'gallery.en.md');
const TEMPLATES_FILE = path.join(REPO_ROOT, 'docs', 'templates.md');
const TEMPLATES_EN_FILE = path.join(REPO_ROOT, 'docs', 'templates.en.md');

interface LocalizedText {
  zh: string;
  en: string;
}

interface VariableLabel {
  id: string;
  zh: string;
  en: string;
  description: LocalizedText;
  cover_value?: LocalizedText;
}

interface CatalogCase {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  taxonomy: Record<string, string[]>;
  prompt: { variable_labels: VariableLabel[]; text: LocalizedText };
  preview: string | null;
  path: string;
}

interface CatalogTemplate {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  taxonomy: Record<string, string[]>;
  variable_labels: VariableLabel[];
  prompt: LocalizedText;
  checklist: { zh: string[]; en: string[] };
  pitfalls: { zh: string[]; en: string[] };
}

interface CatalogData {
  counts: { cases: number; templates: number };
  cases: CatalogCase[];
  templates: CatalogTemplate[];
}

const CATEGORY_ORDER = [
  'ui-interface',
  'infographic',
  'poster-editorial',
  'product-commerce',
  'brand-identity',
  'architecture-space',
  'portrait-character',
  'avatar-expression',
  'aigc-creation',
  'comic-drama',
  'scene-storytelling',
  'illustration-art',
  'document-publishing',
  'educational-visual',
];

const CATEGORY_LABELS: Record<string, string> = {
  'ui-interface': '🧩 UI 与界面',
  infographic: '📊 图表与信息可视化',
  'poster-editorial': '📰 海报与编辑设计',
  'product-commerce': '🛍️ 商品与电商视觉',
  'brand-identity': '🏷️ 品牌与视觉识别',
  'architecture-space': '🏛️ 建筑与空间',
  'portrait-character': '🧍 人像与角色',
  'avatar-expression': '😀 头像与表情',
  'aigc-creation': '⚡ AICG 游戏与动漫',
  'comic-drama': '🎞️ 漫剧关键帧',
  'scene-storytelling': '🎬 场景与叙事',
  'illustration-art': '🎨 插画与艺术实验',
  'document-publishing': '📚 文档与出版',
  'educational-visual': '🧠 教育与知识视觉',
};

const CATEGORY_LABELS_EN: Record<string, string> = {
  'ui-interface': '🧩 UI & Interfaces',
  infographic: '📊 Charts & Infographics',
  'poster-editorial': '📰 Posters & Editorial',
  'product-commerce': '🛍️ Products & Commerce',
  'brand-identity': '🏷️ Brand & Identity',
  'architecture-space': '🏛️ Architecture & Spaces',
  'portrait-character': '🧍 Portraits & Characters',
  'avatar-expression': '😀 Avatars & Expressions',
  'aigc-creation': '⚡ AIGC Games & Anime',
  'comic-drama': '🎞️ Comic Drama Keyframes',
  'scene-storytelling': '🎬 Scenes & Storytelling',
  'illustration-art': '🎨 Illustration & Art',
  'document-publishing': '📚 Documents & Publishing',
  'educational-visual': '🧠 Education & Knowledge Visuals',
};

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function anchor(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

function groupByPrimaryDeliverable<T extends { taxonomy: Record<string, string[]> }>(entries: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const category = entry.taxonomy.deliverable?.[0] ?? 'other';
    groups.set(category, [...(groups.get(category) ?? []), entry]);
  }
  return groups;
}

function galleryCard(entry: CatalogCase): string {
  const promptPath = `../${entry.path}/prompt.md`;
  const imagePath = entry.preview ? `../site/public/${entry.preview}` : '';
  const models = entry.taxonomy.model.join(' · ');
  const workflow = entry.taxonomy.workflow.join(' · ');
  return `<td width="33%" valign="top" align="center">\n<a href="${promptPath}"><img src="${imagePath}" alt="${entry.title.zh}" width="240"></a><br>\n<strong>${entry.title.zh}</strong><br>\n<sub>${entry.summary.zh}</sub><br>\n<sub>${models} · ${workflow}</sub><br>\n<a href="${promptPath}">查看提示词与变量</a>\n</td>`;
}

function buildGallery(data: CatalogData): string {
  const groups = groupByPrimaryDeliverable(data.cases);
  const navigation = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category) => `- [${CATEGORY_LABELS[category]}（${groups.get(category)!.length}）](#${anchor(category)})`)
    .join('\n');
  const sections = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category) => {
      const entries = groups.get(category)!;
      const rows: string[] = [];
      for (let index = 0; index < entries.length; index += 3) {
        const cells = entries.slice(index, index + 3).map(galleryCard);
        while (cells.length < 3) cells.push('<td width="33%"></td>');
        rows.push(`<tr>\n${cells.join('\n')}\n</tr>`);
      }
      return `<a id="${anchor(category)}"></a>\n\n## ${CATEGORY_LABELS[category]}\n\n> ${entries.length} 个案例；点击封面进入对应提示词文件。\n\n<table>\n${rows.join('\n')}\n</table>\n\n[返回分类导航](#分类导航)`;
    })
    .join('\n\n---\n\n');
  return `<!-- Generated by scripts/generate-docs.ts. Do not edit manually. -->\n\n# 案例画廊\n\n[返回项目首页](../README.md) · [English](gallery.en.md) · [工业模板](templates.md) · [在线浏览](https://hongforge.github.io/image-prompt-atlas/)\n\n这里展示 ${data.counts.cases} 个原创案例。封面用于快速判断视觉方向，案例文件提供完整变量、对应封面值、生产级提示词与限制说明。\n\n## 分类导航\n\n${navigation}\n\n---\n\n${sections}\n`;
}

function galleryCardEn(entry: CatalogCase): string {
  const promptPath = `../${entry.path}/prompt.md`;
  const imagePath = entry.preview ? `../site/public/${entry.preview}` : '';
  const models = entry.taxonomy.model.join(' · ');
  const workflow = entry.taxonomy.workflow.join(' · ');
  return `<td width="33%" valign="top" align="center">\n<a href="${promptPath}"><img src="${imagePath}" alt="${entry.title.en}" width="240"></a><br>\n<strong>${entry.title.en}</strong><br>\n<sub>${entry.summary.en}</sub><br>\n<sub>${models} · ${workflow}</sub><br>\n<a href="${promptPath}">Open prompt and variables</a>\n</td>`;
}

function buildGalleryEn(data: CatalogData): string {
  const groups = groupByPrimaryDeliverable(data.cases);
  const navigation = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category) => `- [${CATEGORY_LABELS_EN[category]} (${groups.get(category)!.length})](#${anchor(category)})`)
    .join('\n');
  const sections = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category) => {
      const entries = groups.get(category)!;
      const rows: string[] = [];
      for (let index = 0; index < entries.length; index += 3) {
        const cells = entries.slice(index, index + 3).map(galleryCardEn);
        while (cells.length < 3) cells.push('<td width="33%"></td>');
        rows.push(`<tr>\n${cells.join('\n')}\n</tr>`);
      }
      return `<a id="${anchor(category)}"></a>\n\n## ${CATEGORY_LABELS_EN[category]}\n\n> ${entries.length} cases. Select a cover to open its prompt file.\n\n<table>\n${rows.join('\n')}\n</table>\n\n[Back to category navigation](#category-navigation)`;
    })
    .join('\n\n---\n\n');
  return `<!-- Generated by scripts/generate-docs.ts. Do not edit manually. -->\n\n# Case Gallery\n\n[Project home](../README.en.md) · [中文](gallery.md) · [Industrial templates](templates.en.md) · [Live gallery](https://hongforge.github.io/image-prompt-atlas/)\n\nBrowse ${data.counts.cases} original cases. Covers communicate the visual direction; each case file contains complete variables, cover-specific values, a production prompt, and limitations.\n\n## Category navigation\n\n${navigation}\n\n---\n\n${sections}\n`;
}

function buildTemplateEntry(entry: CatalogTemplate): string {
  const fields = entry.variable_labels
    .map((variable) => `| \`{{${variable.id}}}\` | ${escapeTable(variable.zh)} | ${escapeTable(variable.description.zh)} |`)
    .join('\n');
  const taxonomy = [...entry.taxonomy.deliverable, ...entry.taxonomy.workflow, ...entry.taxonomy.model].join(' · ');
  return `<a id="template-${anchor(entry.id)}"></a>\n\n### ${entry.title.zh}\n\n${entry.summary.zh}\n\n**适用范围：** ${taxonomy}\n\n#### 必填需求字段\n\n| 变量 | 中文名称 | 填写要求 |\n| --- | --- | --- |\n${fields}\n\n<details>\n<summary><strong>展开生产级中文模板</strong></summary>\n\n\`\`\`text\n${entry.prompt.zh}\n\`\`\`\n\n</details>\n\n#### 验收检查\n\n${entry.checklist.zh.map((item) => `- ${item}`).join('\n')}\n\n#### 常见失败\n\n${entry.pitfalls.zh.map((item) => `- ${item}`).join('\n')}`;
}

function buildTemplates(data: CatalogData): string {
  const groups = groupByPrimaryDeliverable(data.templates);
  const navigation = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category) => `- [${CATEGORY_LABELS[category]}（${groups.get(category)!.length}）](#templates-${anchor(category)})`)
    .join('\n');
  const sections = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category) => `<a id="templates-${anchor(category)}"></a>\n\n## ${CATEGORY_LABELS[category]}\n\n${groups.get(category)!.map(buildTemplateEntry).join('\n\n---\n\n')}`)
    .join('\n\n---\n\n');
  return `<!-- Generated by scripts/generate-docs.ts. Do not edit manually. -->\n\n# 工业级提示词模板\n\n[返回项目首页](../README.md) · [English](templates.en.md) · [案例画廊](gallery.md) · [模板设计规范](template-system.md)\n\n这里不是简单的风格词集合。${data.counts.templates} 套模板均包含必填字段、需求解析协议、输出契约、制作结构、质量门槛和失败检查，适合人工填写，也适合 Agent 调用。\n\n## 使用流程\n\n1. 从案例画廊选择视觉方向。\n2. 选择交付类型匹配的模板。\n3. 完整填写所有变量；缺失信息先确认，不让模型自行猜测。\n4. 复制生产级模板，按验收检查复核结果。\n\n## 模板导航\n\n${navigation}\n\n---\n\n${sections}\n`;
}

function buildTemplateEntryEn(entry: CatalogTemplate): string {
  const fields = entry.variable_labels
    .map((variable) => `| \`{{${variable.id}}}\` | ${escapeTable(variable.en)} | ${escapeTable(variable.description.en)} |`)
    .join('\n');
  const taxonomy = [...entry.taxonomy.deliverable, ...entry.taxonomy.workflow, ...entry.taxonomy.model].join(' · ');
  return `<a id="template-${anchor(entry.id)}"></a>\n\n### ${entry.title.en}\n\n${entry.summary.en}\n\n**Scope:** ${taxonomy}\n\n#### Required brief fields\n\n| Variable | Label | Completion rule |\n| --- | --- | --- |\n${fields}\n\n<details>\n<summary><strong>Open the complete production template</strong></summary>\n\n\`\`\`text\n${entry.prompt.en}\n\`\`\`\n\n</details>\n\n#### Acceptance checks\n\n${entry.checklist.en.map((item) => `- ${item}`).join('\n')}\n\n#### Common failures\n\n${entry.pitfalls.en.map((item) => `- ${item}`).join('\n')}`;
}

function buildTemplatesEn(data: CatalogData): string {
  const groups = groupByPrimaryDeliverable(data.templates);
  const navigation = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category) => `- [${CATEGORY_LABELS_EN[category]} (${groups.get(category)!.length})](#templates-${anchor(category)})`)
    .join('\n');
  const sections = CATEGORY_ORDER
    .filter((category) => groups.has(category))
    .map((category) => `<a id="templates-${anchor(category)}"></a>\n\n## ${CATEGORY_LABELS_EN[category]}\n\n${groups.get(category)!.map(buildTemplateEntryEn).join('\n\n---\n\n')}`)
    .join('\n\n---\n\n');
  return `<!-- Generated by scripts/generate-docs.ts. Do not edit manually. -->\n\n# Industrial Prompt Templates\n\n[Project home](../README.en.md) · [中文](templates.md) · [Case gallery](gallery.en.md) · [Template design contract](template-system.md)\n\nThese are not style-word collections. All ${data.counts.templates} templates include required brief fields, a resolution protocol, output contract, production structure, quality gates, and failure checks for both people and agents.\n\n## Workflow\n\n1. Select a visual direction from the case gallery.\n2. Choose a template with a compatible deliverable.\n3. Complete every variable; confirm missing information instead of guessing.\n4. Copy the production template and review the result against its acceptance checks.\n\n## Template navigation\n\n${navigation}\n\n---\n\n${sections}\n`;
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as CatalogData;
fs.mkdirSync(path.dirname(GALLERY_FILE), { recursive: true });
fs.writeFileSync(GALLERY_FILE, buildGallery(data));
fs.writeFileSync(GALLERY_EN_FILE, buildGalleryEn(data));
fs.writeFileSync(TEMPLATES_FILE, buildTemplates(data));
fs.writeFileSync(TEMPLATES_EN_FILE, buildTemplatesEn(data));
console.log(`Generated bilingual GitHub galleries and template guides → docs/gallery*.md, docs/templates*.md`);
