import express from 'express'

const router = express.Router()

const privacyHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - AssessAI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #09090B; color: #FAFAFA; line-height: 1.7; }
    .container { max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
    nav { border-bottom: 1px solid #27272A; padding: 16px 24px; }
    nav a { color: #A1A1AA; text-decoration: none; font-size: 14px; }
    nav a:hover { color: #FAFAFA; }
    h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
    .date { color: #71717A; font-size: 13px; margin-bottom: 40px; }
    h2 { font-size: 20px; font-weight: 700; color: #FAFAFA; margin: 32px 0 12px; }
    p { color: #A1A1AA; margin-bottom: 12px; }
    ul { color: #A1A1AA; padding-left: 24px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }
    strong { color: #FAFAFA; }
    a { color: #6366F1; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <nav><a href="/">← AssessAI</a></nav>
  <div class="container">
    <h1>Privacy Policy</h1>
    <p class="date">Last updated: July 31, 2026</p>

    <h2>1. Information We Collect</h2>
    <p>We collect information you provide directly to us, including:</p>
    <ul>
      <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
      <li><strong>Assessment Data:</strong> Responses, scores, and performance data from assessments you take or create.</li>
      <li><strong>Proctoring Data:</strong> Webcam images, tab-switch events, and audio data during proctored assessments (only when enabled).</li>
      <li><strong>Usage Data:</strong> Pages visited, features used, and interaction patterns within the platform.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use the collected information to:</p>
    <ul>
      <li>Provide, maintain, and improve our assessment platform.</li>
      <li>Generate AI-powered questions and analytics based on your usage.</li>
      <li>Process and score assessments accurately.</li>
      <li>Detect and prevent cheating or unauthorized behavior during proctored exams.</li>
      <li>Send important updates about your account or the platform.</li>
      <li>Ensure platform security and prevent fraud.</li>
    </ul>

    <h2>3. Data Sharing</h2>
    <p>We do not sell your personal information. We may share data with:</p>
    <ul>
      <li><strong>AI Providers:</strong> Anonymized question data sent to AI services for question generation.</li>
      <li><strong>Cloud Infrastructure:</strong> Data stored on secure cloud providers for hosting.</li>
      <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety.</li>
    </ul>

    <h2>4. Data Security</h2>
    <p>We implement industry-standard security measures including encryption in transit (TLS) and at rest, secure authentication with JWT tokens, and regular security audits.</p>

    <h2>5. Data Retention</h2>
    <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>

    <h2>6. Your Rights</h2>
    <ul>
      <li>Access, update, or delete your personal information.</li>
      <li>Export your assessment data in standard formats.</li>
      <li>Opt out of non-essential data collection.</li>
      <li>Withdraw consent for proctoring at any time.</li>
    </ul>

    <h2>7. Cookies</h2>
    <p>We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.</p>

    <h2>8. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page.</p>

    <h2>9. Contact Us</h2>
    <p>If you have questions about this Privacy Policy, please contact us at <a href="mailto:ravipratap.gusknp2022@gmail.com">ravipratap.gusknp2022@gmail.com</a>.</p>
  </div>
</body>
</html>`

router.get('/privacy', (_, res) => {
  res.set('Content-Type', 'text/html')
  res.send(privacyHTML)
})

export default router
