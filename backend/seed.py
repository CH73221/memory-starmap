"""
seed.py - 数据库种子脚本

为 Memory Starmap 应用生成演示数据：
  1. 演示用户 (demo@starmap.com / demo123)
  2. 3 份学习资料，每份含 5 个知识点（共 15 个）
  3. 15 张闪卡（每个知识点一张）
  4. 6 条今日到期的复习计划
  5. 30 条过去一个月内的复习历史记录
  6. 6 篇含 [[wiki-links]] 互链的笔记
  7. 若干已解锁成就

用法：
    cd backend
    python seed.py
"""

import random
import sys
from datetime import datetime, timedelta, timezone, date

# 确保能 import app 包
sys.path.insert(0, ".")

from sqlalchemy.orm import Session

# 导入数据库引擎 / 会话 / 建表逻辑
from app.core.database import engine, SessionLocal, Base, create_tables

# 导入安全模块（密码哈希）
from app.core.security import get_password_hash

# 导入全部模型，确保 Base.metadata 中注册了所有表
from app.models.user import User
from app.models.material import Material
from app.models.knowledge import KnowledgePoint, KnowledgeRelation
from app.models.flashcard import Flashcard
from app.models.review import ReviewSchedule, ReviewHistory
from app.models.note import Note
from app.models.achievement import Achievement
from app.models.study_plan import StudyPlan, StudyPlanProgress
from app.models.extra import Mistake, FocusSession

# 固定随机种子，保证每次运行数据一致
random.seed(42)

# ---------------------------------------------------------------------------
# 演示用户
# ---------------------------------------------------------------------------
DEMO_EMAIL = "demo@starmap.com"
DEMO_USERNAME = "Demo"
DEMO_PASSWORD = "demo123"

