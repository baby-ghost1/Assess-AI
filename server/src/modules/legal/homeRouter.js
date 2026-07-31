import express from 'express'

const router = express.Router()

const homeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AssessAI - AI Assessment Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #09090B; color: #FAFAFA; line-height: 1.7; }
    .container { max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
    nav { border-bottom: 1px solid #27272A; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
    .logo { width: 36px; height: 36px; background: linear-gradient(135deg, #6366F1, #06B6D4); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .logo svg { width: 20px; height: 20px; }
    nav span { font-size: 18px; font-weight: 700; }
    h1 { font-size: 36px; font-weight: 800; margin: 40px 0 16px; }
    h1 span { background: linear-gradient(135deg, #6366F1, #06B6D4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    p { color: #A1A1AA; margin-bottom: 16px; font-size: 16px; }
    h2 { font-size: 22px; font-weight: 700; margin: 32px 0 12px; }
    ul { color: #A1A1AA; padding-left: 24px; margin-bottom: 16px; }
    li { margin-bottom: 8px; }
    strong { color: #FAFAFA; }
    a { color: #6366F1; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .links { margin-top: 40px; padding-top: 24px; border-top: 1px solid #27272A; display: flex; gap: 24px; }
    .links a { font-size: 14px; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
    </div>
    <span>AssessAI</span>
  </nav>
  <div class="container">
    <h1>Build Smarter Assessments with <span>AI Intelligence</span></h1>
    <p>AssessAI is an AI-powered assessment platform that helps teams create, manage, and analyze technical assessments. It is designed for hiring managers, educators, and teams who want to evaluate skills efficiently and fairly.</p>

    <h2>What AssessAI Offers</h2>
    <ul>
      <li><strong>AI-Powered Question Generation</strong> - Automatically generate relevant questions using advanced AI models with customizable difficulty and topics.</li>
      <li><strong>Real-time Proctoring</strong> - Webcam monitoring, tab-switch detection, and audio analysis to ensure exam integrity.</li>
      <li><strong>Advanced Analytics</strong> - Score trends, performance breakdowns, AI-powered insights, and PDF/CSV export for detailed reporting.</li>
      <li><strong>Coding Assessments</strong> - Built-in code editor with 5 language support, instant execution, and AI-powered hints.</li>
      <li><strong>Smart Question Bank</strong> - Organize, tag, and manage questions with import, AI generation, and approval workflows.</li>
      <li><strong>Role-Based Access</strong> - Separate dashboards for candidates, setters, and admins with tailored experiences.</li>
    </ul>

    <p>AssessAI is available at <a href="https://assessai-beta.vercel.app">assessai-beta.vercel.app</a>. Sign up for free to get started.</p>

    <div class="links">
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
    </div>
  </div>
</body>
</html>`

router.get('/', (_, res) => {
  res.set('Content-Type', 'text/html')
  res.send(homeHTML)
})

export default router
