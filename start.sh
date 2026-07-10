#!/bin/bash
echo "========================================"
echo "  记忆星图 - AI 智能复习引擎"
echo "========================================"
echo ""

echo "[1/2] 启动后端服务..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
cp -n .env.example .env 2>/dev/null || true
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "[2/2] 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  服务已启动！"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8000"
echo "  API 文档: http://localhost:8000/docs"
echo "========================================"
echo ""
echo "按 Ctrl+C 停止所有服务"
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
