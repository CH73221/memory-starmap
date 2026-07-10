"""
示例数据填充服务
为记忆星图项目的所有功能模块创建全面的示例数据。
"""

from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta, timezone
from app.models.user import User
from app.models.material import Material
from app.models.knowledge import KnowledgePoint, KnowledgeRelation
from app.models.flashcard import Flashcard
from app.models.review import ReviewSchedule, ReviewHistory
from app.models.study_plan import StudyPlan, StudyPlanProgress
from app.models.extra import Mistake, FocusSession
from app.models.note import Note
from app.models.achievement import Achievement
from app.core.security import hash_password
import json
import random


def populate_sample_data(db: Session, user_id: int):
    """为指定用户填充全面的示例数据。"""

    # ------------------------------------------------------------------
    # 幂等检查：若已有示例数据则跳过
    # ------------------------------------------------------------------
    existing = db.query(Material).filter(
        Material.user_id == user_id,
        Material.title == "高等数学 - 微积分基础",
    ).first()
    if existing:
        return {
            "status": "skipped",
            "message": "示例数据已存在，跳过创建",
        }

    now = datetime.now(timezone.utc)
    today = date.today()
    rng = random.Random(42)  # 固定种子，保证可复现

    counts = {}

    # ==================================================================
    # 1. 学习资料 (3 个)
    # ==================================================================
    materials_data = [
        {
            "title": "高等数学 - 微积分基础",
            "file_type": "pdf",
            "file_path": "/uploads/calculus_basic.pdf",
            "raw_text": (
                "微积分（Calculus）是研究函数的微分、积分以及有关概念和应用的数学分支。"
                "微积分建立在极限概念的基础上，极限描述了函数值在自变量趋近某值时的趋势。"
                "导数刻画了函数在某一点处的变化率，微分则是导数在局部线性近似中的体现。"
                "积分研究的是函数在某区间上的累积量，与导数互为逆运算（微积分基本定理）。"
                "泰勒展开将光滑函数表示为幂级数，在近似计算中应用广泛。"
            ),
            "summary": (
                "本资料系统涵盖微积分核心概念：极限、导数、微分、积分及泰勒展开，"
                "配有大量例题与几何直观解释，适合工科与考研复习。"
            ),
            "status": "completed",
        },
        {
            "title": "计算机网络 - TCP/IP协议族",
            "file_type": "text",
            "file_path": "/uploads/tcpip_notes.txt",
            "raw_text": (
                "TCP/IP 协议族是互联网的基础通信协议集合。OSI 七层模型将网络通信划分为物理层、"
                "数据链路层、网络层、传输层、会话层、表示层和应用层。TCP 通过三次握手建立可靠连接，"
                "IP 协议负责寻址与路由。UDP 提供无连接的快速传输。HTTP 是应用层最常用的协议。"
            ),
            "summary": (
                "系统介绍 TCP/IP 协议族：OSI 七层模型、TCP 三次握手与四次挥手、"
                "IP 寻址与子网划分、UDP 与 TCP 对比、HTTP 协议原理。"
            ),
            "status": "completed",
        },
        {
            "title": "数据结构与算法 - 排序算法",
            "file_type": "pdf",
            "file_path": "/uploads/sorting_algorithms.pdf",
            "raw_text": (
                "排序算法是计算机科学中最基础的算法类别之一。冒泡排序通过相邻元素交换实现排序，"
                "时间复杂度 O(n^2)。快速排序采用分治策略，平均 O(n log n)。归并排序稳定且为 O(n log n)，"
                "需要额外空间。堆排序利用二叉堆结构，原地排序且为 O(n log n)。"
                "时间复杂度分析是评估算法效率的核心方法。"
            ),
            "summary": (
                "深入讲解冒泡排序、快速排序、归并排序、堆排序四大经典排序算法，"
                "并系统分析时间复杂度与空间复杂度，适合面试与竞赛准备。"
            ),
            "status": "completed",
        },
    ]

    materials = []
    for md in materials_data:
        m = Material(
            user_id=user_id,
            title=md["title"],
            file_path=md["file_path"],
            file_type=md["file_type"],
            raw_text=md["raw_text"],
            summary=md["summary"],
            status=md["status"],
        )
        db.add(m)
        materials.append(m)

    db.flush()
    counts["materials"] = len(materials)

    # ==================================================================
    # 2. 知识点 (15 个，分布在 3 个资料中)
    # ==================================================================
    kp_defs = [
        # ---- 微积分 (material 0) ----
        {
            "material_idx": 0, "title": "极限",
            "content": "极限是微积分的基础概念，描述函数值在自变量趋近某值时的变化趋势。"
                       "常见的极限有 lim(x→0) sin(x)/x = 1。极限的严格定义基于 ε-δ 语言。",
            "importance": 4, "mastery": 0.8,
        },
        {
            "material_idx": 0, "title": "导数",
            "content": "导数刻画函数在某一点处的瞬时变化率，几何意义为切线斜率。"
                       "f'(x) = lim(Δx→0) [f(x+Δx)-f(x)]/Δx。常见求导法则包括链式法则、乘法法则、除法法则。",
            "importance": 5, "mastery": 0.7,
        },
        {
            "material_idx": 0, "title": "微分",
            "content": "微分是导数在局部线性近似中的体现，dy = f'(x)dx。"
                       "微分用于近似计算和误差估计，是微积分基本定理的桥梁之一。",
            "importance": 4, "mastery": 0.6,
        },
        {
            "material_idx": 0, "title": "积分",
            "content": "积分研究函数在某区间上的累积量，分定积分与不定积分。"
                       "牛顿-莱布尼茨公式 ∫a→b f(x)dx = F(b)-F(a) 将微分与积分联系起来。",
            "importance": 5, "mastery": 0.5,
        },
        {
            "material_idx": 0, "title": "泰勒展开",
            "content": "泰勒展开将光滑函数在某点附近表示为幂级数："
                       "f(x) = Σ f⁽ⁿ⁾(a)/n! · (x-a)ⁿ。常用于函数近似与数值计算。",
            "importance": 3, "mastery": 0.2,
        },
        # ---- TCP/IP (material 1) ----
        {
            "material_idx": 1, "title": "OSI模型",
            "content": "OSI 七层模型将网络通信划分为：物理层、数据链路层、网络层、传输层、"
                       "会话层、表示层、应用层。每一层负责不同的通信功能，下层为上层提供服务。",
            "importance": 4, "mastery": 0.9,
        },
        {
            "material_idx": 1, "title": "TCP三次握手",
            "content": "TCP 通过三次握手建立可靠连接：1) 客户端发送 SYN；"
                       "2) 服务端回复 SYN+ACK；3) 客户端发送 ACK。确保双方收发能力正常。",
            "importance": 5, "mastery": 0.7,
        },
        {
            "material_idx": 1, "title": "IP寻址",
            "content": "IP 地址是网络层用于标识设备的逻辑地址。IPv4 为 32 位，分为 A/B/C/D/E 五类。"
                       "子网掩码划分网络位与主机位，CIDR 表示法如 192.168.1.0/24。",
            "importance": 4, "mastery": 0.6,
        },
        {
            "material_idx": 1, "title": "UDP vs TCP",
            "content": "TCP 面向连接、可靠传输、有序到达，开销大；UDP 无连接、不可靠、"
                       "无序，但速度快、开销小。视频流、DNS 等常用 UDP，文件传输用 TCP。",
            "importance": 3, "mastery": 0.5,
        },
        {
            "material_idx": 1, "title": "HTTP协议",
            "content": "HTTP 是应用层超文本传输协议，基于请求-响应模型。"
                       "常见方法有 GET、POST、PUT、DELETE。HTTP/1.1 支持持久连接，"
                       "HTTPS 通过 TLS 加密保障安全。",
            "importance": 4, "mastery": 0.3,
        },
        # ---- 排序算法 (material 2) ----
        {
            "material_idx": 2, "title": "冒泡排序",
            "content": "冒泡排序通过重复遍历、比较相邻元素并交换，将最大值「冒泡」到末尾。"
                       "时间复杂度 O(n²)，空间 O(1)，稳定排序。简单但效率低。",
            "importance": 3, "mastery": 0.9,
        },
        {
            "material_idx": 2, "title": "快速排序",
            "content": "快速排序采用分治策略：选取基准元素 pivot，将数组分为小于和大于 pivot 两部分，"
                       "递归排序。平均时间复杂度 O(n log n)，最坏 O(n²)，原地排序，不稳定。",
            "importance": 5, "mastery": 0.7,
        },
        {
            "material_idx": 2, "title": "归并排序",
            "content": "归并排序将数组递归分成两半，分别排序后合并。"
                       "时间复杂度始终 O(n log n)，稳定排序，但需要 O(n) 额外空间。",
            "importance": 4, "mastery": 0.6,
        },
        {
            "material_idx": 2, "title": "堆排序",
            "content": "堆排序利用二叉堆数据结构，先建最大堆，再反复取出堆顶元素。"
                       "时间复杂度 O(n log n)，原地排序，不稳定。适合大数据量排序。",
            "importance": 4, "mastery": 0.4,
        },
        {
            "material_idx": 2, "title": "时间复杂度",
            "content": "时间复杂度用大 O 记号描述算法运行时间随输入规模的增长趋势。"
                       "常见量级：O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)。"
                       "是评估算法效率的核心指标。",
            "importance": 5, "mastery": 0.5,
        },
    ]

    kp_map = {}  # title -> KnowledgePoint
    kps = []
    for kd in kp_defs:
        kp = KnowledgePoint(
            material_id=materials[kd["material_idx"]].id,
            user_id=user_id,
            title=kd["title"],
            content=kd["content"],
            importance=kd["importance"],
            mastery_level=kd["mastery"],
            review_count=rng.randint(3, 20),
            consecutive_wrong=rng.randint(0, 2),
            last_reviewed_at=now - timedelta(days=rng.randint(0, 6)),
        )
        db.add(kp)
        kps.append(kp)
        kp_map[kd["title"]] = kp

    db.flush()
    counts["knowledge_points"] = len(kps)

    # ==================================================================
    # 3. 知识点关系
    # ==================================================================
    relation_defs = [
        ("极限", "导数", "prerequisite", "极限是理解导数定义的前提"),
        ("导数", "微分", "related", "微分是导数的线性近似体现"),
        ("微分", "积分", "prerequisite", "微分与积分通过基本定理联系"),
        ("导数", "泰勒展开", "prerequisite", "泰勒展开依赖于各阶导数"),
        ("OSI模型", "TCP三次握手", "related", "TCP 属于 OSI 传输层"),
        ("IP寻址", "UDP vs TCP", "related", "IP 与 TCP/UDP 共同构成协议栈"),
        ("TCP三次握手", "HTTP协议", "prerequisite", "HTTP 基于 TCP 连接传输"),
        ("冒泡排序", "快速排序", "similar", "两者均为比较排序，快速排序是冒泡的改进"),
        ("快速排序", "归并排序", "similar", "两者均为分治排序算法"),
        ("归并排序", "堆排序", "similar", "两者时间复杂度均为 O(n log n)"),
        ("快速排序", "时间复杂度", "part_of", "快速排序是时间复杂度分析的典型案例"),
    ]

    for src_title, tgt_title, rtype, desc in relation_defs:
        rel = KnowledgeRelation(
            source_id=kp_map[src_title].id,
            target_id=kp_map[tgt_title].id,
            relation_type=rtype,
            description=desc,
        )
        db.add(rel)

    db.flush()
    counts["knowledge_relations"] = len(relation_defs)

    # ==================================================================
    # 4. 闪卡 (20 个)
    # ==================================================================
    # 每条: (kp_title, question, answer, card_type, difficulty)
    flashcard_defs = [
        # 极限 (1)
        ("极限", "lim(x→0) sin(x)/x 的值是多少？", "1", "qa", 3),
        # 导数 (2)
        ("导数", "导数的几何意义是什么？", "函数在某点的切线斜率", "definition", 3),
        ("导数", "f(x) = x³ 的导数 f'(x) = ____", "3x²", "fill_blank", 4),
        # 微分 (1)
        ("微分", "dy = f'(x)dx 中，dx 代表什么？", "自变量 x 的微小增量", "qa", 3),
        # 积分 (2)
        ("积分", "牛顿-莱布尼茨公式的内容是什么？", "∫a→b f(x)dx = F(b) - F(a)，其中 F 是 f 的原函数", "definition", 4),
        ("积分", "∫ 2x dx = ____ + C", "x²", "fill_blank", 3),
        # 泰勒展开 (1)
        ("泰勒展开", "写出 e^x 在 x=0 处的泰勒展开式（前4项）", "e^x ≈ 1 + x + x²/2! + x³/3!", "qa", 5),
        # OSI模型 (1)
        ("OSI模型", "OSI 模型共有几层？从下到上依次是？", "七层：物理层、数据链路层、网络层、传输层、会话层、表示层、应用层", "definition", 3),
        # TCP三次握手 (2)
        ("TCP三次握手", "TCP 三次握手的第二步发送的是什么报文？", "SYN+ACK 报文", "qa", 4),
        ("TCP三次握手", "TCP 建立连接需要 ____ 次握手", "3", "fill_blank", 3),
        # IP寻址 (1)
        ("IP寻址", "IPv4 地址有多少位？", "32 位", "definition", 3),
        # UDP vs TCP (1)
        ("UDP vs TCP", "TCP 和 UDP 哪个是面向连接的？", "TCP 是面向连接的，UDP 是无连接的", "qa", 3),
        # HTTP协议 (1)
        ("HTTP协议", "HTTP 中 GET 和 POST 的主要区别是什么？", "GET 用于获取资源（参数在 URL），POST 用于提交数据（参数在请求体）", "qa", 4),
        # 冒泡排序 (1)
        ("冒泡排序", "冒泡排序的时间复杂度是多少？", "O(n²)", "definition", 2),
        # 快速排序 (2)
        ("快速排序", "快速排序的平均时间复杂度是多少？", "O(n log n)", "qa", 4),
        ("快速排序", "快速排序的最坏时间复杂度是 O(____)", "n²", "fill_blank", 4),
        # 归并排序 (1)
        ("归并排序", "归并排序是否稳定排序？空间复杂度是多少？", "是稳定排序，空间复杂度 O(n)", "qa", 4),
        # 堆排序 (1)
        ("堆排序", "堆排序的时间复杂度和空间复杂度分别是多少？", "时间 O(n log n)，空间 O(1)（原地排序）", "definition", 4),
        # 时间复杂度 (2)
        ("时间复杂度", "O(n log n) 和 O(n²) 哪个更快？", "O(n log n) 更快，因为增长更慢", "qa", 3),
        ("时间复杂度", "二分查找的时间复杂度是 O(____)", "log n", "fill_blank", 4),
    ]

    flashcards = []
    for kp_title, question, answer, ctype, diff in flashcard_defs:
        fc = Flashcard(
            knowledge_point_id=kp_map[kp_title].id,
            user_id=user_id,
            question=question,
            answer=answer,
            card_type=ctype,
            difficulty=diff,
            is_active=True,
        )
        db.add(fc)
        flashcards.append(fc)

    db.flush()
    counts["flashcards"] = len(flashcards)

    # ==================================================================
    # 5. 复习计划 (20 个) - 每张闪卡一个
    # ==================================================================
    schedules = []
    for i, fc in enumerate(flashcards):
        days_ahead = i % 8  # 0-7 天，分布在未来一周
        reps = rng.randint(1, 6)
        schedule = ReviewSchedule(
            flashcard_id=fc.id,
            user_id=user_id,
            ease_factor=round(rng.uniform(1.3, 2.8), 2),
            interval_days=rng.randint(1, 7),
            repetitions=reps,
            next_review=today + timedelta(days=days_ahead),
            last_review=today - timedelta(days=rng.randint(0, 5)),
            memory_strength=round(rng.uniform(0.3, 1.0), 2),
            total_reviews=reps,
        )
        db.add(schedule)
        schedules.append(schedule)

    db.flush()
    counts["review_schedules"] = len(schedules)

    # ==================================================================
    # 6. 复习历史 (30 条) - 过去 7 天
    # ==================================================================
    histories = []
    for _ in range(30):
        sched = rng.choice(schedules)
        days_ago = rng.randint(0, 6)
        histories.append(ReviewHistory(
            review_schedule_id=sched.id,
            quality=rng.randint(0, 5),
            response_time_ms=rng.randint(2000, 30000),
            reviewed_at=now - timedelta(days=days_ago, hours=rng.randint(0, 23)),
        ))
        db.add(histories[-1])

    db.flush()
    counts["review_histories"] = len(histories)

    # ==================================================================
    # 7. 学习计划 (3 个)
    # ==================================================================
    plan_defs = [
        {
            "title": "微积分30天冲刺",
            "description": "30 天内系统复习微积分核心知识点，攻克极限、导数、积分与泰勒展开。",
            "target_type": "flashcards",
            "target_material_id": None,
            "target_count": 50,
            "daily_target": 10,
            "duration_days": 30,
            "status": "active",
            "icon": "📚",
            "color": "indigo",
        },
        {
            "title": "TCP/IP协议精读",
            "description": "14 天精读 TCP/IP 协议族，深入理解网络通信原理。",
            "target_type": "material",
            "target_material_id": materials[1].id,
            "target_count": 30,
            "daily_target": 5,
            "duration_days": 14,
            "status": "active",
            "icon": "🌐",
            "color": "blue",
        },
        {
            "title": "算法面试准备",
            "description": "60 天系统准备算法面试，覆盖排序、搜索、动态规划等高频考点。",
            "target_type": "knowledge",
            "target_material_id": None,
            "target_count": 100,
            "daily_target": 8,
            "duration_days": 60,
            "status": "paused",
            "icon": "💻",
            "color": "green",
        },
    ]

    plans = []
    for pd in plan_defs:
        plan = StudyPlan(
            user_id=user_id,
            title=pd["title"],
            description=pd["description"],
            target_type=pd["target_type"],
            target_material_id=pd["target_material_id"],
            target_count=pd["target_count"],
            daily_target=pd["daily_target"],
            duration_days=pd["duration_days"],
            start_date=today - timedelta(days=7),
            end_date=today - timedelta(days=7) + timedelta(days=pd["duration_days"]),
            status=pd["status"],
            icon=pd["icon"],
            color=pd["color"],
        )
        db.add(plan)
        plans.append(plan)

    db.flush()
    counts["study_plans"] = len(plans)

    # ==================================================================
    # 8. 学习计划进度 (每个计划 7 天)
    # ==================================================================
    progress_records = []
    for plan in plans:
        for d in range(7):
            pdate = today - timedelta(days=6 - d)
            completed = rng.randint(2, plan.daily_target)
            progress_records.append(StudyPlanProgress(
                plan_id=plan.id,
                progress_date=pdate,
                completed_count=completed,
                target_count=plan.daily_target,
                is_completed=completed >= plan.daily_target,
                note="坚持打卡！" if completed >= plan.daily_target else "今天差一点，明天加油",
            ))
            db.add(progress_records[-1])

    db.flush()
    counts["study_plan_progress"] = len(progress_records)

    # ==================================================================
    # 9. 错题 (8 个) - 混合 resolved / unresolved，各种 diagnosis
    # ==================================================================
    mistake_defs = [
        {
            "flashcard_idx": 6,  # 泰勒展开
            "question": "写出 e^x 在 x=0 处的泰勒展开式（前4项）",
            "user_answer": "1 + x + x²/2 + x³/3",
            "correct_answer": "e^x ≈ 1 + x + x²/2! + x³/3!",
            "diagnosis": "concept_misunderstanding",
            "ai_explanation": "你遗漏了阶乘符号。泰勒展开中分母是 n!，不是 n。建议重新理解泰勒级数的通项公式。",
            "related_kp": "泰勒展开",
            "resolved": False,
        },
        {
            "flashcard_idx": 1,  # 导数几何意义
            "question": "导数的几何意义是什么？",
            "user_answer": "函数的变化量",
            "correct_answer": "函数在某点的切线斜率",
            "diagnosis": "concept_misunderstanding",
            "ai_explanation": "你理解的方向偏了。导数的几何意义是切线斜率，而非简单的变化量。建议结合图像理解。",
            "related_kp": "导数",
            "resolved": True,
        },
        {
            "flashcard_idx": 14,  # 快速排序最坏复杂度
            "question": "快速排序的最坏时间复杂度是 O(____)",
            "user_answer": "n log n",
            "correct_answer": "n²",
            "diagnosis": "memory_decay",
            "ai_explanation": "快速排序最坏情况（数组已有序）退化为 O(n²)。你可能记忆衰退了，建议复习快速排序的分区过程。",
            "related_kp": "快速排序",
            "resolved": False,
        },
        {
            "flashcard_idx": 8,  # TCP 第二步
            "question": "TCP 三次握手的第二步发送的是什么报文？",
            "user_answer": "SYN+ACK 报文",
            "correct_answer": "SYN+ACK 报文",
            "diagnosis": "careless",
            "ai_explanation": "你的答案正确，但之前答错过。属于粗心类错误，审题时注意区分 SYN、ACK、SYN+ACK。",
            "related_kp": "TCP三次握手",
            "resolved": True,
        },
        {
            "flashcard_idx": 12,  # HTTP GET vs POST
            "question": "HTTP 中 GET 和 POST 的主要区别是什么？",
            "user_answer": "",
            "correct_answer": "GET 用于获取资源（参数在 URL），POST 用于提交数据（参数在请求体）",
            "diagnosis": "memory_decay",
            "ai_explanation": "你完全没有记忆痕迹。建议先理解 HTTP 请求方法的核心区别，再用闪卡强化记忆。",
            "related_kp": "HTTP协议",
            "resolved": False,
        },
        {
            "flashcard_idx": 3,  # 微分 dx
            "question": "dy = f'(x)dx 中，dx 代表什么？",
            "user_answer": "导数",
            "correct_answer": "自变量 x 的微小增量",
            "diagnosis": "concept_misunderstanding",
            "ai_explanation": "dx 代表自变量的微小增量，而非导数。混淆了微分记号中的各部分含义，建议重新学习微分定义。",
            "related_kp": "微分",
            "resolved": False,
        },
        {
            "flashcard_idx": 17,  # 堆排序复杂度
            "question": "堆排序的时间复杂度和空间复杂度分别是多少？",
            "user_answer": "时间 O(n log n)，空间 O(n)",
            "correct_answer": "时间 O(n log n)，空间 O(1)（原地排序）",
            "diagnosis": "careless",
            "ai_explanation": "堆排序是原地排序，空间复杂度为 O(1) 而非 O(n)。你可能和归并排序混淆了。",
            "related_kp": "堆排序",
            "resolved": True,
        },
        {
            "flashcard_idx": 19,  # 二分查找复杂度
            "question": "二分查找的时间复杂度是 O(____)",
            "user_answer": "n",
            "correct_answer": "log n",
            "diagnosis": "unknown",
            "ai_explanation": "二分查找每次将搜索范围减半，时间复杂度为 O(log n)。建议复习对数时间复杂度的典型算法。",
            "related_kp": "时间复杂度",
            "resolved": False,
        },
    ]

    for md in mistake_defs:
        fc = flashcards[md["flashcard_idx"]]
        kp = kp_map[md["related_kp"]]
        mistake = Mistake(
            user_id=user_id,
            flashcard_id=fc.id,
            question=md["question"],
            user_answer=md["user_answer"],
            correct_answer=md["correct_answer"],
            diagnosis=md["diagnosis"],
            ai_explanation=md["ai_explanation"],
            related_knowledge_ids=str(kp.id),
            resolved=md["resolved"],
            resolved_at=(now - timedelta(days=rng.randint(1, 5))) if md["resolved"] else None,
            correct_count=2 if md["resolved"] else 0,
        )
        db.add(mistake)

    db.flush()
    counts["mistakes"] = len(mistake_defs)

    # ==================================================================
    # 10. 专注会话 (10 个) - 过去 7 天番茄钟
    # ==================================================================
    ambient_sounds = ["none", "rain", "forest", "ocean", "cafe", "white_noise"]
    focus_sessions = []
    for i in range(10):
        duration = rng.randint(15, 50)
        days_ago = rng.randint(0, 6)
        started = now - timedelta(days=days_ago, hours=rng.randint(8, 22))
        focus_sessions.append(FocusSession(
            user_id=user_id,
            duration_minutes=duration,
            completed=True,
            ambient_sound=rng.choice(ambient_sounds),
            xp_earned=duration * 2,
            started_at=started,
            ended_at=started + timedelta(minutes=duration),
            notes=rng.choice([
                "专注度很高，进入心流状态",
                "稍微分心，但坚持完成了",
                "效率不错，完成了计划任务",
                None,
            ]),
        ))
        db.add(focus_sessions[-1])

    db.flush()
    counts["focus_sessions"] = len(focus_sessions)

    # ==================================================================
    # 11. 笔记 (14 个) - 含丰富的双链 [[笔记标题]] 交叉引用
    # ==================================================================
    note_defs = [
        {
            "title": "微积分学习笔记",
            "content": (
                "# 微积分学习笔记\n\n"
                "微积分的核心在于理解极限思想，由极限推出导数，再由导数得到微分与积分。\n\n"
                "## 关键公式\n"
                "- 导数定义：f'(x) = lim(Δx→0) [f(x+Δx)-f(x)]/Δx\n"
                "- 牛顿-莱布尼茨公式：∫a→b f(x)dx = F(b)-F(a)\n"
                "- 泰勒展开：f(x) = Σ f⁽ⁿ⁾(a)/n! · (x-a)ⁿ\n\n"
                "## 关联笔记\n"
                "- 极限的严格定义见 [[极限理论笔记]]\n"
                "- 导数与微分的关联见 [[导数与微分笔记]]\n"
                "- 积分技巧见 [[积分技巧笔记]]\n"
                "- 泰勒展开的难点见 [[泰勒展开笔记]]\n"
                "- 跨学科关联见 [[知识点关联思考]]\n"
                "- 对照学习方法参考 [[TCP/IP协议总结]]"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "数学,微积分",
        },
        {
            "title": "极限理论笔记",
            "content": (
                "# 极限理论笔记\n\n"
                "极限是微积分的基础概念，描述函数值在自变量趋近某值时的变化趋势。\n"
                "严格的 ε-δ 定义：∀ε>0, ∃δ>0, 使得 0<|x-a|<δ 时 |f(x)-L|<ε。\n\n"
                "## 常见极限\n"
                "- lim(x→0) sin(x)/x = 1\n"
                "- lim(n→∞) (1+1/n)ⁿ = e\n"
                "- lim(x→0) (eˣ-1)/x = 1\n\n"
                "## 关联\n"
                "极限思想是 [[微积分学习笔记]] 的起点，\n"
                "也与 [[导数与微分笔记]] 中的导数定义密切相关。\n"
                "在 [[知识点关联思考]] 中探讨了极限与算法复杂度的哲学联系。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "数学,极限",
        },
        {
            "title": "导数与微分笔记",
            "content": (
                "# 导数与微分笔记\n\n"
                "导数刻画函数在某一点处的瞬时变化率，几何意义为切线斜率。\n"
                "微分是导数在局部线性近似中的体现，dy = f'(x)dx。\n\n"
                "## 求导法则\n"
                "- 链式法则：(fg)' = f'g + fg'\n"
                "- 乘法法则：(uv)' = u'v + uv'\n"
                "- 除法法则：(u/v)' = (u'v - uv')/v²\n\n"
                "## 关联\n"
                "导数定义基于 [[极限理论笔记]] 中的极限概念。\n"
                "导数的应用见 [[微积分学习笔记]] 和 [[泰勒展开笔记]]。\n"
                "积分是导数的逆运算，详见 [[积分技巧笔记]]。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "数学,导数",
        },
        {
            "title": "积分技巧笔记",
            "content": (
                "# 积分技巧笔记\n\n"
                "积分研究函数在某区间上的累积量，分定积分与不定积分。\n"
                "牛顿-莱布尼茨公式：∫a→b f(x)dx = F(b)-F(a)\n\n"
                "## 常用积分法\n"
                "- 换元法：∫f(g(x))g'(x)dx = ∫f(u)du\n"
                "- 分部积分：∫u dv = uv - ∫v du\n"
                "- 部分分式分解\n\n"
                "## 关联\n"
                "积分是 [[导数与微分笔记]] 中导数的逆运算。\n"
                "更多基础概念见 [[微积分学习笔记]]。\n"
                "泰勒展开与积分的关系见 [[泰勒展开笔记]]。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "数学,积分",
        },
        {
            "title": "泰勒展开笔记",
            "content": (
                "# 泰勒展开笔记\n\n"
                "泰勒展开将光滑函数在某点附近表示为幂级数：\n"
                "f(x) = Σ f⁽ⁿ⁾(a)/n! · (x-a)ⁿ\n\n"
                "## 常见展开\n"
                "- eˣ = 1 + x + x²/2! + x³/3! + ...\n"
                "- sin(x) = x - x³/3! + x⁵/5! - ...\n"
                "- cos(x) = 1 - x²/2! + x⁴/4! - ...\n"
                "- ln(1+x) = x - x²/2 + x³/3 - ...\n\n"
                "## 关联\n"
                "泰勒展开依赖 [[导数与微分笔记]] 中的高阶导数。\n"
                "是 [[微积分学习笔记]] 中的重要应用。\n"
                "与 [[积分技巧笔记]] 的级数积分相关。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "数学,泰勒",
        },
        {
            "title": "TCP/IP协议总结",
            "content": (
                "# TCP/IP 协议总结\n\n"
                "网络通信的基础是 OSI 七层模型，TCP/IP 协议族是其简化实现。\n\n"
                "## 关键点\n"
                "- TCP 三次握手建立可靠连接\n"
                "- IP 协议负责网络层寻址与路由\n"
                "- HTTP 运行在应用层，依赖 TCP\n\n"
                "## TCP vs UDP\n"
                "TCP 可靠但慢，UDP 快但不可靠。\n\n"
                "## 关联笔记\n"
                "- 七层模型详解见 [[OSI七层模型笔记]]\n"
                "- HTTP 协议细节见 [[HTTP协议详解笔记]]\n"
                "- 实践经验见 [[网络编程实践笔记]]\n"
                "- 对照学习方法参考 [[微积分学习笔记]]\n"
                "- 面试相关见 [[面试准备笔记]]"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "网络,协议",
        },
        {
            "title": "OSI七层模型笔记",
            "content": (
                "# OSI 七层模型笔记\n\n"
                "OSI 模型将网络通信划分为七层：\n"
                "1. 物理层 - 比特传输\n"
                "2. 数据链路层 - 帧传输\n"
                "3. 网络层 - IP 寻址与路由\n"
                "4. 传输层 - TCP/UDP 端到端通信\n"
                "5. 会话层 - 会话管理\n"
                "6. 表示层 - 数据格式转换\n"
                "7. 应用层 - HTTP/FTP/SMTP\n\n"
                "## 关联\n"
                "OSI 是 [[TCP/IP协议总结]] 的理论基础。\n"
                "HTTP 位于第 7 层，详见 [[HTTP协议详解笔记]]。\n"
                "实际编程涉及传输层，见 [[网络编程实践笔记]]。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "网络,OSI",
        },
        {
            "title": "HTTP协议详解笔记",
            "content": (
                "# HTTP 协议详解笔记\n\n"
                "HTTP 是应用层协议，基于 TCP 可靠传输。\n\n"
                "## 请求方法\n"
                "- GET：获取资源\n"
                "- POST：提交数据\n"
                "- PUT/PATCH：更新资源\n"
                "- DELETE：删除资源\n\n"
                "## 状态码\n"
                "- 2xx 成功（200 OK）\n"
                "- 3xx 重定向（301/302）\n"
                "- 4xx 客户端错误（404/403）\n"
                "- 5xx 服务器错误（500/502）\n\n"
                "## 关联\n"
                "HTTP 依赖 TCP，详见 [[TCP/IP协议总结]] 和 [[OSI七层模型笔记]]。\n"
                "网络编程中常涉及 HTTP，见 [[网络编程实践笔记]]。\n"
                "面试常考，见 [[面试准备笔记]]。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "网络,HTTP",
        },
        {
            "title": "网络编程实践笔记",
            "content": (
                "# 网络编程实践笔记\n\n"
                "## Socket 编程\n"
                "Socket 是网络通信的端点，分为 TCP Socket 和 UDP Socket。\n\n"
                "## TCP 服务端流程\n"
                "1. socket() 创建套接字\n"
                "2. bind() 绑定地址和端口\n"
                "3. listen() 监听连接\n"
                "4. accept() 接受连接\n"
                "5. recv()/send() 收发数据\n\n"
                "## 关联\n"
                "实践基于 [[TCP/IP协议总结]] 的理论知识。\n"
                "需要理解 [[OSI七层模型笔记]] 的传输层概念。\n"
                "HTTP 服务端也基于 Socket，见 [[HTTP协议详解笔记]]。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "网络,编程",
        },
        {
            "title": "算法学习心得",
            "content": (
                "# 算法学习心得\n\n"
                "排序算法是算法入门的基础，从冒泡排序到快速排序，难度递增。\n\n"
                "## 复杂度对比\n"
                "| 算法 | 平均时间 | 最坏时间 | 空间 | 稳定 |\n"
                "|------|---------|---------|------|------|\n"
                "| 冒泡 | O(n²)   | O(n²)   | O(1) | 是   |\n"
                "| 快排 | O(nlogn)| O(n²)   | O(1) | 否   |\n"
                "| 归并 | O(nlogn)| O(nlogn)| O(n) | 是   |\n"
                "| 堆排 | O(nlogn)| O(nlogn)| O(1) | 否   |\n\n"
                "## 关联笔记\n"
                "- 各排序算法详解见 [[排序算法对比笔记]]\n"
                "- 复杂度分析方法见 [[时间复杂度分析笔记]]\n"
                "- 面试准备见 [[面试准备笔记]]\n"
                "- 跨学科思考见 [[知识点关联思考]]"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "算法,面试",
        },
        {
            "title": "排序算法对比笔记",
            "content": (
                "# 排序算法对比笔记\n\n"
                "## 冒泡排序\n"
                "相邻元素比较交换，每轮将最大元素冒泡到末尾。简单但效率低。\n\n"
                "## 快速排序\n"
                "选取基准元素，分区递归。平均 O(nlogn) 但最坏 O(n²)。\n\n"
                "## 归并排序\n"
                "分治法，先拆分再合并。稳定排序，需要额外 O(n) 空间。\n\n"
                "## 堆排序\n"
                "利用二叉堆结构，原地排序，O(nlogn)。\n\n"
                "## 关联\n"
                "总体心得见 [[算法学习心得]]。\n"
                "复杂度分析见 [[时间复杂度分析笔记]]。\n"
                "面试常考，见 [[面试准备笔记]]。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "算法,排序",
        },
        {
            "title": "时间复杂度分析笔记",
            "content": (
                "# 时间复杂度分析笔记\n\n"
                "时间复杂度用大 O 记号描述算法运行时间随输入规模的增长趋势。\n\n"
                "## 常见复杂度\n"
                "- O(1) 常数 — 哈希表查找\n"
                "- O(logn) 对数 — 二分查找\n"
                "- O(n) 线性 — 遍历数组\n"
                "- O(nlogn) 线性对数 — 快排/归并\n"
                "- O(n²) 平方 — 冒泡/选择排序\n"
                "- O(2ⁿ) 指数 — 递归斐波那契\n\n"
                "## 关联\n"
                "复杂度分析是 [[算法学习心得]] 的核心技能。\n"
                "各排序算法的复杂度对比见 [[排序算法对比笔记]]。\n"
                "与 [[极限理论笔记]] 中的极限思想有哲学联系，见 [[知识点关联思考]]。"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "算法,复杂度",
        },
        {
            "title": "面试准备笔记",
            "content": (
                "# 面试准备笔记\n\n"
                "## 高频考点\n"
                "- 数据结构：数组、链表、栈、队列、树、图、堆\n"
                "- 算法：排序、搜索、动态规划、贪心、回溯\n"
                "- 网络：TCP/IP、HTTP、OSI 模型\n"
                "- 数学：微积分基础、概率统计\n\n"
                "## 复习路线\n"
                "1. 算法刷题（每天 2-3 题）\n"
                "2. 网络知识复习\n"
                "3. 项目经验整理\n"
                "4. 模拟面试\n\n"
                "## 关联笔记\n"
                "- 算法复习见 [[算法学习心得]] 和 [[排序算法对比笔记]]\n"
                "- 网络复习见 [[TCP/IP协议总结]] 和 [[HTTP协议详解笔记]]\n"
                "- 数学复习见 [[微积分学习笔记]]\n"
                "- 复杂度分析见 [[时间复杂度分析笔记]]\n"
                "- 学习方法论见 [[知识点关联思考]]\n"
                "- 时间规划见 [[考研复习计划]]"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "面试,求职",
        },
        {
            "title": "知识点关联思考",
            "content": (
                "# 知识点关联思考\n\n"
                "## 跨学科关联\n"
                "数学中的极限思想与算法中的时间复杂度有异曲同工之妙——"
                "都是研究趋近过程中的行为。\n\n"
                "## 学习方法论\n"
                "1. 先建立整体框架（如 OSI 七层结构）\n"
                "2. 再深入细节（如 TCP 三次握手的每一步）\n"
                "3. 最后建立关联（如导数→微分→积分的递进关系）\n\n"
                "## 记忆策略\n"
                "- 利用知识图谱可视化关联\n"
                "- 用闪卡进行间隔重复\n"
                "- 错题本针对性复习薄弱点\n\n"
                "## 关联笔记\n"
                "- 数学体系：[[微积分学习笔记]] → [[极限理论笔记]] → [[导数与微分笔记]]\n"
                "- 网络体系：[[TCP/IP协议总结]] → [[OSI七层模型笔记]] → [[HTTP协议详解笔记]]\n"
                "- 算法体系：[[算法学习心得]] → [[排序算法对比笔记]] → [[时间复杂度分析笔记]]\n"
                "- 综合准备：[[面试准备笔记]] 和 [[考研复习计划]]"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "方法论",
        },
        {
            "title": "今日学习记录",
            "content": (
                "# 今日学习记录\n\n"
                "## 完成内容\n"
                "- 复习了微积分的导数与积分部分\n"
                "- 完成了 3 个番茄钟专注学习\n"
                "- 整理了 TCP/IP 的笔记\n\n"
                "## 明日计划\n"
                "- 继续复习泰勒展开\n"
                "- 练习快速排序的代码实现\n"
                "- 复习错题本中的 HTTP 协议相关题目\n\n"
                "## 关联\n"
                "微积分复习参考 [[微积分学习笔记]] 和 [[导数与微分笔记]]\n"
                "网络复习参考 [[TCP/IP协议总结]] 和 [[HTTP协议详解笔记]]\n"
                "算法练习参考 [[排序算法对比笔记]]\n"
                "整体规划见 [[考研复习计划]] 和 [[面试准备笔记]]"
            ),
            "is_daily": True,
            "is_auto_created": False,
            "tags": "日记",
        },
        {
            "title": "考研复习计划",
            "content": (
                "# 考研复习计划\n\n"
                "## 总体安排\n"
                "- 数学：重点复习微积分，每天 2 小时\n"
                "- 计算机：网络 + 算法，每天 1.5 小时\n"
                "- 英语：每天 1 小时背单词\n\n"
                "## 阶段目标\n"
                "1. 基础阶段（现在 - 8月）：过一遍教材，建立知识框架\n"
                "2. 强化阶段（9月 - 10月）：刷题，查漏补缺\n"
                "3. 冲刺阶段（11月 - 12月）：真题模拟，保持手感\n\n"
                "## 关联笔记\n"
                "数学复习路线：[[微积分学习笔记]] → [[极限理论笔记]] → [[导数与微分笔记]] → [[积分技巧笔记]] → [[泰勒展开笔记]]\n"
                "网络复习路线：[[TCP/IP协议总结]] → [[OSI七层模型笔记]] → [[HTTP协议详解笔记]] → [[网络编程实践笔记]]\n"
                "算法复习路线：[[算法学习心得]] → [[排序算法对比笔记]] → [[时间复杂度分析笔记]]\n"
                "面试准备：[[面试准备笔记]]\n"
                "方法论：[[知识点关联思考]]"
            ),
            "is_daily": False,
            "is_auto_created": False,
            "tags": "考研",
        },
    ]

    for nd in note_defs:
        note = Note(
            user_id=user_id,
            title=nd["title"],
            content=nd["content"],
            is_daily=nd["is_daily"],
            is_auto_created=nd["is_auto_created"],
            tags=nd["tags"],
        )
        db.add(note)

    db.flush()
    counts["notes"] = len(note_defs)

    # ==================================================================
    # 12. 成就 (20 个：5 已解锁 + 15 未解锁)
    # ==================================================================
    unlocked_achievements = [
        {
            "achievement_key": "first_review",
            "unlocked_at": now - timedelta(days=7),
            "progress": {"target": 1, "current": 1, "description": "完成第一次复习"},
        },
        {
            "achievement_key": "streak_7",
            "unlocked_at": now - timedelta(days=1),
            "progress": {"target": 7, "current": 7, "description": "连续学习 7 天"},
        },
        {
            "achievement_key": "cards_50",
            "unlocked_at": now - timedelta(days=3),
            "progress": {"target": 50, "current": 50, "description": "创建 50 张闪卡"},
        },
        {
            "achievement_key": "mastery_10",
            "unlocked_at": now - timedelta(days=2),
            "progress": {"target": 10, "current": 10, "description": "掌握 10 个知识点"},
        },
        {
            "achievement_key": "early_bird",
            "unlocked_at": now - timedelta(days=5),
            "progress": {"target": 1, "current": 1, "description": "早上 7 点前开始学习"},
        },
    ]

    locked_achievements = [
        {"achievement_key": "streak_30", "progress": {"target": 30, "current": 7, "description": "连续学习 30 天"}},
        {"achievement_key": "streak_100", "progress": {"target": 100, "current": 7, "description": "连续学习 100 天"}},
        {"achievement_key": "cards_100", "progress": {"target": 100, "current": 20, "description": "创建 100 张闪卡"}},
        {"achievement_key": "cards_500", "progress": {"target": 500, "current": 20, "description": "创建 500 张闪卡"}},
        {"achievement_key": "mastery_50", "progress": {"target": 50, "current": 10, "description": "掌握 50 个知识点"}},
        {"achievement_key": "mastery_100", "progress": {"target": 100, "current": 10, "description": "掌握 100 个知识点"}},
        {"achievement_key": "focus_1h", "progress": {"target": 60, "current": 25, "description": "单日专注 1 小时"}},
        {"achievement_key": "focus_10h", "progress": {"target": 600, "current": 150, "description": "累计专注 10 小时"}},
        {"achievement_key": "night_owl", "progress": {"target": 1, "current": 0, "description": "深夜 11 点后学习"}},
        {"achievement_key": "perfectionist", "progress": {"target": 20, "current": 8, "description": "连续 20 次答对"}},
        {"achievement_key": "speed_demon", "progress": {"target": 10, "current": 3, "description": "10 秒内答对 10 次"}},
        {"achievement_key": "knowledge_explorer", "progress": {"target": 5, "current": 3, "description": "学习 5 个不同学科"}},
        {"achievement_key": "material_master", "progress": {"target": 10, "current": 3, "description": "完成 10 份学习资料"}},
        {"achievement_key": "note_taker", "progress": {"target": 30, "current": 6, "description": "创建 30 篇笔记"}},
        {"achievement_key": "plan_completer", "progress": {"target": 1, "current": 0, "description": "完成一个学习计划"}},
    ]

    achievement_count = 0
    for ua in unlocked_achievements:
        db.add(Achievement(
            user_id=user_id,
            achievement_key=ua["achievement_key"],
            unlocked_at=ua["unlocked_at"],
            progress=ua["progress"],
        ))
        achievement_count += 1

    for la in locked_achievements:
        db.add(Achievement(
            user_id=user_id,
            achievement_key=la["achievement_key"],
            unlocked_at=None,
            progress=la["progress"],
        ))
        achievement_count += 1

    db.flush()
    counts["achievements"] = achievement_count

    # ==================================================================
    # 提交
    # ==================================================================
    db.commit()

    return {
        "status": "success",
        "message": "示例数据创建完成",
        "user_id": user_id,
        "counts": counts,
    }
