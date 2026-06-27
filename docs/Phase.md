# Phase.md — 项目阶段宪法

> 每个 Phase 有明确的输入、输出和完成标准。Phase 之间线性推进，不可跳跃。

---

## Phase 0 — 项目公约

**状态**: ✅ Done

**任务**:
- 创建项目目录结构
- 写入四份核心约束文档（PRD / TechStack / Database / Architecture）
- 建立开发环境

**完成标准**: 四个文档就位，项目可开始编码

---

## Phase 1 — 脚手架搭建

**状态**: ✅ Done

**任务**:
- npm init + 安装依赖（React 18, TypeScript 6, Vite 5, Tailwind CSS 3）
- 配置文件（tsconfig, vite.config, tailwind.config, postcss.config）
- Chrome 扩展核心文件（manifest.json, background, content script, popup React app）
- 占位图标生成
- `npm run build` 通过，产出可用 dist/ 目录

**完成标准**: 
- tsc 无错误
- Vite build 成功
- dist/ 可加载到 Chrome 扩展管理页面
- 在 LinkedIn 个人页上点击扩展图标能看到 popup UI

---

## Phase 2 — Profile Extractor

**状态**: ✅ Done

**任务**:
- 在真实 LinkedIn 页面上测试 extractor.ts 的 DOM 选择器
- 调优抓取逻辑，确保稳定提取：Name, Headline, Company, School, Location, About, Experience
- 处理边界情况（不同语言的 LinkedIn、信息不完整、新版/旧版 UI）
- 抓取结果在 popup 中正确展示

**完成标准**:
- 在至少 3 个不同类型的 LinkedIn 个人页上抓取成功
- 抓取结果中 targetName 不为空
- popup 中展示目标档案摘要

---

## Phase 3 — DeepSeek API 接入

**状态**: ✅ Done

**任务**:
- ✅ 实现 LLM Service 模块（调用 DeepSeek Chat Completions API）
- ✅ 实现 Prompt Builder（组合用户档案 + 目标档案）
- ✅ 设置页：存储 API Key（Chrome Storage）
- ✅ 生成 4 条风格不同的 connection message：
  - Professional
  - Friendly
  - Entrepreneur
  - Academic

**完成标准**:
- ✅ 输入 API Key 后能成功调用 deepseek-chat
- ✅ 返回 4 条风格清晰、内容相关的消息
- ✅ 错误处理（网络失败、Key 无效、配额不足）有用户提示

---

## Phase 4 — 消息选择 UI

**状态**: ✅ Done

**任务**:
- 4 条消息卡片 UI（Apple 风格，圆角，干净白底）
- 每条消息可：Copy（一键复制）/ Edit（弹窗编辑）/ Regenerate（重新生成该风格）
- 复制后 Toast 提示
- 编辑后内容回写卡片

**完成标准**:
- 一键复制到剪贴板
- 编辑功能可用
- 单独 Regenerate 某条消息
- UI 符合 TechStack.md 定义的 Apple Minimal 风格

---

## Phase 5 — 设置页 + 打磨

**状态**: ✅ Done

**任务**:
- 设置页面：编辑个人档案（userName, userHeadline, userBackground 等）
- 设置页面：API Key 管理
- 设置页面：模型选择（默认 deepseek-chat）、Temperature 调节
- 持久化存储到 Chrome Local Storage
- 整体 UI 打磨、错误边界处理

**完成标准**:
- 个人档案可编辑、保存、读取
- API Key 安全存储（不落地到页面 DOM）
- 重启浏览器后设置不丢失

---

## Phase 6 — 自动同步用户 LinkedIn 档案

**状态**: ✅ Done

**任务**:
- Settings 页增加「Sync My LinkedIn Profile」按钮
- 点击后打开 `https://www.linkedin.com/in/me/`
- Content script 检测 import pending 标志，自动抓取用户档案
- 将抓取结果映射为 UserProfile 并写入 chrome.storage.local 暂存区
- Settings 页读取暂存区并回填表单，用户确认后保存
- 页面顶部显示导入成功/失败的临时提示条

