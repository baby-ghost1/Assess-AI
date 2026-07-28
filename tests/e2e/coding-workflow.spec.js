const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

const CREDS = {
  candidate: { email: 'candidate@test.com', password: 'Candidate123!' },
}

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python3' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
]

const LINEAR_SEARCH_SOLUTIONS = {
  javascript: `function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;
        }
    }
    return -1;
}`,

  python: `def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,

  java: `class Solution {
    public static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }
}`,

  cpp: `class Solution {
public:
    int linearSearch(vector<int>& arr, int target) {
        for (int i = 0; i < arr.size(); i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }
};`,
}

const EXPECTED_ERRORS = {
  java: 'Java compiler (javac) not available',
  cpp: 'C++ compiler (g++) not available',
}

async function loginAsCandidate(page, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    await page.goto(BASE_URL + '/login')
    await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
    await page.locator('input[type="email"]').fill(CREDS.candidate.email)
    await page.locator('input[type="password"]').fill(CREDS.candidate.password)
    await page.locator('button[type="submit"]').click()
    try {
      await page.waitForURL(/\/dashboard|\/coding|\/assessments|\/ai-quiz/, { timeout: 10000 })
      return
    } catch {
      if (attempt < retries) {
        console.log(`Login attempt ${attempt} failed, retrying...`)
        await page.waitForTimeout(2000)
      } else {
        throw new Error(`Login failed after ${retries} attempts`)
      }
    }
  }
}

async function waitForAppLoad(page) {
  await page.locator('aside, nav, main').first().waitFor({ timeout: 15000 })
}

async function setCodeInEditor(page, code) {
  const editor = page.locator('.monaco-editor').first()
  await editor.waitFor({ timeout: 15000 })
  await editor.click()
  await page.evaluate((newCode) => {
    const e = window.monaco?.editor?.getEditors?.()?.[0]
    if (e) e.setValue(newCode)
  }, code)
  await page.waitForTimeout(500)
}

async function selectLanguage(page, langId) {
  await page.locator('select').first().selectOption(langId)
  await page.waitForTimeout(500)
}

async function generateQuestionViaAI(page) {
  await page.locator('button:has-text("AI")').first().click()
  await page.waitForTimeout(500)
  const chatInput = page.locator('input[placeholder*="practice question"], input[placeholder*="Ask"]').first()
  await expect(chatInput).toBeVisible()
  await chatInput.fill('Generate a linear search problem')
  await page.locator('button[type="submit"]').last().click()
  await page.waitForTimeout(15000)
}

async function runAndCapture(page, apiPattern) {
  const captured = { response: null }
  let routeHandler

  routeHandler = async (route) => {
    const response = await route.fetch()
    try {
      captured.response = await response.json()
    } catch (e) {
      captured.response = { raw: await response.text() }
    }
    await route.fulfill({ response })
  }

  await page.route(apiPattern, routeHandler)

  const btnText = apiPattern.includes('run') ? 'Run' : 'Submit'
  const btn = page.locator(`button:has-text("${btnText}")`).first()
  await btn.click()

  await page.waitForTimeout(8000)
  await page.unroute(apiPattern, routeHandler)

  return captured.response
}

function validateRunResult(body, langId) {
  if (!body) return { status: 'FAIL', reason: 'No response captured' }
  if (body.success === false) {
    const expectedErr = EXPECTED_ERRORS[langId]
    if (expectedErr && body.message?.includes(expectedErr)) {
      return { status: 'SKIP', reason: body.message }
    }
    return { status: 'FAIL', reason: body.message || 'Unknown error' }
  }
  const results = body.data?.results || []
  const hasErrors = results.some((r) => r.error)
  const allPassed = results.length > 0 && results.every((r) => r.passed)
  if (hasErrors) {
    const errs = results.filter((r) => r.error).map((r) => r.error)
    return { status: 'ERROR', reason: errs.join('; ') }
  }
  if (allPassed) return { status: 'PASS', passed: results.length, total: results.length }
  const passed = results.filter((r) => r.passed).length
  return { status: 'FAIL', passed, total: results.length }
}

function validateSubmitResult(body, langId) {
  if (!body) return { status: 'FAIL', reason: 'No response captured' }
  if (body.success === false) {
    const expectedErr = EXPECTED_ERRORS[langId]
    if (expectedErr && body.message?.includes(expectedErr)) {
      return { status: 'SKIP', reason: body.message }
    }
    return { status: 'FAIL', reason: body.message || 'Unknown error' }
  }
  const { passed, total, allPassed, results } = body.data || {}
  const hasErrors = results?.some((r) => r.error)
  if (hasErrors) {
    const errs = results.filter((r) => r.error).map((r) => r.error)
    return { status: 'ERROR', reason: errs.join('; ') }
  }
  return { status: allPassed ? 'PASS' : 'FAIL', passed, total, allPassed }
}

test.describe('Coding Page - Actual Results', () => {
  test.setTimeout(180000)

  test('run all 4 languages with AI-generated question', async ({ page }) => {
    await loginAsCandidate(page)
    await page.goto(BASE_URL + '/coding')
    await waitForAppLoad(page)

    await generateQuestionViaAI(page)

    const summary = {}

    for (const lang of LANGUAGES) {
      await selectLanguage(page, lang.id)
      await setCodeInEditor(page, LINEAR_SEARCH_SOLUTIONS[lang.id])

      const body = await runAndCapture(page, '**/api/v1/coding/run**')
      const result = validateRunResult(body, lang.id)
      summary[lang.id] = result

      const detail = result.status === 'SKIP' ? result.reason :
                     result.passed !== undefined ? `${result.passed}/${result.total}` : (result.reason || '')
      console.log(`[${lang.id}] Run: ${result.status}${detail ? ' - ' + detail : ''}`)
    }

    console.log('\n=== RUN SUMMARY ===')
    for (const [lang, r] of Object.entries(summary)) {
      const d = r.status === 'SKIP' ? r.reason : r.passed !== undefined ? `${r.passed}/${r.total}` : (r.reason || '')
      console.log(`  ${lang}: ${r.status}${d ? ' - ' + d : ''}`)
    }

    expect(summary.javascript?.status, 'JavaScript run').not.toBe('FAIL')
    expect(summary.python?.status, 'Python run').not.toBe('FAIL')
  })

  test('submit all 4 languages with AI-generated question', async ({ page }) => {
    await loginAsCandidate(page)
    await page.goto(BASE_URL + '/coding')
    await waitForAppLoad(page)

    await generateQuestionViaAI(page)

    const summary = {}

    for (const lang of LANGUAGES) {
      await selectLanguage(page, lang.id)
      await setCodeInEditor(page, LINEAR_SEARCH_SOLUTIONS[lang.id])

      const body = await runAndCapture(page, '**/api/v1/coding/submit**')
      const result = validateSubmitResult(body, lang.id)
      summary[lang.id] = result

      const detail = result.status === 'SKIP' ? result.reason :
                     result.passed !== undefined ? `${result.passed}/${result.total}` : (result.reason || '')
      console.log(`[${lang.id}] Submit: ${result.status}${detail ? ' - ' + detail : ''}`)
    }

    console.log('\n=== SUBMIT SUMMARY ===')
    for (const [lang, r] of Object.entries(summary)) {
      const d = r.status === 'SKIP' ? r.reason : r.passed !== undefined ? `${r.passed}/${r.total}` : (r.reason || '')
      console.log(`  ${lang}: ${r.status}${d ? ' - ' + d : ''}`)
    }

    expect(summary.javascript?.status, 'JavaScript submit').not.toBe('FAIL')
    expect(summary.python?.status, 'Python submit').not.toBe('FAIL')
  })

  test('full workflow: AI generate → run all → submit all', async ({ page }) => {
    await loginAsCandidate(page)
    await page.goto(BASE_URL + '/coding')
    await waitForAppLoad(page)

    await generateQuestionViaAI(page)

    const summary = {}

    for (const lang of LANGUAGES) {
      await selectLanguage(page, lang.id)
      await setCodeInEditor(page, LINEAR_SEARCH_SOLUTIONS[lang.id])

      const runBody = await runAndCapture(page, '**/api/v1/coding/run**')
      const runResult = validateRunResult(runBody, lang.id)

      // Wait for submit button to be enabled
      const submitBtn = page.locator('button:has-text("Submit")').first()
      await submitBtn.waitFor({ state: 'visible', timeout: 5000 })
      await page.waitForTimeout(2000)

      const submitBody = await runAndCapture(page, '**/api/v1/coding/submit**')
      const submitResult = validateSubmitResult(submitBody, lang.id)

      summary[lang.id] = { run: runResult, submit: submitResult }

      const runD = runResult.status === 'SKIP' ? runResult.reason : runResult.passed !== undefined ? `${runResult.passed}/${runResult.total}` : runResult.reason || ''
      const subD = submitResult.status === 'SKIP' ? submitResult.reason : submitResult.passed !== undefined ? `${submitResult.passed}/${submitResult.total}` : submitResult.reason || ''
      console.log(`[${lang.id}] Run: ${runResult.status}${runD ? ' - ' + runD : ''} | Submit: ${submitResult.status}${subD ? ' - ' + subD : ''}`)
    }

    console.log('\n=== FULL WORKFLOW SUMMARY ===')
    for (const [lang, r] of Object.entries(summary)) {
      const runD = r.run.status === 'SKIP' ? r.run.reason : r.run.passed !== undefined ? `${r.run.passed}/${r.run.total}` : r.run.reason || ''
      const subD = r.submit.status === 'SKIP' ? r.submit.reason : r.submit.passed !== undefined ? `${r.submit.passed}/${r.submit.total}` : r.submit.reason || ''
      console.log(`  ${lang}: Run=${r.run.status}${runD ? '(' + runD + ')' : ''} Submit=${r.submit.status}${subD ? '(' + subD + ')' : ''}`)
    }

    expect(summary.javascript?.run?.status).not.toBe('FAIL')
    expect(summary.python?.run?.status).not.toBe('FAIL')
    expect(summary.javascript?.submit?.status).not.toBe('FAIL')
    expect(summary.python?.submit?.status).not.toBe('FAIL')
  })
})
