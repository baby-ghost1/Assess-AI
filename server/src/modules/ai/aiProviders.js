// AI Provider Abstraction Layer
// Each provider implements: generateQuestions(topic, config) => [{ title, description, questionType, difficulty, options, ... }]

const PROVIDER_CONFIGS = {
  gemini: { apiKey: process.env.GEMINI_API_KEY, model: 'gemini-2.0-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  gpt: { apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1' },
  claude: { apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-opus-20240229', baseUrl: 'https://api.anthropic.com/v1' },
  deepseek: { apiKey: process.env.DEEPSEEK_API_KEY, model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' },
  openrouter: { apiKey: process.env.OPENROUTER_API_KEY, model: 'openai/gpt-4o', baseUrl: 'https://openrouter.ai/api/v1' },
  perplexity: { apiKey: process.env.PERPLEXITY_API_KEY, model: 'llama-3.1-sonar-large-128k-online', baseUrl: 'https://api.perplexity.ai' },
  groq: { apiKey: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1' },
  nvidia: { apiKey: process.env.NVIDIA_API_KEY, model: 'deepseek-ai/deepseek-v4-pro', baseUrl: 'https://integrate.api.nvidia.com/v1' },
}

function buildPrompt(topic, config) {
  const questionType = config.questionType || 'single_correct'
  const count = config.count || 5
  const difficulty = config.difficulty || 'medium'
  const language = config.language || 'English'

  const correctAnswerExample = questionType === 'multi_correct' ? '["A", "C"]' : '"A"'

  return `Generate exactly ${count} ${difficulty} difficulty ${questionType} questions about "${topic}" in ${language}.

Return ONLY valid JSON array. Each object must have:
{
  "title": "question text",
  "description": "",
  "questionType": "${questionType}",
  "difficulty": "${difficulty}",
  "marks": 1,
  "options": [{"text": "option text", "key": "A", "isCorrect": true}, {"text": "option text", "key": "B", "isCorrect": false}],
  "correctAnswer": ${correctAnswerExample}
}

Rules:
- Each option MUST have "isCorrect": true or false for all options
- For single_correct: exactly 4 options with keys A,B,C,D, exactly one has isCorrect: true
- For multi_correct: exactly 4 options with keys A,B,C,D, can have multiple with isCorrect: true, correctAnswer must be an array of correct keys
- For true_false: exactly 2 options A=True, B=False
- Questions must be unique and non-trivial
- NEVER include the answer or hints in the title or description fields
- Response must be ONLY the JSON array, no other text`
}

async function fetchFromProvider(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const err = await response.text().catch(() => '')
    throw new Error(`AI provider error (${response.status}): ${err}`)
  }
  return response.json()
}

// --- Provider Implementations ---

async function geminiGenerate(topic, config) {
  const cfg = PROVIDER_CONFIGS.gemini
  const prompt = buildPrompt(topic, config)
  const data = await fetchFromProvider(`${cfg.baseUrl}/models/${cfg.model}:generateContent?key=${cfg.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }),
  })
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

async function gptGenerate(topic, config) {
  const cfg = PROVIDER_CONFIGS.gpt
  const prompt = buildPrompt(topic, config)
  const data = await fetchFromProvider(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })
  const text = data?.choices?.[0]?.message?.content || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

async function claudeGenerate(topic, config) {
  const cfg = PROVIDER_CONFIGS.claude
  const prompt = buildPrompt(topic, config)
  const data = await fetchFromProvider(`${cfg.baseUrl}/messages`, {
    method: 'POST',
    headers: { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const text = data?.content?.[0]?.text || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

async function deepseekGenerate(topic, config) {
  const cfg = PROVIDER_CONFIGS.deepseek
  const prompt = buildPrompt(topic, config)
  const data = await fetchFromProvider(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })
  const text = data?.choices?.[0]?.message?.content || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

async function openrouterGenerate(topic, config) {
  const cfg = PROVIDER_CONFIGS.openrouter
  const prompt = buildPrompt(topic, config)
  const data = await fetchFromProvider(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })
  const text = data?.choices?.[0]?.message?.content || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

async function perplexityGenerate(topic, config) {
  const cfg = PROVIDER_CONFIGS.perplexity
  const prompt = buildPrompt(topic, config)
  const data = await fetchFromProvider(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const text = data?.choices?.[0]?.message?.content || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

async function groqGenerate(topic, config) {
  const cfg = PROVIDER_CONFIGS.groq
  const prompt = buildPrompt(topic, config)
  const data = await fetchFromProvider(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })
  const text = data?.choices?.[0]?.message?.content || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

async function nvidiaGenerate(topic, config) {
  const cfg = PROVIDER_CONFIGS.nvidia
  const prompt = buildPrompt(topic, config)
  const data = await fetchFromProvider(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
    }),
  })
  const text = data?.choices?.[0]?.message?.content || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

// --- Provider Registry ---

const providers = {
  gemini: geminiGenerate,
  gpt: gptGenerate,
  claude: claudeGenerate,
  deepseek: deepseekGenerate,
  openrouter: openrouterGenerate,
  perplexity: perplexityGenerate,
  groq: groqGenerate,
  nvidia: nvidiaGenerate,
}

export async function generateQuestions(topic, config = {}) {
  const providerName = config.provider || 'gemini'
  const generator = providers[providerName]

  if (!generator) {
    throw new Error(`Unknown AI provider: ${providerName}. Available: ${Object.keys(providers).join(', ')}`)
  }

  const cfg = PROVIDER_CONFIGS[providerName]
  if (!cfg.apiKey) {
    throw new Error(`${providerName} API key not configured. Set ${providerName.toUpperCase()}_API_KEY in environment.`)
  }

  const questions = await generator(topic, config)
  return questions.map((q, i) => {
    const options = (q.options || []).map((opt, j) => {
      const key = opt.key || String.fromCharCode(65 + j)
      let isCorrect = opt.isCorrect
      if (isCorrect === undefined && q.correctAnswer !== undefined) {
        if (Array.isArray(q.correctAnswer)) {
          isCorrect = q.correctAnswer.includes(key)
        } else {
          isCorrect = q.correctAnswer === key
        }
      }
      return { text: typeof opt === 'string' ? opt : opt.text, key, isCorrect: Boolean(isCorrect) }
    })
    return {
      ...q,
      title: q.title || `Question ${i + 1}`,
      questionType: q.questionType || config.questionType || 'single_correct',
      difficulty: q.difficulty || config.difficulty || 'medium',
      marks: q.marks || 1,
      correctAnswer: q.correctAnswer,
      isAiGenerated: true,
      aiModel: providerName,
      source: 'ai_generated',
      status: 'draft',
      options,
    }
  })
}

function buildInsightsPrompt(analyticsData, scope) {
  const json = JSON.stringify(analyticsData, null, 2)
  const prompts = {
    user: `You are an assessment analytics expert. Analyze this candidate's performance data and provide insights.

Return ONLY valid JSON with this structure:
{
  "overallAssessment": "brief 1-line summary",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "improvementTips": ["tip1", "tip2", ...],
  "estimatedProficiency": "beginner/intermediate/advanced/expert",
  "focusAreas": ["area1", "area2", ...]
}

Data:
${json}`,
    assessment: `You are an assessment analytics expert. Analyze this assessment's performance data and provide insights.

Return ONLY valid JSON with this structure:
{
  "overallAssessment": "brief 1-line summary",
  "easiestQuestions": ["question title 1", "question title 2"],
  "hardestQuestions": ["question title 1", "question title 2"],
  "qualityMetrics": {
    "averageDifficulty": "easy/medium/hard",
    "discriminationPower": "low/medium/high",
    "reliability": "low/medium/high"
  },
  "recommendations": ["rec1", "rec2", ...]
}

Data:
${json}`,
    admin: `You are an assessment platform analytics expert. Analyze this platform-wide data and provide insights.

Return ONLY valid JSON with this structure:
{
  "overallAssessment": "brief 1-line summary",
  "keyMetrics": ["metric1 with value", "metric2 with value", ...],
  "recommendations": ["rec1", "rec2", ...],
  "growthOpportunities": ["opp1", "opp2", ...]
}

Data:
${json}`,
  }
  return prompts[scope] || prompts.user
}

async function genericFetchGenerate(prompt, providerName) {
  const cfg = PROVIDER_CONFIGS[providerName]
  const data = await fetchFromProvider(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })
  const text = data?.choices?.[0]?.message?.content || ''
  return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
}

export async function generateInsights(analyticsData, scope = 'user', providerName = 'gemini') {
  const prompt = buildInsightsPrompt(analyticsData, scope)

  if (providerName === 'gemini') {
    const cfg = PROVIDER_CONFIGS.gemini
    const data = await fetchFromProvider(`${cfg.baseUrl}/models/${cfg.model}:generateContent?key=${cfg.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    })
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
  }

  if (providerName === 'claude') {
    const cfg = PROVIDER_CONFIGS.claude
    const data = await fetchFromProvider(`${cfg.baseUrl}/messages`, {
      method: 'POST',
      headers: { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const text = data?.content?.[0]?.text || ''
    return JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
  }

  return genericFetchGenerate(prompt, providerName)
}

export function getAvailableProviders() {
  return Object.entries(PROVIDER_CONFIGS).map(([name, cfg]) => ({
    name,
    configured: Boolean(cfg.apiKey),
    model: cfg.model,
  }))
}
