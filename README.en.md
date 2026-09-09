<p align="center">
  <img src="docs/assets/banner.svg" alt="Open Image Prompt Library" width="900">
</p>

<h3 align="center">Structured visual prompts for repeatable, reviewable image production</h3>

<p align="center">
  <a href="https://github.com/hongforge/ai_skills/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/hongforge/ai_skills/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="https://github.com/hongforge/ai_skills/stargazers"><img src="https://img.shields.io/github/stars/hongforge/ai_skills?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-c5ff6f?style=flat-square" alt="MIT License"></a>
  <a href="docs/gallery.en.md"><img src="https://img.shields.io/badge/cases-123-755bff?style=flat-square" alt="123 cases"></a>
  <a href="docs/templates.en.md"><img src="https://img.shields.io/badge/templates-30-19856e?style=flat-square" alt="30 templates"></a>
</p>

<p align="center"><a href="README.md">简体中文</a> · <strong>English</strong></p>

## 🌐 Live visual gallery

Open **[hongforge.github.io/ai_skills](https://hongforge.github.io/ai_skills/)** to browse by deliverable, model, workflow, or keyword. Select any card to inspect its full-size cover, variables, cover-specific values, and production prompt.

<p align="center">
  <a href="https://hongforge.github.io/ai_skills/"><img src="site/public/case-images/aigc-game-key-art.png" alt="AIGC game character key art" width="30%"></a>
  <a href="https://hongforge.github.io/ai_skills/"><img src="site/public/case-images/east-asian-neon-closeup.png" alt="East Asian neon portrait close-up" width="30%"></a>
  <a href="https://hongforge.github.io/ai_skills/"><img src="site/public/case-images/watch-campaign-image.png" alt="Luxury watch campaign visual" width="30%"></a>
</p>

## 📖 Quick links

| Resource | What it contains |
| --- | --- |
| [Case gallery](docs/gallery.en.md) | 123 visual covers with case and prompt links |
| [Industrial templates](docs/templates.en.md) | 30 templates with required fields, output contracts, quality gates, and pitfalls |
| [Live website](https://hongforge.github.io/ai_skills/) | Search, filters, full previews, and prompt copying |
| [Agent-ready JSON](data/prompt-library.json) | A stable catalog of cases, templates, variables, taxonomy, and limitations |
| [Prompt library Skill](skills/open-image-prompt-library/SKILL.md) | Case retrieval and template pairing for coding agents |
| [Img2Prompt Skill](skills/img2prompt/SKILL.md) | Model-neutral reverse engineering of reference images |

## ⚡ System design

This is not a pile of prompt snippets. It is a **Prompt-as-Data system** for production work:

```text
visual case + cover values + replaceable variables + production template + quality gates + agent data
```

- Cases answer what the intended result should look like.
- Templates answer how to turn a brief into a controlled deliverable.
- Generated data keeps the website, Markdown galleries, and Agent Skill synchronized.
- Cases, prompts, previews, and project documentation are original project content.

## 🗂️ Browse the catalog

The catalog contains UI, infographics, posters, commerce, brands, spaces, portraits, avatars, AIGC game/anime art, comic drama, storytelling, illustration, publishing, and educational visuals. Start with the [complete visual gallery](docs/gallery.en.md), then open the [industrial template guide](docs/templates.en.md).

## 🧩 Production templates

Every template follows the same execution contract:

```text
role → required brief fields → resolution protocol → output contract → production structure → quality gates → failure checks
```

Templates cover interface systems, information design, campaign visuals, commerce, identity, spaces, portraits, narrative sequences, education, and controlled image editing.

## 🤖 Agent-ready architecture

```text
library/cases + library/templates
  ├─ data/prompt-library.json
  ├─ site/src/catalog.generated.ts
  ├─ docs/gallery*.md
  └─ docs/templates*.md
```

Agents can retrieve across deliverable, medium, workflow, capability, and compatible model dimensions. The recommended sequence is case selection, compatible template selection, then variable replacement with real brief values.

The model dimension currently covers GPT Image, Nano Banana, Midjourney, and Stable Diffusion alongside model-neutral prompts.

## 🚀 Local development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Run `npm run generate:catalog` after changing cases or templates to refresh website data, Agent JSON, and both language versions of the GitHub documentation.

## 🤝 Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [GOVERNANCE.md](GOVERNANCE.md), and [SECURITY.md](SECURITY.md). New cases must use original prompts and original or project-generated preview assets.

```bash
npm test
npm run build
```

## License

Project code and documentation are available under the [MIT License](LICENSE).
