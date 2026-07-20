import { execSync } from 'child_process'
import { randomUUID } from 'crypto'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const availableLanguages = new Set()

export function detectLanguages() {
  const checks = [
    { id: 'javascript', cmd: 'node --version' },
    { id: 'python', cmd: process.platform === 'win32' ? 'python --version' : 'python3 --version' },
    { id: 'cpp', cmd: 'g++ --version' },
    { id: 'java', cmd: 'javac -version' },
  ]
  for (const { id, cmd } of checks) {
    try { execSync(cmd, { stdio: 'ignore', timeout: 3000 }); availableLanguages.add(id) } catch {}
  }
}

export function getSupportedLanguages() {
  return [
    { id: 'javascript', label: 'JavaScript', available: availableLanguages.has('javascript') },
    { id: 'python', label: 'Python', available: availableLanguages.has('python') },
    { id: 'cpp', label: 'C++', available: availableLanguages.has('cpp') },
    { id: 'java', label: 'Java', available: availableLanguages.has('java') },
  ]
}

function executeJS(code, input) {
  const wrappedCode = `
    const readline = require('readline');
    function main() {
      const input = ${JSON.stringify(input)};
      const lines = input ? input.split('\\n') : [];
      let lineIdx = 0;
      global.readline = () => lines[lineIdx++] || '';
      global.print = console.log;
      ${code}
    }
    main();
  `
  const start = performance.now()
  const result = execSync(`node -e ${JSON.stringify(wrappedCode)}`, {
    timeout: 5000,
    maxBuffer: 10 * 1024 * 1024,
    encoding: 'utf-8',
  })
  const executionTime = Math.round(performance.now() - start)
  return { output: result.trim(), executionTime, memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024) }
}

