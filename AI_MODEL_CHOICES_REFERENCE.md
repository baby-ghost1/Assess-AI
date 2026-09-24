# AI Model Choices — Where to Show (Code NOT changed — just reference)

## Backend configs already added (from previous steps):
- nvidia (old) -> deepseek-v4-pro
- nvidia_llama -> llama-3.1-8b-instruct
- nvidia_mixtral -> mixtral-8x7b-instruct
- nvidia_deepseek -> deepseek-v3
- kimi_k3 -> kimi-k3

## .env keys added (edit directly, don't share):
NVIDIA_API_KEY
NVIDIA_LLAMA_API_KEY
NVIDIA_MIXTRAL_API_KEY
NVIDIA_DEEPSEEK_API_KEY
NVIDIA_KIMI_K3_API_KEY

## Frontend files where Provider Dropdown exists (show these choices here):

1. client/src/features/ai-quiz/AIQuizPage.jsx
   - Line 51: const ALL = ['gemini','gpt',...,'nvidia','bazaarlink']
   - ADD to ALL array: 'nvidia_llama','nvidia_mixtral','nvidia_deepseek','kimi_k3'
   - Also checks `providers.find(x => x.name === ...)` from backend API — so backend must expose them

2. client/src/features/question-bank/AIGeneratePage.jsx
   - Likely similar provider dropdown — add same choices

3. client/src/features/assessments/AssessmentCreatePage.jsx
   - If it calls generateQuestions with provider option — show dropdown here too

## How backend exposes them to UI:
Server endpoint (`aiRoutes.js` / `aiProviders.js`) probably returns configured providers list.
If backend returns all `PROVIDER_CONFIGS` keys, new ones will auto-appear when you update ALL array.

## Model choice display names (for dropdown labels):
- nvidia_llama -> "NVIDIA Llama 3.1 8B"
- nvidia_mixtral -> "NVIDIA Mixtral 8x7B"
- nvidia_deepseek -> "NVIDIA DeepSeek v3"
- kimi_k3 -> "Kimi K3"
- nvidia (old) -> "NVIDIA DeepSeek v4 Pro"

## Reminder:
No code edited in this step (as requested). Just show these options in the 3 tabs above by adding names to dropdown arrays.
