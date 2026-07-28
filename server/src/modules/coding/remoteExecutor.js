const JUDGE0_API = process.env.JUDGE0_API_URL || 'https://ce.judge0.com'

const LANGUAGE_IDS = {
  javascript: 102,
  python: 109,
  java: 91,
  cpp: 105,
  c: 103,
}

export async function executeRemote(code, language, stdin = '', timeout = 10000) {
  const lang = language === 'js' ? 'javascript'
    : language === 'py' ? 'python'
    : language === 'c++' ? 'cpp'
    : language

  const languageId = LANGUAGE_IDS[lang]
  if (!languageId) {
    throw new Error(`Language "${language}" is not supported for remote execution`)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(
      `${JUDGE0_API}/submissions?base64_encoded=false&wait=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: stdin || '',
        }),
        signal: controller.signal,
      }
    )

    clearTimeout(timer)

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Judge0 API error (${response.status}): ${text}`)
    }

    const data = await response.json()

    const status = data.status?.description || ''
    const stdout = data.stdout || ''
    const stderr = data.stderr || ''
    const compileOutput = data.compile_output || ''

    if (status === 'Compilation Error' || status === 'Runtime Error (NZEC)') {
      const errMsg = stderr || compileOutput || status
      throw new Error(errMsg)
    }

    if (status === 'Time Limit Exceeded') {
      throw new Error('Code execution timed out')
    }

    if (status !== 'Accepted' && stderr) {
      throw new Error(stderr)
    }

    return {
      output: stdout.trim(),
      stderr,
      executionTime: Math.round(parseFloat(data.time || '0') * 1000),
      memoryUsed: data.memory || 0,
      exitCode: data.status?.id === 3 ? 0 : 1,
    }
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Code execution timed out (10s limit)')
    }
    throw err
  }
}