function executeCpp(code, input, harness) {
  const srcPath = join(tmpdir(), `${randomUUID()}.cpp`)
  const exePath = join(tmpdir(), `${randomUUID()}.exe`)
  const env = { ...process.env, PATH: `C:\\MinGW\\bin;${process.env.PATH || ''}` }
  const wrappedCode = harness
    ? harness.replace('{{USER_CODE}}', code)
    : `#include <iostream>\n#include <string>\nusing namespace std;\n${code}\nint main(){string l;getline(cin,l);cout<<l<<endl;return 0;}`
  try {
    writeFileSync(srcPath, wrappedCode, 'utf-8')
    execSync(`g++ "${srcPath}" -o "${exePath}" -std=c++17`, { timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'], env })
    const start = performance.now()
    const result = execSync(`"${exePath}"`, { input, timeout: 5000, maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8', env })
    const executionTime = Math.round(performance.now() - start)
    return { output: result.trim(), executionTime, memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024) }
  } catch (err) {
    if (err.status === 127 || err.code === 'ENOENT' || err.message?.includes('not recognized')) {
      throw new Error('C++ compiler (g++) not available on this server')
    }
    const stderr = err.stderr?.toString() || ''
    throw new Error(stderr || err.message || 'C++ execution failed')
  } finally {
    try { unlinkSync(srcPath) } catch {}
    try { unlinkSync(exePath) } catch {}
  }
}

function executeJava(code, input) {
  const dir = tmpdir()
  const srcPath = join(dir, 'Main.java')
  const env = { ...process.env, PATH: `C:\\MinGW\\bin;${process.env.PATH || ''}` }
  try {
    writeFileSync(srcPath, code, 'utf-8')
    execSync(`javac "${srcPath}"`, { timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'], env })
    const start = performance.now()
    const result = execSync(`java -cp "${dir}" Main`, { input, timeout: 5000, maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8', env })
    const executionTime = Math.round(performance.now() - start)
    return { output: result.trim(), executionTime, memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024) }
  } catch (err) {
    if (err.status === 127 || err.code === 'ENOENT' || err.message?.includes('not recognized')) {
      throw new Error('Java compiler (javac) not available on this server')
    }
    const stderr = err.stderr?.toString() || ''
    throw new Error(stderr || err.message || 'Java execution failed')
  } finally {
    try { unlinkSync(srcPath) } catch {}
    try { unlinkSync(join(dir, 'Main.class')) } catch {}
  }
}

function executePython(code, input) {
  const wrappedCode = `
import sys
def input():
    return sys.stdin.readline()
${code}
  `
  const filePath = join(tmpdir(), `${randomUUID()}.py`)
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
  try {
    writeFileSync(filePath, wrappedCode, 'utf-8')
    const start = performance.now()
    const result = execSync(`${pythonCmd} "${filePath}"`, {
      input,
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8',
    })
    const executionTime = Math.round(performance.now() - start)
    return { output: result.trim(), executionTime, memoryUsed: Math.round(process.memoryUsage().heapUsed / 1024) }
  } finally {
    try { unlinkSync(filePath) } catch {}
  }
}

function executeCode(code, language, input, harness) {
  switch (language) {
    case 'javascript':
    case 'js':
      return executeJS(code, input)
    case 'python':
    case 'py':
      return executePython(code, input)
    case 'cpp':
    case 'c++':
      return executeCpp(code, input, harness)
    case 'java':
      return executeJava(code, input)
    default:
      throw new Error(`Language "${language}" is not supported for execution`)
  }
}

function runSingleTestCase(code, language, testCase, harness) {
  try {
    const result = executeCode(code, language, testCase.input, harness)
    const expected = (testCase.output || '').trim()
    const actual = (result.output || '').trim()
    return {
      input: testCase.input,
      expected,
      actual,
      passed: actual === expected,
      description: testCase.description || '',
      executionTime: result.executionTime || 0,
      memoryUsed: result.memoryUsed || 0,
    }
  } catch (err) {
    return {
      input: testCase.input,
      expected: testCase.output || '',
      actual: err.message || 'Execution error',
      passed: false,
      description: testCase.description || '',
      error: err.message,
      executionTime: 0,
      memoryUsed: 0,
    }
  }
}

export function runTestCases(code, language, testCases, harness) {
  return testCases.map((tc) => runSingleTestCase(code, language, tc, harness))
}

export function runSampleTests(code, language, testCases, harness) {
  const sample = testCases.filter((tc) => !tc.isHidden)
  return runTestCases(code, language, sample, harness)
}

export function runAllTests(code, language, testCases, harness) {
  return runTestCases(code, language, testCases, harness)
}

import Question from '../questions/Question.js'
import Tag from '../tags/Tag.js'

export async function seedDemoProblems(userId) {
  const existing = await Question.countDocuments({ questionType: 'coding' })

  const harnessUpdates = [
    { title: 'Two Sum', harnesses: { cpp: `#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\nvector<int> parseArray(string s){vector<int> r;s.erase(0,1);s.pop_back();if(s.empty())return r;stringstream ss(s);string t;while(getline(ss,t,',')){t.erase(0,t.find_first_not_of(' '));r.push_back(stoi(t));}return r;}\nstring stringifyArray(vector<int> v){string r="[";for(int i=0;i<(int)v.size();i++){r+=to_string(v[i]);if(i<(int)v.size()-1)r+=",";}return r+"]";}\n{{USER_CODE}}\nint main(){string line;getline(cin,line);vector<int>nums=parseArray(line);int target;cin>>target;Solution sol;vector<int>result=sol.twoSum(nums,target);cout<<stringifyArray(result)<<endl;return 0;}` } },
    { title: 'Reverse String', harnesses: { cpp: `#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\nvector<char> parseCharArray(string s){vector<char>r;bool inQ=false;for(int i=1;i<(int)s.size();i++){if(s[i]=='"'){inQ=!inQ;continue;}if(inQ)r.push_back(s[i]);}return r;}\nstring stringifyCharArray(vector<char>v){string r="[";for(int i=0;i<(int)v.size();i++){r+='"';r+=v[i];r+='"';if(i<(int)v.size()-1)r+=",";}return r+"]";}\n{{USER_CODE}}\nint main(){string line;getline(cin,line);vector<char>s=parseCharArray(line);Solution sol;sol.reverseString(s);cout<<stringifyCharArray(s)<<endl;return 0;}` } },
    { title: 'Valid Parentheses', harnesses: { cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n{{USER_CODE}}\nint main(){string line;getline(cin,line);Solution sol;cout<<(sol.isValid(line)?"true":"false")<<endl;return 0;}` } },
  ]
  for (const h of harnessUpdates) {
    await Question.updateOne({ title: h.title }, { $set: { 'codingDetails.harnesses': h.harnesses } })
  }

  if (existing > 0) return { seeded: false, message: 'Harnesses updated for existing problems' }

  const tag = await Tag.findOneAndUpdate(
    { name: 'coding' },
    { $setOnInsert: { name: 'coding', color: '#6366F1', usageCount: 0 } },
    { upsert: true, new: true }
  )

  const problems = [
    {
      title: 'Two Sum',
      description: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.

You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.

You can return the answer in any order.`,
      questionType: 'coding',
      difficulty: 'easy',
      marks: 10,
      codingDetails: {
        language: 'JavaScript',
        starterCode: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`,
        starterCodes: {
          javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`,
          python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass`,
          java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
          cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
        },
        harnesses: {
          cpp: `#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\nvector<int> parseArray(string s){vector<int> r;s.erase(0,1);s.pop_back();if(s.empty())return r;stringstream ss(s);string t;while(getline(ss,t,',')){t.erase(0,t.find_first_not_of(' '));r.push_back(stoi(t));}return r;}\nstring stringifyArray(vector<int> v){string r="[";
for(int i=0;i<(int)v.size();i++){r+=to_string(v[i]);if(i<(int)v.size()-1)r+=",";}return r+"]";}\n{{USER_CODE}}\nint main(){string line;getline(cin,line);vector<int>nums=parseArray(line);int target;cin>>target;Solution sol;vector<int>result=sol.twoSum(nums,target);cout<<stringifyArray(result)<<endl;return 0;}`,
        },
        testCases: [
          { input: '[2,7,11,15]\n9', output: '[0,1]', isHidden: false, description: 'Basic case' },
          { input: '[3,2,4]\n6', output: '[1,2]', isHidden: false, description: 'Not at start' },
          { input: '[3,3]\n6', output: '[0,1]', isHidden: true, description: 'Duplicate values' },
          { input: '[1,2,3,4,5]\n9', output: '[3,4]', isHidden: true, description: 'End of array' },
        ],
        hints: [
          { content: 'Try using a hash map to store the complement of each element.', cost: 0 },
          { content: 'For each element, check if (target - element) exists in the hash map.', cost: 1 },
          { content: 'Store the index along with the value in the hash map.', cost: 2 },
        ],
        solution: `var twoSum = function(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n};`,
        constraints: [
          '2 <= nums.length <= 10^4',
          '-10^9 <= nums[i] <= 10^9',
          '-10^9 <= target <= 10^9',
          'Only one valid answer exists.',
        ],
        companies: ['Amazon', 'Google', 'Meta', 'Apple', 'Microsoft', 'Bloomberg'],
        topics: ['Array', 'Hash Table'],
        acceptanceRate: 49.2,
        totalAccepted: 8234567,
        totalSubmissions: 16738921,
        discussionCount: 2847,
        timeLimit: 5000,
        memoryLimit: 256,
      },
      status: 'approved',
      source: 'manual',
      createdBy: userId,
    },
    {
      title: 'Reverse String',
      description: `Write a function that reverses a string. The input string is given as an array of characters <code>s</code>.

You must do this by modifying the input array <strong>in-place</strong> with O(1) extra memory.`,
      questionType: 'coding',
      difficulty: 'easy',
      marks: 10,
      codingDetails: {
        language: 'JavaScript',
        starterCode: `/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nvar reverseString = function(s) {\n    \n};`,
        starterCodes: {
          javascript: `/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nvar reverseString = function(s) {\n    \n};`,
          python: `class Solution:\n    def reverseString(self, s: list[str]) -> None:\n        pass`,
          java: `class Solution {\n    public void reverseString(char[] s) {\n        \n    }\n}`,
          cpp: `class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        \n    }\n};`,
        },
        harnesses: {
          cpp: `#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\nvector<char> parseCharArray(string s){vector<char>r;bool inQ=false;for(int i=1;i<(int)s.size();i++){if(s[i]=='"'){inQ=!inQ;continue;}if(inQ)r.push_back(s[i]);}return r;}\nstring stringifyCharArray(vector<char>v){string r="[";for(int i=0;i<(int)v.size();i++){r+='"';r+=v[i];r+='"';if(i<(int)v.size()-1)r+=",";}return r+"]";}\n{{USER_CODE}}\nint main(){string line;getline(cin,line);vector<char>s=parseCharArray(line);Solution sol;sol.reverseString(s);cout<<stringifyCharArray(s)<<endl;return 0;}`,
        },
        testCases: [
          { input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]', isHidden: false, description: 'Odd length' },
          { input: '["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', isHidden: false, description: 'Even length' },
          { input: '["a"]', output: '["a"]', isHidden: true, description: 'Single character' },
        ],
        hints: [
          { content: 'Use two pointers, one at the start and one at the end.', cost: 0 },
          { content: 'Swap the characters at the two pointers and move them towards each other.', cost: 1 },
        ],
        solution: `var reverseString = function(s) {\n    let left = 0, right = s.length - 1;\n    while (left < right) {\n        [s[left], s[right]] = [s[right], s[left]];\n        left++;\n        right--;\n    }\n};`,
        constraints: [
          '1 <= s.length <= 10^5',
          's[i] is a printable ascii character.',
        ],
        companies: ['Microsoft', 'Amazon', 'Apple', 'Bloomberg', 'Facebook'],
        topics: ['Two Pointers', 'String'],
        acceptanceRate: 77.8,
        totalAccepted: 3456789,
        totalSubmissions: 4443210,
        discussionCount: 892,
        timeLimit: 5000,
        memoryLimit: 256,
      },
      status: 'approved',
      source: 'manual',
      createdBy: userId,
    },
    {
      title: 'Valid Parentheses',
      description: `Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.

An input string is valid if:
<ol>
  <li>Open brackets must be closed by the same type of brackets.</li>
  <li>Open brackets must be closed in the correct order.</li>
  <li>Every close bracket has a corresponding open bracket of the same type.</li>
</ol>`,
      questionType: 'coding',
      difficulty: 'medium',
      marks: 15,
      codingDetails: {
        language: 'JavaScript',
        starterCode: `/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};`,
        starterCodes: {
          javascript: `/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};`,
          python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        pass`,
          java: `class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}`,
          cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};`,
        },
        harnesses: {
          cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n{{USER_CODE}}\nint main(){string line;getline(cin,line);Solution sol;cout<<(sol.isValid(line)?"true":"false")<<endl;return 0;}`,
        },
        testCases: [
          { input: '()', output: 'true', isHidden: false, description: 'Simple valid' },
          { input: '()[]{}', output: 'true', isHidden: false, description: 'Multiple types' },
          { input: '(]', output: 'false', isHidden: false, description: 'Mismatched' },
          { input: '([)]', output: 'false', isHidden: true, description: 'Wrong order' },
          { input: '{[]}', output: 'true', isHidden: true, description: 'Nested valid' },
        ],
        hints: [
          { content: 'Use a stack data structure to keep track of opening brackets.', cost: 0 },
          { content: 'When you see a closing bracket, check if the top of the stack is the matching opening bracket.', cost: 1 },
          { content: 'If the stack is empty when you see a closing bracket, or the brackets dont match, return false.', cost: 2 },
        ],
        solution: `var isValid = function(s) {\n    const stack = [];\n    const map = { ')': '(', '}': '{', ']': '[' };\n    for (const char of s) {\n        if (!map[char]) {\n            stack.push(char);\n        } else if (stack.pop() !== map[char]) {\n            return false;\n        }\n    }\n    return stack.length === 0;\n};`,
        constraints: [
          '1 <= s.length <= 10^4',
          's consists of parentheses only \'()[]{}\'',
        ],
        companies: ['Amazon', 'Meta', 'Google', 'Microsoft', 'Bloomberg', 'Goldman Sachs'],
        topics: ['String', 'Stack'],
        acceptanceRate: 40.8,
        totalAccepted: 2890123,
        totalSubmissions: 7082456,
        discussionCount: 1567,
        timeLimit: 5000,
        memoryLimit: 256,
      },
      status: 'approved',
      source: 'manual',
      createdBy: userId,
    },
  ]

  for (const p of problems) {
    await Question.create({ ...p, tags: [tag._id] })
  }

  await Tag.findByIdAndUpdate(tag._id, { $inc: { usageCount: problems.length } })

  return { seeded: true, count: problems.length }
}
