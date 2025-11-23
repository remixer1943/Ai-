# AI助教 - RAG 语义检索升级说明

## 🎉 最新更新

您的 AI 助教现在拥有了**语义理解能力**！我们已经将原来的简单关键词匹配升级为基于 **BGE-large-zh-v1.5** 模型的向量语义检索系统。

## ✨ 升级内容

###  1. 向量数据库构建
- **模型**: 使用您本地的 `bge-large-zh-v1.5` 模型（中文语义嵌入模型）
- **数据**: 将《3-6岁儿童学习与发展指南》的 68 个文本片段转换为向量
- **存储**: `src/data/vector_store.pkl` (约 2.5 MB)

### 2. RAG 检索服务
- **技术栈**: Flask + PyTorch + Sentence-Transformers
- **端口**: `http://localhost:5001`
- **功能**: 接收观察文本，返回语义最相关的《指南》内容

### 3. 前端集成
- **自动调用**: `geminiService.ts` 会在分析前自动调用本地 RAG 服务
- **降级处理**: 如果 RAG 服务不可用，会优雅降级（不影响基本功能）

## 🚀 使用方法

### 首次使用（一次性操作）

如果还没有构建向量数据库，先运行：

```bash
python3 scripts/build_vector_db.py
```

这会生成 `src/data/vector_store.pkl` 文件。

### 日常启动

**方法 1: 一键启动（推荐）**

```bash
./start.sh
```

这个脚本会自动启动：
- RAG 检索服务 (端口 5001)
- 前端开发服务器 (端口 3000)

按 `Ctrl+C` 可以同时停止两个服务。

**方法 2: 分别启动**

终端 1 - 启动 RAG 服务:
```bash
python3 rag_service.py
```

终端 2 - 启动前端:
```bash
npm run dev
```

## 🧪 测试

运行测试脚本验证 RAG 服务是否正常工作：

```bash
python3 scripts/test_rag_service.py
```

## 📊 效果对比

### 升级前（关键词匹配）
- **查询**: "孩子情绪低落"
- **检索**: 只能匹配包含"情绪"、"低落"字眼的段落
- **问题**: 无法理解同义词，如"不开心"、"难过"

### 升级后（语义检索）
- **查询**: "孩子情绪低落"
- **检索**: 能找到所有与情绪相关的内容，包括"情绪安定愉快"、"表达情绪"等
- **优势**: 理解语义，不依赖完全匹配

## 🔧 技术细节

### RAG 流程

```
1. 用户输入观察文本
   ↓
2. 前端调用 RAG 服务 (localhost:5001/retrieve)
   ↓
3. BGE 模型将查询编码为向量
   ↓
4. 在 68 个《指南》片段中计算相似度
   ↓
5. 返回 Top-5 最相关片段
   ↓
6. 前端将这些片段注入到 Gemini 的 System Prompt 中
   ↓
7. Gemini 基于这些参考资料进行分析
```

### 文件结构

```
ai助教/
├── models/
│   └── bge-large-zh-v1.5/        # 本地语义模型
├── scripts/
│   ├── build_vector_db.py        # 构建向量数据库
│   └── test_rag_service.py       # 测试脚本
├── src/data/
│   ├── knowledge_base.json       # 原始文本数据
│   └── vector_store.pkl          # 向量数据库
├── rag_service.py                # RAG 检索服务
└── start.sh                      # 一键启动脚本
```

## 🐛 常见问题

### Q: RAG 服务启动失败？
A: 检查依赖是否安装：
```bash
pip3 install flask flask-cors sentence-transformers torch
```

### Q: 向量数据库文件不存在？
A: 运行构建脚本：
```bash
python3 scripts/build_vector_db.py
```

### Q: 前端无法连接 RAG 服务？
A: 确保 RAG 服务已启动且运行在 5001 端口。可以访问 `http://localhost:5001/health` 检查。

## 📝 使用建议

1. **首次启动**时，向量生成需要几秒钟，请耐心等待
2. RAG 服务会占用一定内存（约 1-2GB），长时间不用可以关闭
3. 如果遇到问题，可以查看终端的日志输出

## 🙏 致谢

- **BGE 模型**: BAAI/bge-large-zh-v1.5 (智源研究院)
- **参考文献**: 《3-6岁儿童学习与发展指南》（中华人民共和国教育部）