# ---------------------------------------------------------------------------
# 学习资料 + 知识点定义
# 每份资料 5 个知识点；每个知识点附一道闪卡（问题 / 答案）
# ---------------------------------------------------------------------------
MATERIALS_DATA = [
    {
        "title": "高等数学-微积分基础",
        "file_type": "pdf",
        "summary": "系统介绍极限、导数、微分中值定理与积分学的基础概念与计算方法。",
        "raw_text": "本资料涵盖微积分核心内容，包括极限的严格定义、导数的几何意义与应用、微分中值定理及其证明思路、定积分与不定积分的计算技巧等。",
        "knowledge_points": [
            {
                "title": "极限的定义与性质",
                "content": "极限是微积分的基石。数列极限的 ε-N 定义：对于任意 ε>0，存在 N，当 n>N 时 |aₙ-a|<ε。函数极限的 ε-δ 定义类似。极限具有唯一性、有界性与保号性。",
                "importance": 5,
                "mastery_level": 0.6,
                "flashcard": {
                    "question": "请叙述函数极限的 ε-δ 定义。",
                    "answer": "设 f 在 x₀ 的某去心邻域有定义。若对任意 ε>0，存在 δ>0，使 0<|x-x₀|<δ 时 |f(x)-A|<ε，则称 x→x₀ 时 f(x) 的极限为 A。",
                    "card_type": "concept",
                    "difficulty": 4,
                },
            },
            {
                "title": "导数的几何意义",
                "content": "导数 f'(x₀) 表示函数在 x₀ 处的瞬时变化率，几何上等于切线斜率。f'(x₀)=lim[Δx→0] (f(x₀+Δx)-f(x₀))/Δx。可导必连续，连续不一定可导。",
                "importance": 5,
                "mastery_level": 0.75,
                "flashcard": {
                    "question": "导数的几何意义是什么？可导与连续的关系如何？",
                    "answer": "导数表示切线斜率，即瞬时变化率。可导必连续，但连续不一定可导（如 y=|x| 在 x=0 处）。",
                    "card_type": "concept",
                    "difficulty": 3,
                },
            },
            {
                "title": "微分中值定理",
                "content": "罗尔定理：f 在 [a,b] 连续、(a,b) 可导且 f(a)=f(b)，则存在 ξ 使 f'(ξ)=0。拉格朗日中值定理：f(b)-f(a)=f'(ξ)(b-a)。柯西中值定理为其推广。",
                "importance": 4,
                "mastery_level": 0.45,
                "flashcard": {
                    "question": "陈述拉格朗日中值定理并说明其几何意义。",
                    "answer": "若 f 在 [a,b] 连续、(a,b) 可导，则存在 ξ∈(a,b) 使 f(b)-f(a)=f'(ξ)(b-a)。几何上表示存在一点切线平行于割线。",
                    "card_type": "concept",
                    "difficulty": 4,
                },
            },
            {
                "title": "定积分的计算",
                "content": "牛顿-莱布尼茨公式：∫ₐᵇ f(x)dx = F(b)-F(a)，其中 F 是 f 的原函数。定积分具有线性性、可加性、保号性。常用换元法与分部积分法。",
                "importance": 5,
                "mastery_level": 0.7,
                "flashcard": {
                    "question": "写出牛顿-莱布尼茨公式并简述其意义。",
                    "answer": "∫ₐᵇ f(x)dx = F(b)-F(a)，F 为 f 的原函数。它将定积分计算转化为求原函数，是微积分基本定理的核心。",
                    "card_type": "concept",
                    "difficulty": 3,
                },
            },
            {
                "title": "不定积分的换元法",
                "content": "第一换元法（凑微分）：∫f(g(x))g'(x)dx = ∫f(u)du。第二换元法：令 x=φ(t) 将积分转化为易积形式。三角换元常用于含 √(a²-x²) 等根式。",
                "importance": 4,
                "mastery_level": 0.5,
                "flashcard": {
                    "question": "简述第一换元法（凑微分）的原理。",
                    "answer": "若被积式可写成 f(g(x))·g'(x)dx，令 u=g(x)，则 du=g'(x)dx，原积分化为 ∫f(u)du，求出后再回代。",
                    "card_type": "concept",
                    "difficulty": 3,
                },
            },
        ],
    },
    {
        "title": "计算机网络-TCP/IP协议族",
        "file_type": "pdf",
        "summary": "讲解 OSI 七层模型、TCP/IP 协议族核心机制，包括三次握手、四次挥手、IP 编址与 DNS 解析。",
        "raw_text": "本资料系统介绍计算机网络分层体系结构，重点剖析 TCP 可靠传输机制、连接管理、IP 地址与子网划分、DNS 域名解析流程等核心知识点。",
        "knowledge_points": [
            {
                "title": "OSI七层模型",
                "content": "OSI 模型分为物理层、数据链路层、网络层、传输层、会话层、表示层、应用层。TCP/IP 模型则简化为四层：网络接口层、网络层、传输层、应用层。",
                "importance": 4,
                "mastery_level": 0.8,
                "flashcard": {
                    "question": "请列出 OSI 七层模型自下而上的各层名称。",
                    "answer": "物理层、数据链路层、网络层、传输层、会话层、表示层、应用层。",
                    "card_type": "concept",
                    "difficulty": 2,
                },
            },
            {
                "title": "TCP三次握手",
                "content": "建立 TCP 连接需三次握手：1) 客户端发送 SYN；2) 服务端回复 SYN+ACK；3) 客户端发送 ACK。此后连接建立，可双向传输数据。",
                "importance": 5,
                "mastery_level": 0.85,
                "flashcard": {
                    "question": "请描述 TCP 三次握手的完整过程。",
                    "answer": "1) 客户端发送 SYN=1, seq=x；2) 服务端回复 SYN=1, ACK=1, seq=y, ack=x+1；3) 客户端发送 ACK=1, seq=x+1, ack=y+1。连接建立。",
                    "card_type": "concept",
                    "difficulty": 3,
                },
            },
            {
                "title": "TCP四次挥手",
                "content": "断开 TCP 连接需四次挥手：1) 主动方发送 FIN；2) 被动方回复 ACK（半关闭）；3) 被动方发送 FIN；4) 主动方回复 ACK，进入 TIME_WAIT 等待 2MSL 后关闭。",
                "importance": 4,
                "mastery_level": 0.6,
                "flashcard": {
                    "question": "TCP 四次挥手中为什么主动方最后要进入 TIME_WAIT 状态？",
                    "answer": "为确保被动方收到最后的 ACK；并防止旧连接的报文影响新连接。TIME_WAIT 持续 2MSL。",
                    "card_type": "concept",
                    "difficulty": 4,
                },
            },
            {
                "title": "IP地址与子网划分",
                "content": "IPv4 地址 32 位，分 A/B/C/D/E 类。子网掩码区分网络号与主机号。CIDR 表示法如 192.168.1.0/24。子网划分借用主机位作为网络位。",
                "importance": 4,
                "mastery_level": 0.65,
                "flashcard": {
                    "question": "已知 192.168.1.0/24，划分 4 个子网，写出各子网地址与掩码。",
                    "answer": "借 2 位，掩码 /26=255.255.255.192。子网：.0/26、.64/26、.128/26、.192/26，每个子网 62 个可用主机。",
                    "card_type": "concept",
                    "difficulty": 4,
                },
            },
            {
                "title": "DNS解析过程",
                "content": "DNS 解析流程：浏览器缓存 → 系统缓存 → hosts → 本地 DNS 服务器（递归查询）→ 根域名服务器 → 顶级域名服务器 → 权威域名服务器，最终返回 IP。",
                "importance": 3,
                "mastery_level": 0.55,
                "flashcard": {
                    "question": "简述浏览器输入域名后的 DNS 解析流程。",
                    "answer": "依次查询浏览器缓存、系统缓存、hosts 文件、本地 DNS 服务器；本地 DNS 递归查询根、顶级、权威域名服务器，返回对应 IP。",
                    "card_type": "concept",
                    "difficulty": 3,
                },
            },
        ],
    },
    {
        "title": "数据结构与算法-排序算法",
        "file_type": "pdf",
        "summary": "对比讲解冒泡、快速、归并、堆排序等经典排序算法的原理、复杂度与适用场景。",
        "raw_text": "本资料系统讲解常见排序算法：冒泡排序、快速排序、归并排序、堆排序，并分析各自时间复杂度、空间复杂度与稳定性，帮助理解算法选型。",
        "knowledge_points": [
            {
                "title": "冒泡排序",
                "content": "冒泡排序通过相邻元素两两比较交换，每轮将最大元素冒泡到末尾。时间复杂度 O(n²)，空间 O(1)，稳定排序。优化：设置标志位，无交换则提前结束。",
                "importance": 3,
                "mastery_level": 0.9,
                "flashcard": {
                    "question": "冒泡排序的时间复杂度与稳定性如何？如何优化？",
                    "answer": "时间 O(n²)，空间 O(1)，稳定。优化：每轮设置交换标志位，若该轮无交换说明已有序，提前终止。",
                    "card_type": "concept",
                    "difficulty": 2,
                },
            },
            {
                "title": "快速排序",
                "content": "快速排序基于分治：选基准 pivot，将小于 pivot 的放左、大于放右，递归排序左右子数组。平均 O(nlogn)，最坏 O(n²)，空间 O(logn)，不稳定。",
                "importance": 5,
                "mastery_level": 0.7,
                "flashcard": {
                    "question": "快速排序的基本思想和平均时间复杂度是什么？",
                    "answer": "分治法：选基准，分区使左小右大，递归排序左右。平均 O(nlogn)，最坏 O(n²)（已有序且取首元素为基准时）。",
                    "card_type": "concept",
                    "difficulty": 3,
                },
            },
            {
                "title": "归并排序",
                "content": "归并排序：将数组递归二分至单元素，再两两合并为有序数组。时间 O(nlogn)，空间 O(n)，稳定排序。适用于外部排序与链表排序。",
                "importance": 4,
                "mastery_level": 0.65,
                "flashcard": {
                    "question": "归并排序的时间复杂度、空间复杂度与稳定性如何？",
                    "answer": "时间 O(nlogn)，空间 O(n)（需辅助数组），稳定排序。适合外部排序和链表排序。",
                    "card_type": "concept",
                    "difficulty": 3,
                },
            },
            {
                "title": "堆排序",
                "content": "堆排序利用完全二叉树堆结构：先建大顶堆，每次将堆顶与末尾交换并下沉调整。时间 O(nlogn)，空间 O(1)，不稳定。常用于 Top-K 问题。",
                "importance": 4,
                "mastery_level": 0.5,
                "flashcard": {
                    "question": "堆排序的基本流程是什么？它稳定吗？",
                    "answer": "建大顶堆 → 堆顶与末尾交换 → 缩小堆并下沉调整，重复。时间 O(nlogn)，空间 O(1)，不稳定。",
                    "card_type": "concept",
                    "difficulty": 4,
                },
            },
            {
                "title": "时间复杂度分析",
                "content": "常见复杂度：O(1) < O(logn) < O(n) < O(nlogn) < O(n²) < O(2ⁿ) < O(n!)。主定理分析递归复杂度。排序算法中 O(nlogn) 是基于比较排序的理论下界。",
                "importance": 5,
                "mastery_level": 0.6,
                "flashcard": {
                    "question": "基于比较的排序算法时间复杂度下界是多少？为什么？",
                    "answer": "O(nlogn)。因为 n 个元素的比较排序对应决策树，最少叶子数 n!，树高至少 log₂(n!) = Ω(nlogn)。",
                    "card_type": "concept",
                    "difficulty": 4,
                },
            },
        ],
    },
]

