# English Boost v2 — 部署指南

真实文章驱动的英语学习应用。从 IEEE Spectrum、Ars Technica、BBC 等权威来源抓取文章，AI 分析词汇和生成理解题。

## 工作流程

打开 → 浏览最新文章 → 选一篇阅读 → AI 自动标注生词 → 收藏不认识的词 → 做理解题 → 生词进入间隔复习队列

## 技术栈

Vite + React + Vercel（跟岐黄一样）

## 部署步骤

### 1. 准备
- Anthropic API key（https://console.anthropic.com）
- GitHub + Vercel 账号（已有）

### 2. 上传 GitHub

```bash
cd english-app
npm install          # 本地试一下能不能跑
git init
git add .
git commit -m "init english boost v2"
git remote add origin https://github.com/你的用户名/english-boost.git
git branch -M main
git push -u origin main
```

### 3. 部署 Vercel

1. Vercel → New Project → Import GitHub 仓库
2. Framework: **Vite**
3. Environment Variables 添加:
   - `ANTHROPIC_API_KEY` = 你的 key
4. Deploy

### 4. 绑定域名（可选）

Vercel Settings → Domains → 添加你的域名

## 本地开发

```bash
npm install

# 前端（不含 API 功能）
npm run dev

# 完整功能（含 serverless 函数）
# 先装 vercel CLI: npm i -g vercel
# 在项目根目录创建 .env 文件:
# ANTHROPIC_API_KEY=sk-ant-xxx
vercel dev
```

## 项目结构

```
├── api/
│   ├── fetch-feeds.js       ← 聚合 RSS 源，获取文章列表
│   └── process-article.js   ← 抓取文章 + Claude 分析词汇/出题
├── src/
│   ├── App.jsx              ← 主组件，Tab 导航
│   ├── App.css              ← 全局样式
│   ├── data/sources.js      ← RSS 源配置 + 种子词汇
│   ├── utils/storage.js     ← localStorage + 间隔重复
│   └── components/
│       ├── Home.jsx          ← 文章列表页
│       ├── ArticleReader.jsx ← 阅读器（核心：读文章 + 标词 + 做题）
│       ├── Flashcard.jsx     ← 复习闪卡
│       └── WordBank.jsx      ← 词库
```

## 添加/修改 RSS 源

编辑 `src/data/sources.js` 中的 SOURCES 数组。

## API 用量说明

每篇文章消耗一次 Claude API 调用（process-article），用于：
- 提取和清理文章正文
- 识别 8-12 个生词并生成释义
- 生成 3 道理解题

RSS 抓取不消耗 API。按 Sonnet 定价，每篇文章大约 $0.01-0.03。
