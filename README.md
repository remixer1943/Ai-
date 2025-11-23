<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Fg4DFrpvPov0Ce3KuouvlEzKosNxyIZ7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Quick launch option

If you prefer a one-click entry point, run `python run.py`. The helper script
will install dependencies on first run (if needed) and then start `npm run dev`
for you. Stop the server with `Ctrl + C` when you're done.

### Model providers

Open the “设置”面板即可在 Gemini、豆包（火山引擎）和硅基流动三种提供商之间切换。

- **Gemini**：使用环境变量 `GEMINI_API_KEY`（前端运行时读取）。
- **豆包**：需要填写 API Key 与模型 Endpoint。
- **硅基流动**：填写 API Key 与模型名称，可选自定义 Endpoint（默认 `https://api.siliconflow.cn/v1/chat/completions`）。