# ---------------------------------------------------------------------------
# 笔记定义（含 [[wiki-links]] 互链）
# ---------------------------------------------------------------------------
NOTES_DATA = [
    {
        "title": "算法学习心得",
        "tags": "算法,学习方法",
        "content": (
            "# 算法学习心得\n\n"
            "学习算法最重要的是理解思想而非死记代码。近期重点学习了排序算法，"
            "详细对比记录在 [[排序算法对比笔记]] 中。\n\n"
            "## 核心体会\n"
            "- 分治思想是贯穿快速排序与归并排序的灵魂\n"
            "- 时间复杂度分析是评估算法优劣的关键，详见 [[时间复杂度分析笔记]]\n"
            "- 算法选型需结合数据规模与稳定性要求\n\n"
            "## 面试相关\n"
            "面试常考排序算法的原理与复杂度，准备清单见 [[面试准备笔记]]。\n"
            "考研复习也需覆盖算法部分，计划见 [[考研复习计划]]。\n"
        ),
    },
    {
        "title": "排序算法对比笔记",
        "tags": "算法,排序",
        "content": (
            "# 排序算法对比\n\n"
            "| 算法 | 平均时间 | 最坏时间 | 空间 | 稳定 |\n"
            "|------|---------|---------|------|------|\n"
            "| 冒泡 | O(n²) | O(n²) | O(1) | 稳定 |\n"
            "| 快排 | O(nlogn) | O(n²) | O(logn) | 不稳定 |\n"
            "| 归并 | O(nlogn) | O(nlogn) | O(n) | 稳定 |\n"
            "| 堆排 | O(nlogn) | O(nlogn) | O(1) | 不稳定 |\n\n"
            "## 要点\n"
            "- 快排平均最快但最坏退化，可通过随机化基准缓解\n"
            "- 归并稳定但需 O(n) 额外空间\n"
            "- 堆排原地排序，适合内存受限场景\n\n"
            "更多学习体会见 [[算法学习心得]]，复杂度推导见 [[时间复杂度分析笔记]]。\n"
        ),
    },
    {
        "title": "时间复杂度分析笔记",
        "tags": "算法,复杂度",
        "content": (
            "# 时间复杂度分析\n\n"
            "## 常见复杂度阶\n"
            "O(1) < O(logn) < O(n) < O(nlogn) < O(n²) < O(2ⁿ) < O(n!)\n\n"
            "## 主定理\n"
            "T(n) = aT(n/b) + f(n)，比较 f(n) 与 n^(log_b a) 判断复杂度。\n\n"
            "## 排序下界\n"
            "基于比较的排序决策树叶子数 ≥ n!，故下界 Ω(nlogn)。\n"
            "非比较排序（计数、基数）可突破该下界。\n\n"
            "相关内容可参考 [[排序算法对比笔记]] 与 [[算法学习心得]]。\n"
        ),
    },
    {
        "title": "面试准备笔记",
        "tags": "面试,复习",
        "content": (
            "# 面试准备清单\n\n"
            "## 高频考点\n"
            "1. 排序算法：原理、复杂度、稳定性，详见 [[排序算法对比笔记]]\n"
            "2. 计算机网络：TCP 三次握手/四次挥手、OSI 模型\n"
            "3. 数据结构：树、图、哈希表\n\n"
            "## 算法\n"
            "重点掌握快排与归并，理解分治思想，参见 [[算法学习心得]]。\n"
            "复杂度分析是必考项，复习 [[时间复杂度分析笔记]]。\n\n"
            "## 知识体系\n"
            "注意各知识点之间的关联，见 [[知识点关联思考]]。\n"
        ),
    },
    {
        "title": "知识点关联思考",
        "tags": "方法论,知识管理",
        "content": (
            "# 知识点关联思考\n\n"
            "## 为什么要建立知识关联\n"
            "孤立的知识容易遗忘，建立关联能加深理解与记忆。"
            "这正是记忆星图（Memory Starmap）的核心理念。\n\n"
            "## 我的关联实践\n"
            "- [[算法学习心得]] 与 [[排序算法对比笔记]] 互相关联\n"
            "- [[时间复杂度分析笔记]] 为排序对比提供理论支撑\n"
            "- [[面试准备笔记]] 串联多个主题，形成复习主线\n\n"
            "## 方法论\n"
            "1. 用双链笔记记录关联\n"
            "2. 定期回顾知识图谱\n"
            "3. 通过闪卡复习巩固\n"
        ),
    },
    {
        "title": "考研复习计划",
        "tags": "考研,计划",
        "content": (
            "# 考研复习计划\n\n"
            "## 总体安排\n"
            "- 数学：高等数学、线性代数、概率论\n"
            "- 专业课：数据结构与算法、计算机网络\n"
            "- 英语：每日阅读 + 单词\n"
            "- 政治：后期集中复习\n\n"
            "## 算法部分\n"
            "排序算法是重点，结合 [[排序算法对比笔记]] 与 [[算法学习心得]] 复习。\n"
            "复杂度分析见 [[时间复杂度分析笔记]]。\n\n"
            "## 计算机网络\n"
            "TCP/IP 协议族是核心，重点掌握三次握手与四次挥手。\n\n"
            "## 相关思考\n"
            "知识体系化很关键，参考 [[知识点关联思考]]。\n"
        ),
    },
]

