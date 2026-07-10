@echo off
echo ========================================
echo   记忆星图 - AI 智能复习引擎
echo ========================================
echo.

echo [1/2] 启动后端服务...
cd backend
start "记忆星图-后端" cmd /k "if not exist venv (python -m venv venv) && call venv\Scripts\activate && pip install -r requirements.txt -q && copy /Y .env.example .env && python -m uvicorn app.main:app --reload --port 8000"
cd ..

echo [2/2] 启动前端服务...
cd frontend
start "记忆星图-前端" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo   服务已启动！
echo   前端: http://localhost:5173
echo   后端: http://localhost:8000
echo   API 文档: http://localhost:8000/docs
echo ========================================
echo.
echo 按任意键关闭此窗口...
pause > nul
