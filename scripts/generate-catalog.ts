import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const REPO_ROOT = process.cwd();
const CASES_DIR = path.join(REPO_ROOT, 'library', 'cases');
const TEMPLATES_FILE = path.join(REPO_ROOT, 'library', 'templates', 'catalog.yaml');
const OUTPUT_FILE = path.join(REPO_ROOT, 'site', 'src', 'catalog.generated.ts');
const AGENT_DATA_FILE = path.join(REPO_ROOT, 'data', 'prompt-library.json');

interface CaseDocument {
  id: string;
  title: string;
  summary: string;
  taxonomy: Record<string, string[]>;
  tags: string[];
  license?: unknown;
  source?: unknown;
  prompt: { language: string; variables: string[]; cover_values?: Record<string, { zh: string; en: string }> };
  evaluation: { status: string; tested_models: string[]; last_verified: string | null; limitations: string[] };
}

interface TemplateDocument {
  id: string;
  title: string;
  summary: string;
  taxonomy: Record<string, string[]>;
  variables: string[];
  prompt: string;
  checklist: string[];
  pitfalls: string[];
}

type VariableLabel = { id: string; zh: string; en: string; description: { zh: string; en: string }; cover_value?: { zh: string; en: string } };

const VARIABLE_LABEL_OVERRIDES: Record<string, string> = {
  character_archetype: '角色原型',
  character_role: '角色定位',
  value_proposition: '价值主张',
  visual_metaphor: '视觉隐喻',
  character_identity: '人物身份锚点',
  chase_location: '追逐地点',
  pursuing_threat: '追击威胁',
  cinematic_palette: '电影色板',
  historical_setting: '历史场景设定',
  narrative_moment: '叙事时刻',
  production_details: '制作设计细节',
  light_weather: '光线与天气',
  prop_function: '道具功能',
  material_stack: '材质组合',
  wear_level: '磨损等级',
  rarity_palette: '稀有度色板',
  vehicle_role: '载具定位',
  engineering_features: '工程结构特征',
  surface_finish: '表面处理',
  environment_context: '环境语境',
  campaign_product: '宣传商品',
  motion_element: '动态元素',
  platform_safe_zone: '平台安全区',
  campaign_palette: '宣传色板',
  hero_dessert: '主角甜点',
  hospitality_setting: '待客场景',
  sensory_cues: '感官线索',
  copy_safe_zone: '文案安全区',
  motif_family: '母题系统',
  repeat_structure: '重复结构',
  print_palette: '印花色板',
  substrate: '承印材质',
  surface_family: '表面材质组',
  sample_count: '样板数量',
  material_contrast: '材质行为差异',
  lighting_setup: '布光方案',
  shot_subject: '镜头主体',
  scene_geography: '场景空间关系',
  camera_light: '摄影与光线',
  asset_identity: '资产身份',
  construction_logic: '结构逻辑',
  material_presentation: '材质呈现',
  campaign_subject: '传播主体',
  visual_system: '视觉系统',
  mobile_layout: '移动端版式',
  motif_system: '母题系统',
  surface_behavior: '表面行为',
  production_constraints: '生产约束',
  package_object: '包装对象',
  structural_system: '结构系统',
  material_graphics: '材料与图形',
  hero_food: '主角食物',
  serving_context: '呈现环境',
  food_styling: '食物造型',
  fashion_subject: '时尚主体',
  garment_construction: '服装结构',
  editorial_direction: '编辑方向',
};

const VARIABLE_TERMS: Record<string, string> = {
  accent: '强调', action: '行动', activity: '活动', age: '年龄', anchors: '锚点', application: '应用', audience: '受众', background: '背景', benefit: '价值', brand: '品牌', call: '行动', category: '品类', character: '角色', clue: '线索', color: '颜色', columns: '列', company: '公司', comparison: '对比', components: '部件', concept: '概念', condition: '条件', constraints: '约束', context: '场景', cover: '封面', criteria: '标准', customer: '客户', daily: '每日', data: '数据', date: '日期', decision: '决策', decisive: '决定性', delivery: '交付', design: '设计', detail: '细节', direction: '方向', directions: '方向', discipline: '专业', display: '陈列', duration: '时长', edit: '编辑', element: '元素', emotion: '情绪', energy: '能量', evaluation: '评估', event: '活动', example: '示例', feature: '卖点', features: '功能', financial: '财务', focus: '重点', format: '格式', goal: '目标', graphic: '图形', headline: '主标题', hero: '主视觉', identity: '身份', industry: '行业', interest: '兴趣', investment: '投资', issue: '期号', key: '关键', language: '语言', layout: '版式', learner: '学习者', level: '级别', light: '光线', lighting: '布光', location: '地点', material: '材质', market: '市场', medicine: '药品', metaphor: '视觉隐喻', model: '模型', mood: '氛围', name: '名称', natural: '自然', opposing: '对立', outcomes: '结果', output: '输出', package: '包装', palette: '色板', person: '人物', personality: '个性', platform: '平台', points: '要点', portfolio: '作品集', preserve: '保留', primary: '主要', problem: '问题', product: '产品', products: '产品组', prop: '道具', proof: '证据', protagonist: '主角', proposition: '价值主张', property: '房产', question: '问题', range: '范围', rate: '利率', region: '区域', relationship: '关系', relationships: '关系', report: '报告', role: '角色', safety: '安全', scale: '尺度', season: '季节', setting: '场景', shelf: '货架', signature: '标志性', silhouette: '轮廓', solution: '方案', source: '源图', space: '空间', stage: '阶段', starting: '起始', steps: '步骤', story: '故事', stream: '直播', style: '风格', subject: '主体', surface: '表面', system: '系统', target: '目标', task: '任务', team: '团队', theme: '主题', threat: '威胁', time: '时间', title: '标题', to: '', topic: '主题', top: '核心', traction: '增长数据', trip: '旅行', type: '类型', unit: '单元', unresolved: '未解', use: '使用', user: '用户', users: '用户群体', value: '价值', visual: '视觉', wardrobe: '服装', year: '年份', zone: '区域', cta: '行动按钮', saas: 'SaaS', ui: '界面', ai: 'AI', id: 'ID',
};