# ---------------------------------------------------------------------------
# 成就定义（选用系统中真实存在的 achievement_key）
# ---------------------------------------------------------------------------
ACHIEVEMENTS_DATA = [
    {
        "key": "first_card",
        "unlocked_at_offset_days": 29,
        "progress": {"total_reviews": 1},
    },
    {
        "key": "first_material",
        "unlocked_at_offset_days": 29,
        "progress": {"materials_count": 1},
    },
    {
        "key": "streak_7",
        "unlocked_at_offset_days": 22,
        "progress": {"streak": 7},
    },
    {
        "key": "knowledge_10",
        "unlocked_at_offset_days": 15,
        "progress": {"mastered_points": 10},
    },
    {
        "key": "ten_cards_day",
        "unlocked_at_offset_days": 20,
        "progress": {"review_count_today": 10},
    },
    {
        "key": "early_bird",
        "unlocked_at_offset_days": 10,
        "progress": {"review_hour": 6},
    },
]


# ===========================================================================
# 种子主流程
# ===========================================================================
def seed():
    print("=" * 60)
    print("Memory Starmap 数据库种子脚本")
    print("=" * 60)

    # 1. 建表（幂等）
    print("\n[1/8] 确保数据库表已创建 ...")
    create_tables()
    print("      表结构就绪。")

    db: Session = SessionLocal()
    try:
        # ---------------------------------------------------------------
        # 2. 创建演示用户
        # ---------------------------------------------------------------
        print("\n[2/8] 创建演示用户 ...")
        existing_user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing_user:
            print(f"      演示用户已存在 (id={existing_user.id})，跳过创建。")
            user = existing_user
        else:
            user = User(
                username=DEMO_USERNAME,
                email=DEMO_EMAIL,
                password_hash=get_password_hash(DEMO_PASSWORD),
                avatar=None,
                total_xp=1280,
                level=5,
                streak=12,
                last_review_date=date.today() - timedelta(days=1),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"      已创建演示用户：{user.email} (id={user.id})")

        # ---------------------------------------------------------------
        # 3. 创建学习资料 + 知识点
        # ---------------------------------------------------------------
        print("\n[3/8] 创建学习资料与知识点 ...")
        # 若已有资料则跳过
        existing_materials = db.query(Material).filter(Material.user_id == user.id).all()
        if existing_materials:
            print(f"      用户已有 {len(existing_materials)} 份资料，跳过创建。")
            materials = existing_materials
            knowledge_points = (
                db.query(KnowledgePoint).filter(KnowledgePoint.user_id == user.id).all()
            )
        else:
            materials = []
            knowledge_points = []
            now = datetime.now(timezone.utc)
            for m_idx, m_data in enumerate(MATERIALS_DATA, 1):
                material = Material(
                    user_id=user.id,
                    title=m_data["title"],
                    file_path=None,
                    file_type=m_data["file_type"],
                    raw_text=m_data.get("raw_text"),
                    summary=m_data.get("summary"),
                    status="completed",
                    created_at=now - timedelta(days=29 - m_idx),
                    updated_at=now - timedelta(days=29 - m_idx),
                )
                db.add(material)
                db.flush()  # 拿到 id
                materials.append(material)

                for kp_idx, kp_data in enumerate(m_data["knowledge_points"], 1):
                    kp = KnowledgePoint(
                        material_id=material.id,
                        user_id=user.id,
                        title=kp_data["title"],
                        content=kp_data["content"],
                        importance=kp_data.get("importance", 3),
                        mastery_level=kp_data.get("mastery_level", 0.2),
                        review_count=random.randint(2, 8),
                        consecutive_wrong=0,
                        last_reviewed_at=now - timedelta(days=random.randint(0, 5)),
                        created_at=now - timedelta(days=29 - m_idx),
                    )
                    db.add(kp)
                    knowledge_points.append(kp)
                db.flush()
                print(
                    f"      资料 {m_idx}: 《{material.title}》 + 5 个知识点"
                )
            db.commit()
            print(f"      共创建 {len(materials)} 份资料，{len(knowledge_points)} 个知识点。")

        # ---------------------------------------------------------------
        # 4. 创建闪卡
        # ---------------------------------------------------------------
        print("\n[4/8] 创建闪卡 ...")
        existing_cards = db.query(Flashcard).filter(Flashcard.user_id == user.id).all()
        if existing_cards:
            print(f"      用户已有 {len(existing_cards)} 张闪卡，跳过创建。")
            flashcards = existing_cards
        else:
            flashcards = []
            now = datetime.now(timezone.utc)
            # 为每个知识点创建一张闪卡（来自 MATERIALS_DATA 定义）
            kp_index = 0
            for m_data in MATERIALS_DATA:
                for kp_data in m_data["knowledge_points"]:
                    kp = knowledge_points[kp_index]
                    fc_data = kp_data["flashcard"]
                    flashcard = Flashcard(
                        knowledge_point_id=kp.id,
                        user_id=user.id,
                        question=fc_data["question"],
                        answer=fc_data["answer"],
                        card_type=fc_data.get("card_type", "concept"),
                        difficulty=fc_data.get("difficulty", 3),
                        is_active=True,
                        created_at=now - timedelta(days=28),
                    )
                    db.add(flashcard)
                    flashcards.append(flashcard)
                    kp_index += 1
            db.commit()
            print(f"      共创建 {len(flashcards)} 张闪卡。")

        # ---------------------------------------------------------------
        # 5. 创建复习计划（6 条今日到期）
        # ---------------------------------------------------------------
        print("\n[5/8] 创建复习计划 ...")
        existing_schedules = (
            db.query(ReviewSchedule).filter(ReviewSchedule.user_id == user.id).all()
        )
        if existing_schedules:
            print(f"      用户已有 {len(existing_schedules)} 条复习计划，跳过创建。")
            review_schedules = existing_schedules
        else:
            review_schedules = []
            today = date.today()
            now = datetime.now(timezone.utc)

            # 前 6 张闪卡设为今日到期
            for i, fc in enumerate(flashcards):
                if i < 6:
                    next_review = today
                    interval = 1
                    ease = 2.5
                    reps = random.randint(1, 4)
                    last_review = today - timedelta(days=interval)
                else:
                    # 其余闪卡的复习计划分散在未来几天
                    next_review = today + timedelta(days=random.randint(1, 7))
                    interval = random.randint(2, 7)
                    ease = round(random.uniform(2.2, 2.8), 2)
                    reps = random.randint(0, 3)
                    last_review = today - timedelta(days=random.randint(1, 10))

                schedule = ReviewSchedule(
                    flashcard_id=fc.id,
                    user_id=user.id,
                    ease_factor=ease,
                    interval_days=interval,
                    repetitions=reps,
                    next_review=next_review,
                    last_review=last_review,
                    memory_strength=round(random.uniform(0.6, 0.95), 2),
                    total_reviews=random.randint(2, 10),
                    created_at=now - timedelta(days=28),
                    updated_at=now - timedelta(days=1),
                )
                db.add(schedule)
                review_schedules.append(schedule)
            db.commit()
            due_today = sum(1 for s in review_schedules if s.next_review == today)
            print(
                f"      共创建 {len(review_schedules)} 条复习计划，"
                f"其中 {due_today} 条今日到期。"
            )

        # ---------------------------------------------------------------
        # 6. 创建复习历史记录（30 条，过去 30 天，评分 1-5）
        # ---------------------------------------------------------------
        print("\n[6/8] 创建复习历史记录 ...")
        existing_histories = (
            db.query(ReviewHistory)
            .join(ReviewSchedule, ReviewHistory.review_schedule_id == ReviewSchedule.id)
            .filter(ReviewSchedule.user_id == user.id)
            .count()
        )
        if existing_histories > 0:
            print(f"      用户已有 {existing_histories} 条复习历史，跳过创建。")
        else:
            now = datetime.now(timezone.utc)
            # 在已有的复习计划中循环生成 30 条历史
            for i in range(30):
                schedule = review_schedules[i % len(review_schedules)]
                # 过去 30 天内随机一天，且不晚于昨天
                days_ago = random.randint(0, 29)
                reviewed_at = now - timedelta(days=days_ago,
                                              hours=random.randint(-2, 2),
                                              minutes=random.randint(0, 59))
                # 保证不晚于当前时间
                if reviewed_at > now:
                    reviewed_at = now - timedelta(minutes=random.randint(5, 120))

                # 评分分布：偏中高，少量低分
                quality = random.choices(
                    population=[1, 2, 3, 4, 5],
                    weights=[5, 10, 20, 35, 30],
                )[0]

                history = ReviewHistory(
                    review_schedule_id=schedule.id,
                    quality=quality,
                    response_time_ms=random.randint(2000, 30000),
                    reviewed_at=reviewed_at,
                )
                db.add(history)
            db.commit()
            print(f"      共创建 30 条复习历史记录（过去 30 天，评分 1-5）。")

        # ---------------------------------------------------------------
        # 7. 创建笔记（含 [[wiki-links]]）
        # ---------------------------------------------------------------
        print("\n[7/8] 创建双链笔记 ...")
        existing_notes = db.query(Note).filter(Note.user_id == user.id).all()
        if existing_notes:
            print(f"      用户已有 {len(existing_notes)} 篇笔记，跳过创建。")
        else:
            now = datetime.now(timezone.utc)
            for n_idx, n_data in enumerate(NOTES_DATA, 1):
                note = Note(
                    user_id=user.id,
                    title=n_data["title"],
                    content=n_data["content"],
                    is_daily=False,
                    is_auto_created=False,
                    tags=n_data.get("tags", ""),
                    created_at=now - timedelta(days=6 - n_idx),
                    updated_at=now - timedelta(days=6 - n_idx),
                )
                db.add(note)
            db.commit()
            print(f"      共创建 {len(NOTES_DATA)} 篇笔记，均含 [[wiki-links]] 互链。")

        # ---------------------------------------------------------------
        # 8. 创建成就
        # ---------------------------------------------------------------
        print("\n[8/8] 创建成就 ...")
        existing_ach = (
            db.query(Achievement).filter(Achievement.user_id == user.id).count()
        )
        if existing_ach > 0:
            print(f"      用户已有 {existing_ach} 条成就记录，跳过创建。")
        else:
            now = datetime.now(timezone.utc)
            for a_data in ACHIEVEMENTS_DATA:
                ach = Achievement(
                    user_id=user.id,
                    achievement_key=a_data["key"],
                    unlocked_at=now - timedelta(days=a_data["unlocked_at_offset_days"]),
                    progress=a_data.get("progress"),
                )
                db.add(ach)
            db.commit()
            print(f"      共创建 {len(ACHIEVEMENTS_DATA)} 条已解锁成就。")

        # ---------------------------------------------------------------
        # 完成
        # ---------------------------------------------------------------
        print("\n" + "=" * 60)
        print("种子数据生成完成！")
        print(f"  演示账号：{DEMO_EMAIL} / {DEMO_PASSWORD}")
        print("=" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
