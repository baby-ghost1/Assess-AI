# NVIDIA API — Quick Config Reference (Do NOT paste real keys in chat)

## .env Update (file: server/.env)
Keep ALL existing keys. Update only NVIDIA line:
NVIDIA_API_KEY=nvapi-YOUR-REAL-KEY-HERE

## Existing Backend (already configured — no code change required unless changing model)
File: server/src/modules/ai/aiProviders.js
Line 12 already has:
nvidia: { apiKey: process.env.NVIDIA_API_KEY, model: 'deepseek-ai/deepseek-v4-pro', baseUrl: 'https://integrate.api.nvidia.com/v1' }

## If you want to switch to a FREE NVIDIA model, change only the model string above:
# Option A (Small / Fast / Usually free tier):
model: 'nvidia/llama-3.1-8b-instruct'

# Option B (Better quality / Mid-size):
model: 'nvidia/llama-3.1-405b-instruct'

# Option C (Mixtral):
model: 'nvidia/mixtral-8x7b-instruct-v0.1'

# Option D (DeepSeek on NVIDIA):
model: 'deepseek-ai/deepseek-v3'

Base URL stays: https://integrate.api.nvidia.com/v1

## How to call from your backend (already exists in aiProviders.js line 177):
provider: 'nvidia'

## Security reminder:
- Edit server/.env directly on your machine
- Never paste real API keys in chat/messages
- The placeholder above is intentionally invalid
