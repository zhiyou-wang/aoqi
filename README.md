# 奥奇传说 · 精灵图鉴与养成系统

前后端分离：`frontend/`（React）+ `backend/`（FastAPI + Oracle）。设计系统为「冷色神迹工艺」。

## 目录

```
aoqi/
├── frontend/                  # 前端工程（React 18 + TS + Vite）
│   ├── src/
│   │   ├── components/        #   自研组件库（材质系统迁移目标）
│   │   ├── shared/            #   共享类型/契约（与后端 Pydantic 对齐）
│   │   ├── pages/             #   页面
│   │   ├── api/               #   API 客户端
│   │   ├── lib/               #   工具（路由 / useFetch）
│   │   └── router/            #   路由
│   ├── public/                # 静态资源（背景图）
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── backend/                   # 后端工程（FastAPI + Oracle）
│   ├── app/                   #   FastAPI 应用（api/core/db/models/schemas/services）
│   ├── database/              #   数据库 schema + 加载脚本
│   ├── scripts/               #   ETL 工具（build_dex / ljread）
│   ├── data/                  #   CSV 数据（spirits/skins/skills/evolutions）
│   ├── requirements.txt
│   └── .env.example
├── docs/                      # 文档（数据模型 / 材质系统 / 技术方案）
├── prototype/                 # 早期纯静态设计原型（已冻结）
└── _raw/                      # 原始抓包与临时数据（不入 git）
```

## 快速开始

### 后端

```bash
cd backend
python -m venv .venv           # 首次
.venv\Scripts\activate         # Windows
pip install -r requirements.txt
cp .env.example .env           # 填入 Oracle 连接
python -m uvicorn app.main:app --reload --port 8000
```

- 文档：`http://127.0.0.1:8000/docs`
- 健康检查：`/api/v1/health`

### 前端

```bash
npm install                    # 根目录，安装 workspace
npm run dev:web                # 或 cd frontend && npm run dev
```

- 页面：`http://localhost:5173`
- dev 时 `/api` 代理到后端 8000，无需 CORS。

## 自由度 / 可升级性 / 可调整性设计

骨架遵循四个原则，需求未定时也能低成本演进：

1. **契约驱动**：API 契约集中在 `frontend/src/shared`，与后端 Pydantic 模型对齐。改需求先改契约，两端同步。
2. **按域拆分**：后端每个业务域（spirits/skins/skills/...）独立成 `api/` + `services/` + `schemas/` 三块；前端独立成 `pages/` + `features/`。增删域不影响其他域。
3. **最小可运行**：骨架只含「health + spirits 示例域」+ 空页面，不预置未来所有域的空文件，避免过度设计。
4. **可复制扩展**：新增域时复制 spirits 的模式即可，见下文。

## 如何新增一个后端域

以「皮肤 skins」为例，四步：

1. `app/schemas/skin.py` — Pydantic 契约模型（对齐 frontend/src/shared）
2. `app/services/skin_service.py` — 业务逻辑（查询/聚合）
3. `app/api/v1/skins.py` — 路由（只做参数解析，调 service）
4. `app/api/v1/__init__.py` 里 `api_router.include_router(skins.router)` 注册

「数据访问」统一走 `app/db/session.py` 的 `get_db` 依赖；「筛选字典」从数据库字典表动态返回，不硬编码枚举。

## 如何新增一个前端页面

1. `src/pages/XxxPage.tsx` — 页面组件
2. `src/api/client.ts` 加对应 `fetchXxx` 函数（契约类型来自 src/shared）
3. `src/App.tsx` 加 `<Route>` 注册

## 材质系统（设计系统）

液态玻璃/液态金属/Y2K 等材质能力见 `docs/04-材质系统.md`。渲染架构（预计算位移图 + 分级降级）见 `docs/05-技术方案.md`。后续迁移为 `frontend/src/components` 的 React 组件。
