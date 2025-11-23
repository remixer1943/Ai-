#!/bin/bash

# AI助教 启动脚本
# 同时启动 RAG 检索服务和前端开发服务器

echo "=================================="
echo "🚀 启动 AI助教 系统"
echo "=================================="
echo ""

# 检查必要文件
if [ ! -f "rag_service.py" ]; then
    echo "❌ 错误: rag_service.py 未找到"
    exit 1
fi

if [ ! -f "src/data/vector_store.pkl" ]; then
    echo "❌ 错误: 向量数据库未找到，请先运行: python3 scripts/build_vector_db.py"
    exit 1
fi

# 启动 RAG 服务
echo "📚 启动 RAG 检索服务 (端口 5001)..."
python3 rag_service.py &
RAG_PID=$!
echo "   PID: $RAG_PID"

# 等待 RAG 服务启动
sleep 3

# 检查 RAG 服务是否成功启动
if ! curl -s http://localhost:5001/health > /dev/null; then
    echo "❌ RAG 服务启动失败"
    kill $RAG_PID 2>/dev/null
    exit 1
fi

echo "✅ RAG 服务已启动"
echo ""

# 启动前端开发服务器
echo "🌐 启动前端开发服务器 (端口 3000)..."
npm run dev &
VITE_PID=$!
echo "   PID: $VITE_PID"

echo ""
echo "=================================="
echo "✨ 系统启动完成！"
echo "=================================="
echo ""
echo "📍 访问地址:"
echo "   - 前端应用: http://localhost:3000"
echo "   - RAG 服务: http://localhost:5001"
echo ""
echo "📝 提示:"
echo "   - 按 Ctrl+C 停止所有服务"
echo "   - RAG 服务提供语义检索功能"
echo "   - 前端会自动调用 RAG 服务进行知识库查询"
echo ""

# 捕获退出信号，清理子进程
trap "echo ''; echo '🛑 停止服务...'; kill $RAG_PID $VITE_PID 2>/dev/null; echo '👋 再见!'; exit" SIGINT SIGTERM

# 等待
wait
