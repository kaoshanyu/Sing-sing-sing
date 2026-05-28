# 五音不全 - AI音乐教学应用

专为五音不全的用户设计的 AI 智能音乐教学应用。包含前端（Next.js）和后端（FastAPI）两部分。

## 项目结构

```
singing-assessment-app/
├── frontend/          # Next.js 16 前端 (Turbopack)
│   ├── app/           # Next.js App Router
│   │   ├── globals.css  # 全局样式 + CSS变量(奶油治愈系主题)
│   │   ├── layout.tsx   # 根布局 (Noto_Sans_SC 字体)
│   │   └── page.tsx     # 主页面 (AppContent 含4个tab)
│   ├── components/
│   │   ├── ui/        # shadcn/ui 组件
│   │   ├── onboarding/ # 新手引导流程 (登录→问卷→音域测试)
│   │   ├── ai-mentor-tab.tsx   # AI导师聊天界面
│   │   ├── bottom-navigation.tsx # 底部导航(教程/乐理/AI/主页)
│   │   ├── home-tab.tsx         # 主页tab
│   │   ├── theory-tab.tsx       # 乐理tab
│   │   ├── tutorial-map.tsx     # 教程地图模块列表
│   │   ├── tutorial-practice.tsx # 教程闯关练习(含T1-T7题型)
│   │   ├── practice-session.tsx  # 通用练习会话(页面版)
│   │   ├── level-complete.tsx    # 关卡完成页
│   │   ├── level-node.tsx        # 关卡节点
│   │   ├── chapter-card.tsx      # 章节卡片
│   │   ├── pitch-visualizer.tsx  # 音高可视化
│   │   └── theme-provider.tsx    # 主题提供者
│   ├── lib/
│   │   ├── api.ts          # API 客户端 (与后端通信)
│   │   ├── game-context.tsx # 全局游戏状态管理
│   │   └── utils.ts        # 工具函数 (cn)
│   ├── hooks/           # 自定义 hooks
│   ├── public/          # 静态资源
│   ├── package.json     # 依赖配置
│   ├── next.config.ts   # Next.js 配置 (含API rewrite 到 :8000)
│   ├── next.config.mjs  # Next.js 备用配置
│   ├── tsconfig.json    # TypeScript 配置
│   ├── postcss.config.mjs # PostCSS (Tailwind v4)
│   └── components.json  # shadcn/ui 配置
│
├── backend/           # FastAPI 后端
│   ├── main.py        # FastAPI 入口 (含CORS, MCP, 路由注册)
│   ├── database.py    # SQLAlchemy+SQLModel 数据库连接(PostgreSQL)
│   ├── models.py      # SQLModel ORM 模型
│   ├── all_enums.py   # 枚举定义
│   ├── model_type.py  # 模型类型定义
│   ├── result_response.py # 统一响应格式
│   ├── seed_data.py   # 种子数据
│   ├── seed_question_bank.py # 题库导入脚本
│   ├── routers/       # API 路由
│   │   ├── auth_router.py
│   │   ├── users_router.py
│   │   ├── quiz_sessions_router.py
│   │   ├── songs_router.py
│   │   ├── singing_records_router.py
│   │   ├── files_router.py
│   │   └── ai_chat_router.py
│   ├── services/      # 业务逻辑层
│   ├── schemas/       # Pydantic 验证模型
│   ├── depends/       # FastAPI 依赖注入
│   ├── utils/         # 工具函数
│   ├── alembic/       # 数据库迁移
│   ├── data/          # 题库 JSON 数据
│   ├── .env.example   # 环境变量模板
│   ├── .gitignore
│   └── requirements.txt
│
├── frontend/
│   └── .env.example   # 前端环境变量模板
│
└── CLAUDE.md          # 本文件
```

## 技术栈

- **前端**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide Icons, Framer Motion
- **后端**: FastAPI, SQLAlchemy, SQLModel, PostgreSQL, PyJWT
- **构建工具**: pnpm, Turbopack

## 快速启动

### 前端

```bash
cd frontend
pnpm install
pnpm approve-builds sharp
pnpm dev
```

前端默认监听 `http://localhost:3000`。

### 后端

需要 Python 3.10+ 和 PostgreSQL。

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # macOS/Linux

# 安装依赖
pip install -r requirements.txt

# 启动
python main.py
# 或: uvicorn main:app --reload --port 8000
```

后端默认监听 `http://localhost:8000`。

### 数据库

需要本地 PostgreSQL 实例，默认连接:
```
postgresql+psycopg2://autoagent:mind_autoagent@localhost:5432/postgres
```
可在 `backend/database.py` 中修改 `DATABASE_URL`。

### 初始化数据

首次启动后需要导入题库:

```bash
cd backend
source venv/bin/activate
python seed_question_bank.py
```

题库 JSON 文件位于 `backend/data/questionBank.v1.json`。

### 环境变量

复制 `.env.example` 为 `.env`（后端）或 `.env.local`（前端）:

**frontend/.env.local**:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Vercel 部署时改为 ngrok 地址。

**backend/.env**:
```
CREO4U_API_KEY=your_api_key_here
```

## API 代理

前端 Next.js 的 `next.config.ts` 配置了 rewrite 规则:
```
/api/:path* → http://localhost:8000/api/:path*
```
因此在开发时，前端 `/api/v1/...` 的请求自动代理到后端的 `localhost:8000`。

## 核心模块

### 教程闯关 (TutorialPractice)
- **T1**: 双音音高比较 (听两个音，选更高的)
- **T2**: 三音音高比较 (听三个音，选最高的)
- **T3**: 音程比较 (听两组旋律，选音程更大的)
- **T4**: 多音程比较 (四选二配对)
- **T5**: 音程听写 (听旋律选唱名)
- **T6**: 跟唱单音
- **T7**: 跟唱短句

### AI导师
- 聊天式问答界面
- 支持文字输入和语音输入
- 预设问题建议卡片

### 乐理
- 音乐基础知识展示

## 重要说明

- 前端使用 `@/` 作为根路径别名 (tsconfig paths)
- 所有 shadcn/ui 组件在 `components/ui/` 目录下
- CSS 使用 Tailwind v4 + CSS 变量定义奶油治愈系主题色
- 游戏状态 (用户登录、章节进度、音域等) 通过 React Context 管理 (`lib/game-context.tsx`)