Object.assign(VARIABLE_TERMS, {
  expression: '表情', expressions: '表情组', sticker: '贴纸', pack: '组', app: '应用', appearance: '外观', arc: '弧线', archetype: '角色原型', area: '区域', arena: '战场', article: '文章', attack: '攻击', author: '作者', backdrop: '背景', biome: '生态环境', body: '身体', book: '书籍', boss: '首领', cabin: '小屋', car: '汽车', care: '照护', case: '案例', central: '核心', change: '改变', city: '城市', class: '职业', clinic: '诊所', cocktail: '鸡尾酒', coffee: '咖啡', combat: '战斗', community: '社群', composition: '构图', conflict: '冲突', contrast: '对比', core: '核心', costume: '服装', course: '课程', creator: '创作者', cue: '提示', cuisine: '菜系', day: '每日', description: '描述', desired: '期望', destination: '目的地', dish: '菜品', drop: '发售', edge: '边缘', emotional: '情绪', environment: '环境', equipment: '装备', era: '时代', examples: '示例', exhibit: '展览', existing: '现有', fabric: '面料', face: '脸部', faction: '阵营', family: '系列', farm: '农场', fashion: '时尚', festival: '节日', finish: '表面处理', flavor: '风味', flow: '流程', food: '食品', function: '功能', furniture: '家具', game: '游戏', garage: '车库', garment: '服装', genre: '类型', glaze: '釉色', habit: '习惯', historical: '历史', hook: '钩子', horizon: '周期', human: '人物', image: '图像', impact: '影响', ingredient: '食材', intent: '意图', interior: '室内', item: '物品', jewelry: '珠宝', landmark: '地标', landscape: '景观', layers: '层次', length: '长度', lens: '镜头', lines: '文案', loadout: '配置', loan: '贷款', magic: '魔法', main: '主体', mascot: '吉祥物', materials: '材质', math: '数学', mech: '机甲', mechanism: '机制', medium: '媒介', message: '信息', metal: '金属', metric: '指标', moment: '时刻', motif: '图案', neon: '霓虹', new: '新', newsletter: '通讯', niche: '细分领域', note: '说明', object: '对象', obstacle: '阻碍', of: '', offsite: '团建', opponent: '对手', or: '或', organization: '组织', origin: '起源', outfit: '造型', pair: '组合', pastry: '糕点', period: '时期', phenomenon: '现象', piece: '件', pilot: '驾驶员', place: '地点', planning: '规划', player: '玩家', podcast: '播客', point: '要点', positioning: '定位', premise: '前提', presentation: '呈现方式', publication: '出版物', quote: '引语', rarity: '稀有度', real: '真实', remove: '移除', render: '渲染', replacement: '替换', reporting: '报告', restaurant: '餐厅', revenue: '营收', room: '房间', rule: '规则', sales: '销售', scene: '场景', sculpture: '雕塑', sector: '领域', service: '服务', serving: '呈现', settlement: '聚落', shoe: '鞋履', size: '尺寸', species: '物种', stages: '阶段', store: '商店', structural: '结构', student: '学生', styling: '造型', support: '支持', surreal: '超现实', sustainable: '可持续', symbol: '符号', talent: '人才', tea: '茶', tone: '色调', trait: '特质', travel: '旅行', trend: '趋势', turn: '转折', values: '价值观', vehicle: '车辆', vibe: '氛围', watch: '腕表', weapon: '武器', workshop: '工作坊', world: '世界',
});

function findCaseDirectories(directory: string): string[] {
  const directories: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const currentPath = path.join(directory, entry.name);
    if (!entry.isDirectory()) continue;
    if (fs.existsSync(path.join(currentPath, 'case.yaml'))) directories.push(currentPath);
    directories.push(...findCaseDirectories(currentPath));
  }
  return directories;
}

