# LinkedIn AI Networking Assistant — 项目总结
# Project Summary for Claude

> 本文档用于向 Claude 展示项目全貌，寻求发布与推广的架构建议
> This document summarizes the entire project for Claude to advise on publishing & growth architecture

---

## 一、产品是什么？| What is this product?

**LinkedIn AI Networking Assistant** 是一个 Chrome 扩展，帮助用户在 LinkedIn 上快速生成个性化的好友申请消息。

核心场景：
1. 用户浏览 LinkedIn 个人主页
2. 点击扩展图标，自动抓取对方档案
3. 结合用户自己的档案，调用 AI 生成 4 条不同风格的搭话消息
4. 用户选择一条，复制后手动发送

**关键原则**：AI 只生成，不自动发送。用户始终掌控。

---

## 二、当前进度 | Current Status

### ✅ 已完成（Phase 0–7）

| Phase | 内容 | 状态 |
|-------|------|------|
| 0 | 项目公约 & 文档（PRD/TechStack/Database/Architecture） | ✅ |
| 1 | Vite + React + Chrome MV3 脚手架 | ✅ |
| 2 | Profile Extractor（抓取目标档案） | ✅ |
| 3 | DeepSeek API 接入（消息生成） | ✅ |
| 4 | 消息选择 UI（Copy/Edit/Regenerate） | ✅ |
| 5 | 设置页（个人档案/API Key/Temperature） | ✅ |
| 6 | 一键同步自己的 LinkedIn 档案 | ✅ |
| 7a | 全页文本倾倒（不再依赖 CSS 选择器） | ✅ |
| 7b | LLM 提炼原始文本为结构化档案 | ✅ |
| 7c | 导入预览确认 UI | ✅ |
| 7d | 预览 UI 打磨（修复弹窗遮挡） | ✅ |
| 7e | 共同点智能匹配（同校/同公司/同城市/同领域） | ✅ |

### 📦 当前可用功能

- [x] 在 LinkedIn 个人页抓取目标档案
- [x] 一键同步用户自己的 LinkedIn 档案（AI 提炼）
- [x] 生成 4 种风格的消息（Professional / Friendly / Entrepreneur / Academic）
- [x] 复制 / 编辑 / 重新生成单条消息
- [x] 共同点智能匹配（自动提及共同背景）
- [x] 设置页：管理个人档案、API Key、模型、Temperature
- [x] 所有数据存在本地（Chrome Local Storage），不依赖云服务

---

## 三、技术架构 | Technical Architecture

### Tech Stack

| 层级 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript 6 |
| 构建工具 | Vite 5 |
| UI | Tailwind CSS 3（Apple Minimal 风格） |
| 浏览器扩展 | Chrome Manifest V3 |
| LLM | DeepSeek API（OpenAI 兼容格式） |
| 存储 | Chrome Local Storage（纯本地） |

### 项目结构

```
src/
├── background/index.ts       # Service Worker（MV3）
├── content/
│   ├── index.ts              # Content Script 入口（消息路由）
│   └── extractor.ts          # Profile Extractor（全页文本倾倒）
├── popup/
│   ├── App.tsx               # 主界面（消息生成 + 展示）
│   ├── Settings.tsx          # 设置页（档案管理 + API Key + 导入预览）
│   ├── index.html / main.tsx # React 入口
│   └── index.css             # Tailwind 入口
├── services/
│   ├── llm.ts                # DeepSeek API 调用 + refineProfile()
│   ├── prompt.ts             # Prompt Builder（system/user prompt 组装）
│   └── settings.ts           # Chrome Storage 读写封装
└── types/index.ts            # 全局 TypeScript 类型定义
```

### 数据流

```
【用户档案导入】
LinkedIn 个人页 → dumpProfileRawText() → pendingRawProfileText
→ refineProfile(apiKey, rawText) → DeepSeek → UserProfile
→ 预览弹窗 → 用户编辑确认 → 存入 chrome.storage.local

【消息生成】
LinkedIn 目标页 → extractTargetProfileAsync() → TargetProfile
→ Prompt Builder（UserProfile + TargetProfile + 共同点分析）
→ DeepSeek API → 4 条消息 → Popup UI
→ 用户 Copy/Edit/Regenerate
```

---

## 四、当前限制与问题 | Current Limitations

### 必须解决的问题（发布前）

1. **API Key 由用户自己提供**
   - 当前：用户需要自己有 DeepSeek API Key，手动填入设置页
   - 问题：普通用户不知道什么是 API Key，也不会申请
   - 影响：无法面向非技术用户推广

2. **LLM 费用**
   - 当前：用户用自己的 API Key，自己承担费用
   - 问题：如果要去掉用户 API Key，需要自己搭建后端代理，承担费用

3. **Chrome 扩展发布**
   - 当前：只能在开发者模式下手动加载 `dist/` 文件夹
   - 需要：发布到 Chrome Web Store（需要 $5 一次性注册费）

4. **LinkedIn 反爬 / ToS**
   - 用 Content Script 抓取 LinkedIn 页面，理论上违反 LinkedIn ToS
   - 风险：扩展可能被 Chrome Web Store 拒绝，或 LinkedIn 投诉

### 非阻断但值得改进

- [ ] 消息生成后没有「一键填入 LinkedIn 消息框」功能（需要 content script 注入填写）
- [ ] 没有使用统计（生成了多少条、哪种风格最受欢迎）
- [ ] 没有多语言支持（目前只支持英文 LinkedIn）
- [ ] 没有用户反馈机制（消息质量打分）

---

## 五、发布与推广的问题 | Questions for Claude

**我们想要向 Claude 请教的问题：**

1. **API Key 问题怎么解决？**
   - 方案 A：用户自己提供 Key（门槛高，但免费）
   - 方案 B：我们提供 Key，通过后端代理（需要服务器 + 费用）
   - 方案 C：混合模式（免费用户用我们的 Key 有配额限制，付费用户用自己的 Key）
   - 哪种最适合早期推广？

2. **后端需要搭建吗？**
   - 当前完全是前端 + Chrome Local Storage，无后端
   - 如果要做用户系统、消息历史同步、用量限制，需要后端
   - 最小可用后端架构是什么？推荐什么技术栈？

3. **Chrome Web Store 发布注意事项**
   - LinkedIn 爬虫的 ToS 风险如何规避？
   - 有没有类似的扩展成功上架的案例可以参考？

4. **推广策略**
   - 目标用户：学生、研究员、创业者、求职者
   - 除了 Product Hunt  launch，还有什么低成本的推广渠道？

---

## 六、文件说明 | Files Guide

| 文件 | 说明 |
|------|------|
| `docs/PRD.md` | 产品需求文档（V1 功能范围） |
| `docs/TechStack.md` | 技术栈与编码规范 |
| `docs/Database.md` | 数据存储规范（Local Storage 键值设计） |
| `docs/Architecture.md` | 系统架构与数据流 |
| `docs/Phase.md` | 开发阶段计划（Phase 0–7 详细分解） |
| `dist/` | 构建产物（可加载到 Chrome 的扩展目录） |
| `PROJECT_SUMMARY.md` | 本文档 |

---

## 七、如何运行 | How to Run

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 加载到 Chrome
# 1. 打开 chrome://extensions
# 2. 开启「开发者模式」
# 3. 点击「加载已解压的扩展程序」
# 4. 选择 dist/ 文件夹
```

---

*最后更新：2026-06-26*
*项目状态：Phase 7 完成，测试版功能完整，准备讨论发布方案*
