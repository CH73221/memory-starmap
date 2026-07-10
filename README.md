# 记忆星图 — AI 智能复习引擎

一款面向大学生的 AI 智能复习 Web 应用。用户只需上传课堂笔记、教材 PDF 或手写笔记照片，AI 会自动解析内容、构建知识图谱、生成智能闪卡，并根据艾宾浩斯遗忘曲线量身定制每日复习计划。

## 功能特性

- 🗺️ **智能知识图谱** - AI 自动解析笔记，构建可视化知识网络
- 📇 **AI 闪卡生成** - 基于知识点自动生成复习闪卡
- 📅 **遗忘曲线排程** - 基于 SM-2 算法的智能复习计划
- 📊 **学习统计** - 掌握度分析、遗忘曲线对比、学习趋势
- 📤 **多格式上传** - 支持 PDF、图片 OCR、纯文本

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| 后端 | Python FastAPI + SQLAlchemy + SQLite |
| AI | OpenAI GPT-4o API |
| 可视化 | Canvas 2D (知识图谱) + Recharts (统计图表) |

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.11+
- OpenAI API Key

### 一键启动 (Windows)

```bash
start.bat
```

### 手动启动

#### 后端

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 填入你的 OPENAI_API_KEY
python -m uvicorn app.main:app --reload --port 8000
```

#### 前端

```bash
cd frontend
npm install
npm run dev
```

### 访问地址

- 前端: http://localhost:5173
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 项目结构

```
memory-starmap/
├── frontend/          # React 前端
│   ├── src/
│   │   ├── components/  # UI 组件
│   │   ├── pages/       # 页面
│   │   ├── services/    # API 服务
│   │   ├── stores/      # 状态管理
│   │   └── types/       # 类型定义
│   └── package.json
├── backend/           # Python 后端
│   ├── app/
│   │   ├── api/         # API 路由
│   │   ├── core/        # 核心配置
│   │   ├── models/      # 数据模型
│   │   ├── schemas/     # Pydantic 模型
│   │   ├── services/    # 业务逻辑
│   │   └── prompts/     # AI 提示词
│   └── requirements.txt
├── start.bat          # Windows 启动脚本
└── README.md
```

## 核心算法

### SM-2 间隔重复算法

基于 SuperMemo 的 SM-2 算法，根据用户对每张闪卡的评分（困难/一般/简单），动态调整下次复习时间间隔：

- 回答正确：间隔递增（1天 → 6天 → 间隔×易度因子）
- 回答错误：重置为 1 天后复习
- 易度因子：根据每次评分动态调整，最低 1.3

## 许可证

MIT License