function extractPrompt(markdown: string): string {
  const match = markdown.match(/^## Prompt\s*\n([\s\S]*?)(?=^## |\s*$)/m);
  if (!match) throw new Error('prompt.md must contain a non-empty ## Prompt section');
  return match[1].trim();
}

function includes(taxonomy: Record<string, string[]>, dimension: string, value: string): boolean {
  return taxonomy[dimension]?.includes(value) ?? false;
}

function deliverableRequirements(taxonomy: Record<string, string[]>): string[] {
  const requirements: string[] = [];
  if (includes(taxonomy, 'deliverable', 'ui-interface')) {
    requirements.push('Use a coherent product screen with a deliberate grid, one primary action, clear component states, and a realistic content density. Select 16:9 for desktop or 9:16 for mobile only when the brief specifies that platform.');
  }
  if (includes(taxonomy, 'deliverable', 'infographic') || includes(taxonomy, 'deliverable', 'educational-visual')) {
    requirements.push('Make the reading path explicit: headline, 3–5 ordered modules, concise labels, and connectors whose direction and meaning are unambiguous. Do not substitute decorative illustration for information structure.');
  }
  if (includes(taxonomy, 'deliverable', 'poster-editorial') || includes(taxonomy, 'deliverable', 'document-publishing')) {
    requirements.push('Establish one dominant visual or title zone, a secondary information zone, and intentional negative space. The composition must read at thumbnail size before adding detail.');
  }
  if (includes(taxonomy, 'deliverable', 'product-commerce')) {
    requirements.push('Preserve product geometry, material, and believable scale. Make the product the unambiguous hero; support it with controlled lighting, contact shadow, and copy-safe space rather than unrelated props.');
  }
  if (includes(taxonomy, 'deliverable', 'architecture-space')) {
    requirements.push('Keep perspective, circulation, light direction, furniture scale, and material transitions physically believable. Include human-scale cues without turning the space into a lifestyle collage.');
  }
  if (includes(taxonomy, 'deliverable', 'portrait-character')) {
    requirements.push('Keep anatomy, hands, wardrobe logic, and character-defining features consistent. Direct pose, expression, lens perspective, and background so they all support one identity.');
  }
  if (includes(taxonomy, 'deliverable', 'scene-storytelling')) {
    requirements.push('Make the narrative beat legible through foreground, midground, background, and a clear focal action. Maintain continuity of subject, props, and world rules across any sequence.');
  }
  if (includes(taxonomy, 'deliverable', 'comic-drama')) {
    requirements.push('Build one vertical 9:16 short-form drama keyframe with an immediately readable emotional beat, a clear protagonist, and one visual hook for the episode. Keep character design, costume anchors, setting rules, and lighting continuity stable across the series; do not add unrequested dialogue, subtitles, platform UI, or watermarks.');
  }
  if (includes(taxonomy, 'deliverable', 'avatar-expression')) {
    requirements.push('Make face identity, eye direction, expression, hairstyle, and crop unambiguous at small avatar size. Preserve natural facial structure and consistent color treatment; for an expression pack, vary only the requested emotion and keep the same face, wardrobe, lighting, camera angle, and background across every tile.');
  }
  if (includes(taxonomy, 'deliverable', 'aigc-creation')) {
    requirements.push('Make the AI-assisted creative workflow concrete: identify the human decision, the AI step, the input artifact, the review point, and the usable output. Use honest capability boundaries, controlled information hierarchy, and product-realistic interaction states; do not imply unsupported automation, fabricated metrics, or autonomous claims.');
  }
  if (includes(taxonomy, 'deliverable', 'film-storyboard')) {
    requirements.push('Treat the image as one production-ready shot: state the shot purpose, camera distance, lens perspective, focal action, continuity anchors, and motivated light. Preserve screen direction and spatial geography so adjacent shots can be designed without contradiction.');
  }
  if (includes(taxonomy, 'deliverable', 'game-asset')) {
    requirements.push('Design a production-credible game asset with a complete silhouette, explainable construction, readable material separation, believable scale, and wear tied to use. Do not hide structural problems behind effects, labels, or a presentation collage.');
  }
  if (includes(taxonomy, 'deliverable', 'social-content')) {
    requirements.push('Design for mobile-first thumbnail reading with one focal message, declared platform-safe zones, and a restrained copy area. Do not generate fake platform chrome, engagement metrics, handles, or unrequested promotional text.');
  }
  if (includes(taxonomy, 'deliverable', 'surface-pattern')) {
    requirements.push('Make repetition and material behavior testable: define motif scale, edge continuity or sample count, surface response, and intended substrate. Avoid accidental seams, duplicate samples, unmanufacturable relief, and color-only material variation.');
  }
  if (includes(taxonomy, 'deliverable', 'packaging-design')) {
    requirements.push('Treat the package as a manufacturable system: preserve product dimensions, opening sequence, closure, protective clearances, inserts, material thickness, print zones, and shelf-facing hierarchy. Do not invent copy, logos, barcodes, certifications, or environmental and medical claims.');
  }
  if (includes(taxonomy, 'deliverable', 'food-beverage')) {
    requirements.push('Keep every edible element physically credible: specify preparation state, doneness, moisture, temperature cues, serving scale, vessel contact, and intentional garnish placement. Avoid plastic texture, impossible stacking, duplicated ingredients, unsafe handling, and decorative elements that look inedible.');
  }
  if (includes(taxonomy, 'deliverable', 'fashion-editorial')) {
    requirements.push('Preserve identity, anatomy, garment construction, fit, seams, closures, material weight, styling logic, and crop. Direct pose, lens, lighting, and location as one editorial statement; do not hide broken hands, warped accessories, or impossible clothing joins behind motion or effects.');
  }
  if (includes(taxonomy, 'deliverable', 'illustration-art')) {
    requirements.push('Make the chosen medium visible in mark-making, texture, depth, and edge treatment. Use a restrained palette and a single focal hierarchy rather than an undirected style collage.');
  }
  return requirements;
}

function workflowRequirements(taxonomy: Record<string, string[]>): string[] {
  const requirements: string[] = [];
  if (includes(taxonomy, 'workflow', 'image-to-image') || includes(taxonomy, 'workflow', 'inpainting') || includes(taxonomy, 'workflow', 'compositing')) {
    requirements.push('For edit workflows, change only the requested region or attribute. Preserve untouched subjects, perspective, camera angle, lighting direction, shadows, texture, and grain. Do not introduce unrelated objects.');
  }
  if (includes(taxonomy, 'workflow', 'series-consistency')) {
    requirements.push('For a series, lock the subject proportions, palette roles, lens language, and layout grammar before varying scene content. Every variation must remain recognizably in the same system.');
  }
  return requirements;
}

function closeupPortraitRequirements(metadata: CaseDocument): string[] {
  if (!metadata.tags.includes('人像特写')) return [];
  return ['Use a head-and-shoulders or upper-chest close-up only: let the face occupy roughly 60–75% of the frame, keep both eyes sharply focused, preserve natural skin texture, and exclude full-body framing, distant views, obscuring hands, heavy beauty retouching, and warped facial features.'];
}

function deliverableRequirementsZh(taxonomy: Record<string, string[]>): string[] {
  const requirements: string[] = [];
  if (includes(taxonomy, 'deliverable', 'ui-interface')) requirements.push('按完整产品界面处理：建立明确栅格、一个主行动按钮、可理解的组件状态与可信的信息密度。仅在需求明确时选择桌面端 16:9 或移动端 9:16。');
  if (includes(taxonomy, 'deliverable', 'infographic') || includes(taxonomy, 'deliverable', 'educational-visual')) requirements.push('明确阅读路径：标题、3–5 个有顺序的模块、短标签与含义清晰的连接线。不能用装饰插画替代信息结构。');
  if (includes(taxonomy, 'deliverable', 'poster-editorial') || includes(taxonomy, 'deliverable', 'document-publishing')) requirements.push('建立一个主视觉或标题区、一个次级信息区与有意识的留白；缩略图状态下也必须先读出层级。');
  if (includes(taxonomy, 'deliverable', 'product-commerce')) requirements.push('保持商品几何、材质和尺度可信；商品必须是唯一焦点，用可控布光、接触阴影和文案留白替代无关道具。');
  if (includes(taxonomy, 'deliverable', 'architecture-space')) requirements.push('透视、动线、光向、家具尺度和材质交界必须可信；加入必要的人尺度线索，但不要把空间做成拼贴式生活方式图。');
  if (includes(taxonomy, 'deliverable', 'portrait-character')) requirements.push('保持人体、手部、服装逻辑与角色识别特征一致；姿势、表情、镜头和背景都必须服务同一身份。');
  if (includes(taxonomy, 'deliverable', 'scene-storytelling')) requirements.push('通过前景、中景、远景和明确动作讲清叙事节点；系列中人物、道具和世界规则必须连续。');
  if (includes(taxonomy, 'deliverable', 'comic-drama')) requirements.push('制作一张竖屏 9:16 的漫剧关键帧：情绪节点、主角和本集视觉钩子必须一眼可读；整个系列的人物设计、服装锚点、场景规则与光线连续。不得添加未要求的对白、字幕、平台界面或水印。');
  if (includes(taxonomy, 'deliverable', 'avatar-expression')) requirements.push('在小尺寸头像中让身份、眼神、表情、发型和裁切一眼可辨；保持自然五官结构与统一色彩。若需求是表情包，只变化指定情绪，所有格子必须保持同一张脸、服装、光线、机位和背景。');
  if (includes(taxonomy, 'deliverable', 'aigc-creation')) requirements.push('将 AI 辅助创作工作流做具体：明确人的决策、AI 步骤、输入素材、审核节点和可用输出；使用诚实的能力边界、受控的信息层级和可信产品状态，不得暗示不具备的自动化能力、虚构数据或自治主张。');
  if (includes(taxonomy, 'deliverable', 'film-storyboard')) requirements.push('按一个可拍摄镜头处理：明确镜头用途、景别、镜头透视、焦点动作、连续性锚点和有动机的光源；保持运动方向与空间关系，使前后镜头能够无冲突衔接。');
  if (includes(taxonomy, 'deliverable', 'game-asset')) requirements.push('按可进入生产流程的游戏资产处理：轮廓完整、结构可解释、材质分区清楚、尺度可信，磨损必须与使用方式一致；不得用特效、标签或拼贴遮盖结构问题。');
  if (includes(taxonomy, 'deliverable', 'social-content')) requirements.push('按移动端缩略图优先设计：只保留一个核心信息、明确平台安全区与克制的文案区域；不得生成虚假平台界面、互动数据、账号名或未要求的宣传文字。');
  if (includes(taxonomy, 'deliverable', 'surface-pattern')) requirements.push('让重复关系和材质行为可检查：明确母题尺度、边缘连续或样板数量、表面响应与目标承印材质；避免意外接缝、重复样板、不可制造浮雕和仅靠换色区分材质。');
  if (includes(taxonomy, 'deliverable', 'packaging-design')) requirements.push('按可制造的包装系统处理：保持产品尺寸、开合顺序、闭合方式、保护间隙、内托、材料厚度、印刷区域与货架正面层级可信；不得自行生成文案、商标、条码、认证图标、环保或医疗声称。');
  if (includes(taxonomy, 'deliverable', 'food-beverage')) requirements.push('所有可食用元素都必须符合真实状态：明确烹饪程度、熟度、含水感、温度线索、份量尺度、器皿接触和有意图的装饰位置；避免塑料质感、不可能堆叠、食材复制、不安全操作和看似不可食用的装饰。');
  if (includes(taxonomy, 'deliverable', 'fashion-editorial')) requirements.push('保持人物身份、人体结构、服装版型、合体关系、缝线、闭合件、材质重量、造型逻辑与画面裁切一致；姿势、镜头、布光和地点必须共同表达一个编辑主题，不得用动态或特效遮盖错误手部、变形配饰和不可能的服装连接。');
  if (includes(taxonomy, 'deliverable', 'illustration-art')) requirements.push('让媒介特征体现在笔触、纹理、深度和边缘处理上；使用克制色板与单一焦点，不做无方向的风格拼贴。');
  return requirements;
}

function workflowRequirementsZh(taxonomy: Record<string, string[]>): string[] {
  const requirements: string[] = [];
  if (includes(taxonomy, 'workflow', 'image-to-image') || includes(taxonomy, 'workflow', 'inpainting') || includes(taxonomy, 'workflow', 'compositing')) requirements.push('编辑工作流只改动指定区域或属性；保留未改动主体、透视、机位、光向、阴影、纹理和颗粒，不能引入无关对象。');
  if (includes(taxonomy, 'workflow', 'series-consistency')) requirements.push('系列工作流先锁定主体比例、色彩角色、镜头语言与版式语法，再变化场景内容；每张图都必须属于同一视觉系统。');
  return requirements;
}

function closeupPortraitRequirementsZh(metadata: CaseDocument): string[] {
  if (!metadata.tags.includes('人像特写')) return [];
  return ['固定为头肩或胸像近景：脸部约占画面 60–75%，双眼必须清晰对焦，保留自然皮肤纹理；不得出现全身、远景、遮挡脸部的手势、过度磨皮或变形五官。'];
}

function humanizeId(value: string): string {
  return value.split('-').map((part) => ({ ai: 'AI', saas: 'SaaS', ui: 'UI', id: 'ID' }[part] ?? `${part.charAt(0).toUpperCase()}${part.slice(1)}`)).join(' ');
}

function variableDescription(id: string, zh: string, en: string): VariableLabel['description'] {
  const parts = id.split('_');
  const contains = (...terms: string[]) => terms.some((term) => parts.includes(term));
  if (contains('color', 'palette', 'tone', 'glaze', 'neon')) return { zh: `请给出「${zh}」的 2–4 个明确色名、主辅比例和使用位置；不要只写“高级”或“有氛围”。`, en: `Specify 2–4 named colors, their primary/secondary balance, and where ${en} appears; avoid vague terms such as “premium” or “atmospheric”.` };
  if (contains('name', 'title', 'headline', 'lines', 'quote')) return { zh: `请提供「${zh}」的准确文字；如不需要可读文字，请明确写“无文字”，不要让模型自行编写。`, en: `Provide the exact copy for ${en}; if readable copy is not needed, explicitly state “no text” rather than letting the model invent it.` };
  if (contains('audience', 'customer', 'user', 'learner', 'student', 'player', 'target')) return { zh: `请说明「${zh}」对应的人群、使用情境和关注重点，使内容密度与表达方式可被准确判断。`, en: `Define the people, usage context, and priority for ${en} so information density and tone can be chosen deliberately.` };
  if (contains('style', 'mood', 'vibe', 'era', 'render', 'visual', 'styling')) return { zh: `请说明「${zh}」的媒介、时代或审美方向、情绪强度与细节密度，并给出 1–2 个可见特征。`, en: `Describe the medium, era or aesthetic direction, emotional intensity, detail density, and 1–2 visible cues for ${en}.` };
  if (contains('material', 'fabric', 'metal', 'surface', 'finish', 'glaze')) return { zh: `请写清「${zh}」的主要材质、表面状态、磨损或反射特征，以及它在画面中的重点部位。`, en: `State the main materials, surface condition, wear or reflectance, and the focal placement of ${en}.` };
  if (contains('character', 'person', 'protagonist', 'pilot', 'author', 'mascot', 'identity', 'face', 'wardrobe', 'costume')) return { zh: `请定义「${zh}」的身份、外观识别点、服装或姿态，以及必须在系列中保持不变的锚点。`, en: `Define the identity, appearance anchors, wardrobe or pose, and the details that must remain stable across the series for ${en}.` };
  if (contains('scene', 'setting', 'location', 'place', 'city', 'room', 'space', 'environment', 'backdrop', 'landscape', 'destination')) return { zh: `请明确「${zh}」的地点、时间、空间尺度、关键环境元素及其与主体的关系。`, en: `Specify the place, time, scale, key environmental elements, and their relationship to the subject for ${en}.` };
  if (contains('action', 'story', 'conflict', 'hook', 'cue', 'moment', 'turn', 'threat', 'relationship')) return { zh: `请写明「${zh}」发生了什么、谁在行动、动作结果或情绪转折是什么，确保画面有单一可读节点。`, en: `State what happens in ${en}, who acts, and the resulting action or emotional turn so the image has one readable beat.` };
  if (contains('data', 'metric', 'criteria', 'points', 'columns', 'steps', 'stages', 'flow')) return { zh: `请列出「${zh}」中必须呈现的具体项目、数量范围和优先顺序；不得用虚构数据补全。`, en: `List the concrete items, quantity range, and priority order required for ${en}; do not fill gaps with fabricated data.` };
  if (contains('date', 'year', 'duration', 'length', 'range', 'time', 'season', 'period')) return { zh: `请提供「${zh}」的明确时间、周期或范围，并说明它如何影响场景、信息层级或输出格式。`, en: `Provide the exact time, duration, or range for ${en} and explain how it affects the scene, information hierarchy, or output format.` };
  if (contains('product', 'object', 'item', 'weapon', 'vehicle', 'furniture', 'food', 'dish', 'garment', 'jewelry', 'shoe')) return { zh: `请给出「${zh}」的具体对象、外形或功能、关键材质与不可改变的识别特征。`, en: `Provide the specific object, form or function, key materials, and non-negotiable identity features for ${en}.` };
  return { zh: `请填写「${zh}」的具体内容，至少包含对象或取值范围、一个可见特征，以及它对构图、信息层级或生成结果的影响。`, en: `Provide a concrete value for ${en}, including the object or range, one visible characteristic, and its effect on composition, information hierarchy, or the generated result.` };
}

function localizeVariable(id: string): VariableLabel {
  const zh = VARIABLE_LABEL_OVERRIDES[id] ?? id.split('_').map((part) => VARIABLE_TERMS[part] ?? '内容').join('');
  const en = humanizeId(id.replaceAll('_', '-'));
  return { id, zh, en, description: variableDescription(id, zh, en) };
}

function coverPalette(metadata: CaseDocument): { zh: string; en: string } {
  const deliverables = metadata.taxonomy.deliverable;
  if (deliverables.includes('ui-interface')) return { zh: '深海军蓝与冷灰为主，青绿色表示主要行动，橙红色仅用于警示状态', en: 'Deep navy and cool gray, teal for primary actions, and orange-red reserved for warning states' };
  if (deliverables.includes('infographic') || deliverables.includes('educational-visual')) return { zh: '象牙白底、深蓝正文结构、青绿色信息模块与少量橙色强调', en: 'Ivory background, deep-blue information structure, teal modules, and restrained orange accents' };
  if (deliverables.includes('poster-editorial') || deliverables.includes('document-publishing')) return { zh: '炭黑与暖白建立版式层级，使用一组高饱和主题色作为唯一强调', en: 'Charcoal and warm white for hierarchy, with one saturated thematic accent color' };
  if (deliverables.includes('product-commerce')) return { zh: '中性深灰与暖米白衬托主体材质，使用产品自身颜色作为视觉焦点', en: 'Neutral dark gray and warm cream supporting the material, with the product color as the focal accent' };
  if (deliverables.includes('architecture-space')) return { zh: '天然石灰、木色与低饱和绿为主，辅以暖色室内灯光和冷色环境天光', en: 'Natural stone, wood, and muted green, balanced by warm interior light and cool ambient daylight' };
  if (deliverables.includes('portrait-character') || deliverables.includes('avatar-expression')) return { zh: '自然肤色与中性服装色为主，背景使用低饱和冷色，轮廓光采用柔和暖色', en: 'Natural skin tones and neutral wardrobe colors, with a muted cool background and soft warm rim light' };
  if (deliverables.includes('scene-storytelling') || deliverables.includes('comic-drama')) return { zh: '深蓝环境色、青色空间光与琥珀色叙事焦点，保持明确冷暖对比', en: 'Deep-blue atmosphere, cyan spatial light, and an amber narrative focal point with clear warm-cool contrast' };
  return { zh: '炭黑、冷灰与低饱和主题色为主，仅保留一个高亮强调色', en: 'Charcoal, cool gray, and a muted thematic color with one controlled highlight accent' };
}

function coverMaterial(metadata: CaseDocument): { zh: string; en: string } {
  const deliverables = metadata.taxonomy.deliverable;
  if (deliverables.includes('product-commerce')) return { zh: '主体采用可辨认的真实材质与精确边缘，表面同时保留柔和漫反射、受控高光和自然接触阴影', en: 'The hero object uses recognizable real materials, precise edges, soft diffuse response, controlled highlights, and a natural contact shadow' };
  if (deliverables.includes('architecture-space')) return { zh: '裸露石材、温润木材、透明玻璃与哑光金属按真实节点交接，尺度和反射保持可信', en: 'Exposed stone, warm wood, clear glass, and matte metal meet at believable construction joints with credible scale and reflections' };
  if (deliverables.includes('portrait-character') || deliverables.includes('avatar-expression')) return { zh: '保留自然皮肤纹理、真实发丝和有重量感的服装面料，首饰与装备只使用受控高光', en: 'Natural skin texture, believable hair strands, weighted fabric, and controlled highlights on jewelry or equipment' };
  if (deliverables.includes('poster-editorial') || deliverables.includes('document-publishing')) return { zh: '细纹哑光纸、轻微印刷颗粒与克制的局部光泽，避免塑料感和无意义纹理', en: 'Fine matte paper, subtle print grain, and restrained spot gloss without plastic-looking or arbitrary textures' };
  return { zh: '主体表面保持清晰材质分区、可信磨损和统一光向，背景材质降低对比以突出焦点', en: 'Clear material separation, believable wear, and coherent light direction on the subject, with lower-contrast background materials' };
}

function generatedCoverValue(metadata: CaseDocument, variable: string, field: VariableLabel): { zh: string; en: string } {
  const parts = variable.split('_');
  const contains = (...terms: string[]) => terms.some((term) => parts.includes(term));
  const topicZh = metadata.title.replace(/^AIGC\s*/i, '');
  const topicEn = humanizeId(metadata.id);
  const tagsZh = metadata.tags.slice(0, 3).join('、');
  const tagsEn = metadata.taxonomy.deliverable.map(humanizeId).join(', ');
  const mediumZh: Record<string, string> = { photography: '摄影', '3d-render': '3D 渲染', 'vector-graphic': '矢量图形', illustration: '插画', 'mixed-media': '混合媒介' };
  const palette = coverPalette(metadata);
  const material = coverMaterial(metadata);

  if (contains('color', 'palette', 'tone', 'glaze', 'neon')) return palette;
  if (contains('material', 'materials', 'fabric', 'metal', 'surface', 'finish')) return material;
  if (contains('name', 'title', 'headline', 'lines', 'quote')) return { zh: `内部主题使用“${topicZh}”；封面不渲染无法保证准确的长文字，仅保留清晰标题安全区`, en: `Internal theme: “${topicEn}”; the cover avoids unreliable long readable copy and preserves a clear title-safe zone` };
  if (contains('audience', 'customer', 'user', 'learner', 'student', 'player', 'target')) return { zh: `${tagsZh || '该主题'}相关受众；核心关注点是${metadata.summary}`, en: `An audience interested in ${tagsEn || topicEn}; the primary need is the use case described by ${topicEn}` };
  if (contains('style', 'mood', 'vibe', 'era', 'render', 'visual', 'styling', 'direction')) return { zh: `${metadata.taxonomy.medium.map((value) => mediumZh[value] ?? '视觉设计').join('与')}表现，围绕${tagsZh || topicZh}建立高完成度、单一焦点和清晰层级`, en: `${metadata.taxonomy.medium.map(humanizeId).join(' and ')} treatment focused on ${tagsEn || topicEn}, with polished execution, one focal point, and clear hierarchy` };
  if (contains('character', 'person', 'protagonist', 'pilot', 'author', 'mascot', 'identity', 'face', 'wardrobe', 'costume', 'role', 'archetype')) return { zh: `${topicZh}封面中的核心人物；身份与外观围绕${tagsZh || topicZh}建立，并固定脸部、发型、服装和姿态识别点`, en: `The main subject of the ${topicEn} cover, with identity and appearance anchored to ${tagsEn || topicEn} and stable face, hair, wardrobe, and pose cues` };
  if (contains('scene', 'setting', 'location', 'place', 'city', 'room', 'space', 'environment', 'backdrop', 'landscape', 'destination', 'arena', 'biome')) return { zh: `${topicZh}所示的完整环境；空间必须直接支撑“${metadata.summary}”并保留前景、中景和背景层次`, en: `The complete environment shown in ${topicEn}; it directly supports the case summary with readable foreground, midground, and background layers` };
  if (contains('action', 'story', 'conflict', 'hook', 'cue', 'moment', 'turn', 'threat', 'relationship', 'activity', 'goal', 'problem', 'benefit', 'intent')) return { zh: metadata.summary, en: `The central action or outcome defined by ${topicEn}, staged as one immediately readable visual beat` };
  if (contains('data', 'metric', 'criteria', 'points', 'columns', 'steps', 'stages', 'flow', 'components', 'features')) return { zh: `封面使用 3–5 个与${topicZh}直接相关的核心模块，按主信息、辅助信息和状态反馈排序，不展示虚构统计值`, en: `The cover uses 3–5 modules directly related to ${topicEn}, ordered as primary information, supporting information, and status feedback without fabricated statistics` };
  if (contains('date', 'year', 'duration', 'length', 'range', 'time', 'season', 'period')) return { zh: `采用与${topicZh}封面叙事一致的明确时间条件，并通过环境光、天气或版式信息体现，不添加无依据日期`, en: `A defined time condition consistent with the ${topicEn} cover, expressed through light, weather, or layout without inventing unsupported dates` };
  if (contains('product', 'object', 'item', 'weapon', 'vehicle', 'furniture', 'food', 'dish', 'garment', 'jewelry', 'shoe', 'watch', 'package')) return { zh: `${topicZh}封面中的单一主对象；保持完整轮廓、可信比例、${material.zh}`, en: `The single hero object in the ${topicEn} cover, preserving its complete silhouette, credible proportions, and ${material.en.toLowerCase()}` };
  if (contains('brand', 'company', 'organization', 'service', 'industry', 'market', 'sector', 'positioning')) return { zh: `虚构且无商标的“${topicZh}”项目，品牌语气围绕${tagsZh || topicZh}，不出现真实公司、Logo 或未经证实的主张`, en: `A fictional unbranded ${topicEn} project, positioned around ${tagsEn || topicEn} without real companies, logos, or unsupported claims` };
  if (contains('format', 'medium', 'composition', 'layout', 'cover', 'display', 'presentation')) return { zh: `采用与当前预览一致的成品画幅和构图：一个主焦点、一个次级信息层、明确留白和缩略图可读性`, en: `The same final aspect ratio and composition as the preview: one primary focal point, one secondary information layer, deliberate negative space, and thumbnail readability` };
  return { zh: `以“${topicZh}”作为具体取值；视觉内容直接落实为：${metadata.summary}`, en: `Concrete value: ${topicEn}; the visual directly delivers the case summary and ${field.en.toLowerCase()} role` };
}

function coverValue(metadata: CaseDocument, variable: string): { zh: string; en: string } {
  const explicit = metadata.prompt.cover_values?.[variable];
  return explicit ?? generatedCoverValue(metadata, variable, localizeVariable(variable));
}

function localizeLimitations(limitations: string[]): { zh: string[]; en: string[] } {
  const hasChinese = limitations.some((item) => /[\u4e00-\u9fff]/.test(item));
  return {
    zh: hasChinese ? limitations : ['这是未经验证的起始案例；在实际生产使用前，请人工复核生成结果、文字与品牌合规性。'],
    en: limitations.length ? limitations : ['This is an unverified starter case; review generated output, text, and brand compliance before production use.'],
  };
}

function englishSummary(corePrompt: string): string {
  const firstSentence = corePrompt.replace(/\*\*/g, '').replace(/\s+/g, ' ').match(/^(.+?[.!?])(?:\s|$)/)?.[1];
  return firstSentence ?? corePrompt.slice(0, 180);
}

function compileCasePrompt(metadata: CaseDocument, corePrompt: string): string {
  const variableRules = metadata.prompt.variables.length
    ? metadata.prompt.variables.map((variable) => { const field = localizeVariable(variable); return `- \`{{${variable}}}\` (${field.en}): ${coverValue(metadata, variable).en}`; }).join('\n')
    : '- No variable replacement is required; keep the described subject and composition intact.';
  const textRule = includes(metadata.taxonomy, 'capability', 'text-rendering') && !/no readable text/i.test(corePrompt)
    ? 'If text is requested, render only the exact short copy supplied in the brief. Do not invent slogans, brand names, or long filler paragraphs.'
    : 'Do not fabricate readable brand copy, trademarks, UI filler, or watermarks. Treat any text area as a controlled placeholder unless exact copy is supplied.';
  const productionRules = [...deliverableRequirements(metadata.taxonomy), ...closeupPortraitRequirements(metadata), ...workflowRequirements(metadata.taxonomy)];
  return `${corePrompt}\n\n## Production protocol\n\n### Brief integrity\n${variableRules}\n- Keep the requested subject, use case, and visual hierarchy more important than generic style adjectives.\n\n### Output contract\n- Deliver one finished, presentation-ready image for this exact brief; do not create a moodboard, contact sheet, process sheet, mockup collection, or multiple competing layouts.\n- Use one focal hierarchy, a restrained palette, coherent light direction, and enough negative space for the intended communication.\n- ${textRule}\n\n### Deliverable requirements\n${productionRules.map((rule) => `- ${rule}`).join('\n') || '- Keep composition, material, and perspective internally consistent.'}\n\n### Quality gate\n- Before finalizing, check focal hierarchy, physical plausibility, subject consistency, unintended text, duplicate objects, broken anatomy, and accidental logos.\n- Avoid stock-like filler, copied campaign aesthetics, unrelated overlays, framing errors, and watermark-like marks.\n- Known limitation: ${metadata.evaluation.limitations.join(' ') || 'Review the generated result before production use.'}`;
}

function templateChecklistEn(template: TemplateDocument): string[] {
  const deliverable = template.taxonomy.deliverable.map(humanizeId).join(' / ');
  return [
    'Every required field is represented by a concrete, reviewable production decision.',
    `The ${deliverable} output has one clear focal hierarchy and remains readable at thumbnail size.`,
    'Supplied copy, facts, geometry, subject identity, materials, and spatial relationships remain internally consistent.',
  ];
}

function templatePitfallsEn(template: TemplateDocument): string[] {
  const workflow = template.taxonomy.workflow.map(humanizeId).join(' / ');
  return [
    `Do not replace missing ${workflow} inputs with invented brands, statistics, identities, or filler copy.`,
    'Do not add unrelated objects, competing layouts, unexplained variants, or decorative structure that weakens the requested outcome.',
    'Do not trade factual accuracy, legibility, physical plausibility, or subject consistency for surface-level style effects.',
  ];
}

function compileTemplatePrompt(template: TemplateDocument): string {
  const variableList = template.variables.map((variable) => { const field = localizeVariable(variable); return `- \`{{${variable}}}\` (${field.en}): ${field.description.en}`; }).join('\n');
  const productionRules = [...deliverableRequirements(template.taxonomy), ...workflowRequirements(template.taxonomy)];
  return `## Role\nAct as a senior image art director and production designer. Convert the supplied brief into one controlled visual deliverable, not a loose inspiration board.\n\n## Required brief fields\n${variableList}\n\n## Brief-resolution protocol\n- Treat every variable as a production decision. If a field is absent, request it before rendering; never silently substitute a generic product, statistic, brand claim, or identity.\n- Lock deliverable, audience, aspect ratio, focal subject, information density, and reference-preservation requirements before choosing style adjectives.\n- When exact copy, source assets, measurements, or legal claims are supplied, preserve them as controlled inputs rather than improvising replacements.\n\n## Core task\n${template.prompt}\n\n## Output contract\n- Produce exactly one finished ${template.taxonomy.deliverable.join(' / ')} deliverable. Do not create a moodboard, multi-option presentation board, contact sheet, process diagram, mockup collage, or unexplained variants.\n- Establish a primary focal point, secondary information layer, and deliberate negative space before adding visual detail.\n- Keep all named objects, visual relationships, camera/perspective logic, and material behavior internally consistent.\n\n## Production structure\n${productionRules.map((rule) => `- ${rule}`).join('\n') || '- Use a clear, deliberate layout and a controlled visual hierarchy.'}\n\n## Quality gates\n${templateChecklistEn(template).map((item) => `- ${item}`).join('\n')}\n- Review at thumbnail size first, then inspect factual accuracy, legibility, geometry, material behavior, and any reference-preservation requirement at full size.\n\n## Non-negotiable constraints\n- Respect the requested model compatibility, but prioritize the brief over any model-specific ornament.\n- Use short, exact text only when the brief provides it; never invent a real brand, a trademark, unsupported statistics, or filler copy.\n- Check for duplicate subjects, impossible geometry, incoherent shadows, broken anatomy, unreadable micro-text, and accidental watermarks before finalizing.\n\n## Avoid\n${templatePitfallsEn(template).map((item) => `- ${item}`).join('\n')}`;
}

function templateExecution(template: TemplateDocument): { zh: { input_policy: string; production_sequence: string[]; review_order: string[]; agent_pairing: string }; en: { input_policy: string; production_sequence: string[]; review_order: string[]; agent_pairing: string } } {
  const deliverable = template.taxonomy.deliverable.join(' / ');
  return {
    zh: {
      input_policy: '缺失的必填变量必须先向需求方确认；不得用虚构品牌、数据、人物身份或文字补齐。',
      production_sequence: ['锁定交付目标与受众', '填充可验证的变量值', '确定构图、信息层级与视觉语言', '按模板约束生成一个成品', '按验收项复核并记录限制'],
      review_order: ['缩略图层级', '文字与事实', '主体/产品/空间一致性', '材质、光影与透视', '禁止项与品牌风险'],
      agent_pairing: `先按五维分类筛选与 ${deliverable} 相同的案例，再将案例的视觉方向填入本模板；编辑工作流必须同时读取源图和保留项。`,
    },
    en: {
      input_policy: 'Confirm missing required variables before rendering; never fill gaps with fabricated brands, data, identities, or copy.',
      production_sequence: ['Lock deliverable and audience', 'Populate verifiable variable values', 'Set composition, information hierarchy, and visual language', 'Generate one finished deliverable within the template constraints', 'Review against acceptance checks and record limitations'],
      review_order: ['Thumbnail hierarchy', 'Text and factual accuracy', 'Subject/product/space consistency', 'Material, lighting, and perspective', 'Prohibitions and brand risk'],
      agent_pairing: `First retrieve cases that share the ${deliverable} taxonomy, then carry the selected visual direction into this template; edit workflows must also read the source image and preservation list.`,
    },
  };
}

function compileCasePromptZh(metadata: CaseDocument, corePrompt: string): string {
  const variableRules = metadata.prompt.variables.length
    ? metadata.prompt.variables.map((variable) => { const field = localizeVariable(variable); return `- \`{{${variable}}}\`（${field.zh}）：${coverValue(metadata, variable).zh}`; }).join('\n')
    : '- 不需要替换变量；保持案例描述中的主体和构图不变。';
  const textRule = includes(metadata.taxonomy, 'capability', 'text-rendering') && !/no readable text/i.test(corePrompt)
    ? '如需求包含文字，只渲染需求中给出的短文案；不要虚构口号、品牌名或长段填充文本。'
    : '不要虚构可读的品牌文案、商标、界面填充文字或水印。除非需求提供精确文案，否则文字区域仅作为受控占位。';
  const productionRules = [...deliverableRequirementsZh(metadata.taxonomy), ...closeupPortraitRequirementsZh(metadata), ...workflowRequirementsZh(metadata.taxonomy)];
  return `## 角色\n你是一名资深视觉总监与图像制作设计师。请把需求转化为一张可交付的成品，而不是灵感拼贴。\n\n## 核心任务\n为案例「${metadata.title}」创作图像：${metadata.summary}\n\n## 必填需求字段\n${variableRules}\n\n## 输出契约\n- 只交付一张完成度高、可展示的最终图像；不要生成情绪板、九宫格、多方案展示板、过程稿、样机合集或互相竞争的版式。\n- 先确定主焦点、次级信息层和留白，再补充细节；色板、光向、透视与材质行为必须统一。\n- ${textRule}\n\n## 成品结构\n${productionRules.map((rule) => `- ${rule}`).join('\n') || '- 保持构图、材质和透视的内部一致性。'}\n\n## 质量门槛\n- 输出前检查焦点层级、物理可信度、主体一致性、意外文字、重复对象、错误肢体和意外标志。\n- 避免素材感填充、复制既有营销活动视觉、美术无关叠层、裁切错误和水印样痕迹。\n- 已知限制：${localizeLimitations(metadata.evaluation.limitations).zh.join(' ')}`;
}

function compileTemplatePromptZh(template: TemplateDocument): string {
  const variableList = template.variables.map((variable) => { const field = localizeVariable(variable); return `- \`{{${variable}}}\`（${field.zh}）：${field.description.zh}`; }).join('\n');
  const productionRules = [...deliverableRequirementsZh(template.taxonomy), ...workflowRequirementsZh(template.taxonomy)];
  return `## 角色\n你是一名资深图像艺术总监与制作设计师。请把需求转化为一个受控的最终视觉交付物，而不是松散的灵感板。\n\n## 模板目标\n${template.title}：${template.summary}\n\n## 必填需求字段\n${variableList}\n\n## 需求解析协议\n- 每个变量都是生产决策。缺失字段必须先向需求方确认；不得静默替换为泛化商品、统计数据、品牌主张或人物身份。\n- 在选择风格词前，先锁定交付类型、受众、画幅比例、焦点主体、信息密度和参考图保留要求。\n- 如需求给出精确文案、源素材、尺寸或合规主张，将其作为受控输入保留，不得即兴改写。\n\n## 输出契约\n- 只生成一张完成的 ${template.taxonomy.deliverable.join(' / ')} 成品；不要生成情绪板、多方案展示板、联系表、过程图、样机拼贴或没有解释的变体。\n- 在添加视觉细节前，先建立主焦点、次级信息层与有意识的留白。\n- 所有命名对象、视觉关系、镜头/透视逻辑和材质行为必须内部一致。\n\n## 制作结构\n${productionRules.map((rule) => `- ${rule}`).join('\n') || '- 使用清晰、刻意的版式与受控的视觉层级。'}\n\n## 质量门槛\n${template.checklist.map((item) => `- ${item}`).join('\n')}\n- 先在缩略图尺度检查层级，再在完整尺寸检查事实准确性、文字可读性、几何、材质行为与参考图保留要求。\n\n## 不可违反的约束\n- 兼顾声明的模型兼容性，但始终以需求本身为最高优先级。\n- 仅在需求提供精确短文案时才渲染文字；绝不虚构真实品牌、商标、没有来源的数据或填充文案。\n- 输出前检查重复主体、不可能几何、冲突阴影、错误肢体、不可读微型文字与意外水印。\n\n## 避免\n${template.pitfalls.map((item) => `- ${item}`).join('\n')}`;
}

const cases = findCaseDirectories(CASES_DIR)
  .map((directory) => {
    const metadata = parse(fs.readFileSync(path.join(directory, 'case.yaml'), 'utf8')) as CaseDocument;
    const corePrompt = extractPrompt(fs.readFileSync(path.join(directory, 'prompt.md'), 'utf8'));
    const previewFile = path.join(REPO_ROOT, 'site', 'public', 'case-images', `${metadata.id}.png`);
    const { license: _license, source: _source, ...publicMetadata } = metadata;
    return {
      ...publicMetadata,
      title: { zh: metadata.title, en: humanizeId(metadata.id) },
      summary: { zh: metadata.summary, en: englishSummary(corePrompt) },
      tags: { zh: metadata.tags, en: [...metadata.taxonomy.deliverable, ...metadata.taxonomy.capability].map(humanizeId) },
      limitations: localizeLimitations(metadata.evaluation.limitations),
      prompt: { ...metadata.prompt, language: 'bilingual', variable_labels: metadata.prompt.variables.map((variable) => ({ ...localizeVariable(variable), cover_value: coverValue(metadata, variable) })), text: { zh: compileCasePromptZh(metadata, corePrompt), en: compileCasePrompt(metadata, corePrompt) } },
      preview: fs.existsSync(previewFile) ? `case-images/${metadata.id}.png` : null,
      path: path.relative(REPO_ROOT, directory).split(path.sep).join('/'),
    };
  })
  .sort((first, second) => first.title.zh.localeCompare(second.title.zh));

const templateCatalog = parse(fs.readFileSync(TEMPLATES_FILE, 'utf8')) as { templates: TemplateDocument[] };
const templates = templateCatalog.templates
  .map((entry) => {
    const { checklist, pitfalls, ...metadata } = entry;
    return { ...metadata, title: { zh: entry.title, en: humanizeId(entry.id) }, summary: { zh: entry.summary, en: `${humanizeId(entry.id)} production prompt template.` }, variable_labels: entry.variables.map(localizeVariable), prompt: { zh: compileTemplatePromptZh(entry), en: compileTemplatePrompt(entry) }, checklist: { zh: checklist, en: templateChecklistEn(entry) }, pitfalls: { zh: pitfalls, en: templatePitfallsEn(entry) }, execution: templateExecution(entry), path: 'library/templates/catalog.yaml' };
  })
  .sort((first, second) => first.title.zh.localeCompare(second.title.zh));

if (new Set(templates.map((entry) => entry.id)).size !== templates.length) {
  throw new Error('Template ids must be unique');
}

const generated = `// Generated by scripts/generate-catalog.ts. Do not edit manually.\n\nexport const catalog = ${JSON.stringify(cases, null, 2)} as const;\n\nexport const templates = ${JSON.stringify(templates, null, 2)} as const;\n`;
const agentData = {
  schema_version: 1,
  project: 'image-prompt-atlas',
  taxonomy_dimensions: ['deliverable', 'medium', 'workflow', 'capability', 'model'],
  counts: { cases: cases.length, templates: templates.length },
  cases,
  templates,
};

fs.writeFileSync(OUTPUT_FILE, generated);
fs.mkdirSync(path.dirname(AGENT_DATA_FILE), { recursive: true });
fs.writeFileSync(AGENT_DATA_FILE, `${JSON.stringify(agentData, null, 2)}\n`);
console.log(`Generated ${cases.length} catalog cases and ${templates.length} templates → ${path.relative(REPO_ROOT, OUTPUT_FILE)} and ${path.relative(REPO_ROOT, AGENT_DATA_FILE)}`);