**完成标准**:
- 用户无需手动填写姓名、Headline、公司、学校、About
- 档案更新后可再次点击 Sync 重新导入
- 构建通过，dist/ 产物正常

---

## Phase 7 — 优化 Settings 中的档案信息

**状态**: ✅ Done

**策略变更 (2026-06-26)**:
放弃用 CSS 选择器精确解析 LinkedIn DOM（4 轮修复均不稳定），改为**全页文本倾倒 → LLM 提炼**策略：
1. Content script: `dumpProfileRawText()` 抓取整页可见文字（克隆 body，去除 nav/footer/script，取 innerText）
2. Popup: 检测到 pending raw text → 调用 DeepSeek `refineProfile()` → LLM 解析为结构化 UserProfile
3. 弹出预览弹窗 → 用户审核编辑 → 确认保存

---

### 7a — 全页文本倾倒

**状态**: ✅ Done

**任务**:
- `extractor.ts`: 新增 `dumpProfileRawText()` — clone body, strip nav/footer/aside, 返回 capped 12k chars 文本
- `content/index.ts`: `attemptAutoImportOwnProfile` 改为调用 `dumpProfileRawText()` + 存储 `pendingRawProfileText`

**完成标准**: Sync 后不再依赖 CSS 选择器，全页文本被正确抓取并暂存

---

### 7b — LLM 提炼

**状态**: ✅ Done

**任务**:
- `services/settings.ts`: 新增 `loadPendingRawText()` / `clearPendingRawText()`
- `services/prompt.ts`: 新增 `PROFILE_REFINE_SYSTEM_PROMPT` + `buildProfileRefinePrompt()`
- `services/llm.ts`: 新增 `refineProfile()` — 调 DeepSeek 解析原始文本为 UserProfile（temp=0.3）

**完成标准**: DeepSeek 能将原始 LinkedIn 档案文本转化为结构化 UserProfile

---

### 7c — 导入预览确认 UI

**状态**: ✅ Done

**任务**:
- `Settings.tsx`: 重写 pending 检测逻辑 — 检测 `pendingRawProfileText` → 调用 `refineProfile()` → 弹预览模态框
- 预览模态框展示 AI 提炼后的全部 7 个字段，用户可在预览中当场编辑各字段
- "Apply & Fill Form" 确认写入表单 / "Discard" 丢弃

**完成标准**: 用户审核后才能保存，AI 提炼结果不会静默覆盖已有数据

---

### 7d — 预览 UI 打磨

**状态**: ✅ Done

**任务**:
- 修复预览弹窗在 Chrome 扩展弹窗 viewport（约 360x400）内被遮挡的问题
- 改为页面级替换模式：`importStatus === "preview"` 时整个 Settings 页面替换为预览视图
- `flex-col` 布局：header → hint → scrollable fields → sticky footer

**完成标准**: 预览弹窗在扩展弹窗内完整可见，所有字段可滚动查看

---

### 7e — 共同点智能匹配

**状态**: ✅ Done

**任务**:
- 升级 `SYSTEM_PROMPT`（批量生成 4 条）：增加「共同点分析」指令，要求 LLM 先对比双方档案识别共同点，再写消息
- 升级 `buildSingleStyleSystemPrompt()`（单条重新生成）：同步加入共同点分析指令
- 可识别共同点类型：同校、同公司、同城市、同领域/行业
- 存在共同点时，每条消息必须自然提及至少一个；无共同点时回退到基于对方行业/兴趣搭话

**完成标准**: 在用户和目标存在明确共同点时，生成的消息一定会提及这些共同点；Regenerate 单条重新生成也具备该能力

---

## Phase 完成协议

每完成一个 Phase，必须在回复末尾输出：

```
Phase X done
```

其中 X 为 Phase 编号（0–7）。
