import { executeRemote } from './remoteExecutor.js'

const JUDGE0_ENABLED = process.env.JUDGE0_ENABLED !== 'false'

export function detectLanguages() {
  if (JUDGE0_ENABLED) {
    console.log('Remote execution via Judge0 CE enabled (all languages available)')
  } else {
    console.log('Remote execution disabled')
  }
}

export function getSupportedLanguages() {
  return [
    { id: 'javascript', label: 'JavaScript', available: true },
    { id: 'python', label: 'Python', available: true },
    { id: 'cpp', label: 'C++', available: true },
    { id: 'java', label: 'Java', available: true },
    { id: 'c', label: 'C', available: true },
  ]
}

const COMMON_HEADERS_CPP = '#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\n#include <queue>\n#include <stack>\n#include <set>\n#include <map>\n#include <algorithm>\n#include <cmath>\n#include <climits>\n'

function generateJavaScriptHarness(code) {
  let m = code.match(/\bfunction\s+(\w+)\s*\(([^)]*)\)/s)
  if (!m) m = code.match(/(?:var|let|const)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)\s*\(([^)]*)\)/s)
  if (!m) return null
  const funcName = m[1], paramsStr = m[2].trim()
  const hasParams = paramsStr.length > 0
  if (!hasParams) return `${code}\nvar _jr=typeof ${funcName}==='function'?${funcName}():null;if(_jr!==null&&_jr!==undefined)print(_jr);`
  return `${code}\nif(typeof input!=='undefined'&&input!==null&&input!==''){try{var _args=JSON.parse('['+input.trim().replace(/\\n/g,',')+']');if(!Array.isArray(_args))_args=[_args];var _jr=${funcName}(..._args);if(_jr!==undefined)print(_jr);}catch(e){var _jr2=${funcName}(input.trim());if(_jr2!==undefined)print(_jr2);}}`
}

async function executeJS(code, input, harness) {
  let userCode = code
  if (harness) {
    userCode = harness.replace('{{USER_CODE}}', code)
  } else {
    userCode = generateJavaScriptHarness(code) || code
  }
  const wrappedCode = `
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
function main() {
  const input = ${JSON.stringify(input)};
  const lines = input ? input.split('\\n') : [];
  let lineIdx = 0;
  global.readline = () => lines[lineIdx++] || '';
  global.print = console.log;
${userCode}
}
main();
`.trim()
  const start = performance.now()
  const result = await executeRemote(wrappedCode, 'javascript', '', 10000)
  const executionTime = Math.round(performance.now() - start)
  return { output: result.output, executionTime, memoryUsed: 0 }
}

function generateCppHarness(code) {
  const clsMatch = code.match(/class\s+Solution\s*\{([\s\S]*?)\};/s)
  if (!clsMatch) return null
  const methodMatch = clsMatch[1].match(/public:\s*([\w:]+)\s+(\w+)\s*\(([^)]*)\)/s)
  if (!methodMatch) return null

  const returnType = methodMatch[1].trim()
  const methodName = methodMatch[2].trim()
  const params = methodMatch[3].split(',').map(p => p.trim()).filter(p => p)

  const paramInfos = params.map(p => {
    const cleaned = p.replace(/&/g, ' ').replace(/\s+/g, ' ').trim()
    const parts = cleaned.split(' ')
    const type = parts.slice(0, -1).join(' ')
    const name = parts[parts.length - 1]
    return { raw: p, type, name }
  })

  let parseVars = '', callArgs = '', helperFuncs = ''

  paramInfos.forEach((p, i) => {
    callArgs += (i > 0 ? ', ' : '') + p.name

    if (p.type.includes('vector<vector<int>>') || p.type.includes('vector<vector<int> >')) {
      helperFuncs += `vector<vector<int>> _pvv${i}(string s) {
  vector<vector<int>> r; int i=0;
  while((i=s.find('[',i))!=string::npos){int j=s.find(']',i);if(j==string::npos)break;
    string sub=s.substr(i+1,j-i-1);stringstream ss(sub);string t;vector<int> row;
    while(getline(ss,t,',')){t.erase(0,t.find_first_not_of(' '));if(!t.empty())row.push_back(stoi(t));}
    r.push_back(row);i=j+1;}
  return r;}\n`
      parseVars += `vector<vector<int>> ${p.name}=_pvv${i}(line);\n`
    } else if (p.type.includes('vector<int>')) {
      helperFuncs += `vector<int> _pvec${i}(string s) {
  vector<int> r; auto a=s.find('['), b=s.find(']');
  if(a==string::npos||b==string::npos)return r;
  string sub=s.substr(a+1,b-a-1); stringstream ss(sub); string t;
  while(getline(ss,t,',')){t.erase(0,t.find_first_not_of(' '));if(!t.empty())r.push_back(stoi(t));}
  return r;}\n`
      parseVars += `vector<int> ${p.name}=_pvec${i}(line);\n`
    } else if (p.type.includes('vector<char>')) {
      helperFuncs += `vector<char> _pvc${i}(string s) {
  vector<char> r; bool q=false;
  for(unsigned j=0;j<s.size();j++){if(s[j]=='"'){q=!q;continue;}if(q)r.push_back(s[j]);}
  return r;}\n`
      parseVars += `vector<char> ${p.name}=_pvc${i}(line);\n`
    } else if (p.type === 'int') {
      helperFuncs += `int _pint${i}(string s) {
  auto pos=s.rfind(']');if(pos!=string::npos)s=s.substr(pos);
  string n;bool f=false;
  for(char c:s){if(c=='-'||(c>='0'&&c<='9')){n+=c;f=true;}else if(f&&!n.empty())break;}
  return n.empty()?0:stoi(n);}\n`
      parseVars += `int ${p.name}=_pint${i}(line);\n`
    } else if (p.type === 'string' || p.type.includes('string')) {
      helperFuncs += `string _pstr${i}(string s) {
  auto a=s.find('"'); if(a==string::npos){s.erase(0,s.find_first_not_of(' '));return s;}
  auto b=s.find('"',a+1); return s.substr(a+1,b-a-1);}\n`
      parseVars += `string ${p.name}=_pstr${i}(line);\n`
    } else if (p.type === 'bool') {
      helperFuncs += `bool _pbool${i}(string s) {
  return s.find("true")!=string::npos;}\n`
      parseVars += `bool ${p.name}=_pbool${i}(line);\n`
    } else if (p.type === 'double' || p.type === 'float') {
      helperFuncs += `double _pdbl${i}(string s) {
  string n; bool f=false;
  for(char c:s){if(c=='-'||c=='.'||(c>='0'&&c<='9')){n+=c;f=true;}else if(f&&n.length()>0)break;}
  return n.empty()?0.0:stod(n);}\n`
      parseVars += `double ${p.name}=_pdbl${i}(line);\n`
    } else {
      return null
    }
  })

  let outputCode
  if (returnType === 'int' || returnType === 'double' || returnType === 'float') {
    outputCode = 'cout << result << endl;'
  } else if (returnType.includes('vector<vector<int>>') || returnType.includes('vector<vector<int> >')) {
    helperFuncs += 'string _strvv(vector<vector<int>> v){string r="[";for(unsigned i=0;i<v.size();i++){r+="[";for(unsigned j=0;j<v[i].size();j++){r+=to_string(v[i][j]);if(j<v[i].size()-1)r+=",";}r+="]";if(i<v.size()-1)r+=",";}return r+"]";}\n'
    outputCode = 'cout << _strvv(result) << endl;'
  } else if (returnType.includes('vector<int>')) {
    helperFuncs += 'string _strvec(vector<int> v){string r="[";for(unsigned i=0;i<v.size();i++){r+=to_string(v[i]);if(i<v.size()-1)r+=",";}return r+"]";}\n'
    outputCode = 'cout << _strvec(result) << endl;'
  } else if (returnType.includes('vector<char>')) {
    helperFuncs += 'string _strvc(vector<char> v){string r="[";for(unsigned i=0;i<v.size();i++){r+="\\"";r+=v[i];r+="\\"";if(i<v.size()-1)r+=",";}return r+"]";}\n'
    outputCode = 'cout << _strvc(result) << endl;'
  } else if (returnType === 'bool') {
    outputCode = 'cout << (result?"true":"false") << endl;'
  } else if (returnType === 'string' || returnType.includes('string')) {
    outputCode = 'cout << result << endl;'
  } else if (returnType === 'void') {
    return `${COMMON_HEADERS_CPP}using namespace std;\n${helperFuncs}${code}\nint main(){\nstring line;getline(cin,line);\n${parseVars}Solution sol;\nsol.${methodName}(${callArgs});\nreturn 0;\n}`
  } else if (returnType.includes('vector<string>')) {
    outputCode = 'cout << "[" << result[0]; for(unsigned i=1;i<result.size();i++)cout<<","<<result[i]; cout << "]" << endl;'
  } else {
    return null
  }

  return `${COMMON_HEADERS_CPP}using namespace std;\n${helperFuncs}${code}\nint main(){\nstring line;getline(cin,line);\n${parseVars}Solution sol;\nauto result=sol.${methodName}(${callArgs});\n${outputCode}\nreturn 0;\n}`
}

async function executeCpp(code, input, harness) {
  const wrappedCode = harness
    ? harness.replace('{{USER_CODE}}', code)
    : (generateCppHarness(code) || `${COMMON_HEADERS_CPP}using namespace std;\n${code}\nint main(){string l;getline(cin,l);cout<<l<<endl;return 0;}`)
  const start = performance.now()
  const result = await executeRemote(wrappedCode, 'cpp', input, 15000)
  const executionTime = Math.round(performance.now() - start)
  return { output: result.output, executionTime, memoryUsed: 0 }
}

function generateCHarness(code) {
  const funcMatch = code.match(/([\w\s\*]+)\s+(\w+)\s*\(([^)]*)\)\s*\{/)
  if (!funcMatch) return null
  const returnType = funcMatch[1].trim()
  const funcName = funcMatch[2].trim()
  const paramsStr = funcMatch[3].trim()
  const params = paramsStr.split(',').map(p => p.trim()).filter(p => p)
  const paramNames = params.map(p => p.split(/\s+/).pop())

  let parseCode = '', callArgs = ''
  params.forEach((p, i) => {
    const parts = p.split(/\s+/)
    const type = parts.slice(0, -1).join(' ')
    const name = parts[parts.length - 1]
    callArgs += (i > 0 ? ', ' : '') + name
    if (type.includes('int') && type.includes('*')) {
      parseCode += `int ${name}; scanf("%d", &${name});\n`
    } else if (type === 'int' || type === 'int ' || type.includes('int')) {
      parseCode += `int ${name}; scanf("%d", &${name});\n`
    } else if (type === 'char' || type === 'char ') {
      parseCode += `char ${name}; scanf(" %c", &${name});\n`
    } else if (type === 'double' || type === 'float') {
      parseCode += `double ${name}; scanf("%lf", &${name});\n`
    } else { return null }
  })

  let outputCode
  if (returnType === 'void') {
    outputCode = `${funcName}(${callArgs});`
  } else if (returnType === 'int') {
    outputCode = `int result = ${funcName}(${callArgs}); printf("%d", result);`
  } else if (returnType === 'char') {
    outputCode = `char result = ${funcName}(${callArgs}); printf("%c", result);`
  } else if (returnType === 'double' || returnType === 'float') {
    outputCode = `double result = ${funcName}(${callArgs}); printf("%g", result);`
  } else if (returnType.includes('char') && returnType.includes('*')) {
    outputCode = `char* result = ${funcName}(${callArgs}); printf("%s", result);`
  } else { return null }

  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
#include <stdbool.h>

${code}

int main() {
${parseCode}${outputCode}
    return 0;
}`
}

async function executeC(code, input) {
  const headers = '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n#include <limits.h>\n#include <stdbool.h>\n'
  const wrappedCode = generateCHarness(code) || `${headers}\n${code}\nint main(){printf("Hello, World!\\n");return 0;}`
  const start = performance.now()
  const result = await executeRemote(wrappedCode, 'c', input, 15000)
  const executionTime = Math.round(performance.now() - start)
  return { output: result.output, executionTime, memoryUsed: 0 }
}

function generateJavaHarness(code) {
  const clsMatch = code.match(/class\s+Solution\s*\{([\s\S]*?)\}/s)
  if (!clsMatch) return null
  const methodMatch = clsMatch[1].match(/(?:public\s+)?([\w<>[\]]+)\s+(\w+)\s*\(([^)]*)\)/s)
  if (!methodMatch) return null

  const returnType = methodMatch[1].trim()
  const methodName = methodMatch[2].trim()
  const paramsStr = methodMatch[3].trim()
  const params = paramsStr.split(',').map(p => p.trim()).filter(p => p)
  const paramTypes = params.map(p => p.replace(/final\s+/g, '').replace(/&/g, '').trim().split(/\s+/)).map(parts => ({ type: parts.slice(0, -1).join(' '), name: parts[parts.length - 1] }))

  let parseCode = '', callArgs = '', helpers = ''

  paramTypes.forEach((p, i) => {
    callArgs += (i > 0 ? ', ' : '') + p.name
    if (p.type.includes('int[') && p.type.includes('][')) {
      helpers += `    static int[][] _parseInt2d(String s) { s=s.trim(); java.util.List<int[]> l=new java.util.ArrayList<>(); int i=s.indexOf("["); while(i>=0){int j=s.indexOf("]",i); if(j<0)break; l.add(_parseIntArray(s.substring(i,j+1))); i=s.indexOf("[",j+1);} return l.toArray(new int[0][]); }\n`
      parseCode += `    int[][] ${p.name} = _parseInt2d(_line);\n`
    } else if (p.type.includes('int[') && p.type.includes('[')) {
      helpers += `    static int[] _parseIntArray(String s) { s=s.trim(); if(s.startsWith("["))s=s.substring(1,s.lastIndexOf("]")); String[] p=s.split(","); int[] r=new int[p.length]; for(int i=0;i<p.length;i++)r[i]=Integer.parseInt(p[i].trim()); return r; }\n`
      parseCode += `    int[] ${p.name} = _parseIntArray(_line);\n`
    } else if (p.type.includes('char[') && p.type.includes('[')) {
      helpers += `    static char[] _parseCharArray(String s) { StringBuilder r=new StringBuilder(); boolean q=false; for(int i=0;i<s.length();i++){if(s.charAt(i)=='"'){q=!q;continue;}if(q)r.append(s.charAt(i));} return r.toString().toCharArray(); }\n`
      parseCode += `    char[] ${p.name} = _parseCharArray(_line);\n`
    } else if (p.type === 'int' || p.type === 'Integer') {
      helpers += `    static int _parseInt(String s) { s=s.trim(); int i=s.lastIndexOf(']'); if(i>=0)s=s.substring(i); StringBuilder n=new StringBuilder(); for(char c:s.toCharArray()){if(c=='-'||(c>='0'&&c<='9'))n.append(c);else if(n.length()>0)break;} return n.length()==0?0:Integer.parseInt(n.toString()); }\n`
      parseCode += `    int ${p.name} = _parseInt(_line);\n`
    } else if (p.type === 'String') {
      helpers += `    static String _parseStr(String s) { s=s.trim(); if(s.startsWith("\\"")){int e=s.indexOf("\\"",1);return e>0?s.substring(1,e):s.substring(1);} return s; }\n`
      parseCode += `    String ${p.name} = _parseStr(_line);\n`
    } else if (p.type === 'boolean' || p.type === 'Boolean') {
      parseCode += `    boolean ${p.name} = _line.contains("true");\n`
    } else { return null }
  })

  let callExpr = `new Solution().${methodName}(${callArgs})`

  if (returnType === 'void') {
    const mainBody = `
    java.io.ByteArrayOutputStream __baos = new java.io.ByteArrayOutputStream();
    java.io.PrintStream __orig = System.out;
    System.setOut(new java.io.PrintStream(__baos));
    ${callExpr};
    System.setOut(__orig);
    String __cap = __baos.toString().trim();
    if (!__cap.isEmpty()) System.out.println(__cap);`
    return `import java.io.*;
import java.util.*;
import java.math.*;

${code}

class Main {
${helpers}
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String _line = sc.nextLine();${parseCode}${mainBody}
  }
}`
  }

  let toStrExpr = ''
  if (returnType === 'int' || returnType === 'double' || returnType === 'float' || returnType === 'long') {
    toStrExpr = 'String __rStr = String.valueOf(result);'
  } else if (returnType.includes('int[') && !returnType.includes('][')) {
    helpers += `    static String _arrToStr(int[] a) { StringBuilder r=new StringBuilder("["); for(int i=0;i<a.length;i++){r.append(a[i]);if(i<a.length-1)r.append(",");} r.append("]"); return r.toString(); }\n`
    toStrExpr = 'String __rStr = _arrToStr(result);'
  } else if (returnType.includes('char[')) {
    helpers += `    static String _carrToStr(char[] a) { StringBuilder r=new StringBuilder("["); for(int i=0;i<a.length;i++){r.append("\\"").append(a[i]).append("\\"");if(i<a.length-1)r.append(",");} r.append("]"); return r.toString(); }\n`
    toStrExpr = 'String __rStr = _carrToStr(result);'
  } else if (returnType === 'boolean' || returnType === 'Boolean') {
    toStrExpr = 'String __rStr = String.valueOf(result);'
  } else if (returnType === 'String') {
    toStrExpr = 'String __rStr = result == null ? "null" : result;'
  } else if (returnType.includes('List')) {
    toStrExpr = 'String __rStr = String.valueOf(result);'
  } else { return null }

  const mainBody = `
    java.io.ByteArrayOutputStream __baos = new java.io.ByteArrayOutputStream();
    java.io.PrintStream __orig = System.out;
    System.setOut(new java.io.PrintStream(__baos));
    ${returnType} result = ${callExpr};
    System.setOut(__orig);
    String __cap = __baos.toString().trim();
    ${toStrExpr}
    if (!__cap.isEmpty()) System.out.println(__cap);
    else System.out.println(__rStr);`

  return `import java.io.*;
import java.util.*;
import java.math.*;

${code}

class Main {
${helpers}
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String _line = sc.nextLine();${parseCode}${mainBody}
  }
}`
}

async function executeJava(code, input, harness) {
  let wrappedCode
  if (harness) {
    wrappedCode = harness.replace('{{USER_CODE}}', code)
  } else {
    const genCode = generateJavaHarness(code)
    if (genCode) {
      wrappedCode = genCode
    } else {
      wrappedCode = code
    }
  }
  const start = performance.now()
  const result = await executeRemote(wrappedCode, 'java', input, 15000)
  const executionTime = Math.round(performance.now() - start)
  return { output: result.output, executionTime, memoryUsed: 0 }
}

function generatePythonHarness(code) {
  const funcMatch = code.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:/s)
  if (!funcMatch) return null

  const funcName = funcMatch[1].trim()
  const paramsStr = funcMatch[2].trim()
  const params = paramsStr.split(',').map(p => p.trim()).filter(p => p)

  let callArgs = params.map(p => {
    const parts = p.split(':')
    return parts[0].trim()
  })

  let header = 'import sys, math, random, heapq, bisect, itertools, functools, collections, statistics, ast\nfrom collections import *\nfrom heapq import *\nfrom itertools import *\nfrom functools import *\nfrom math import *\n'
  let body
  if (callArgs.length === 0) {
    body = `line = sys.stdin.read().strip()
_r = ${funcName}()
if _r is not None: print(_r)`
  } else {
    body = `line = sys.stdin.read().strip()
if not line:
    _r = ${funcName}()
    if _r is not None: print(_r)
elif ',' in line or line.startswith('[') or line.startswith('"') or line.startswith("'"):
    try:
        args = ast.literal_eval('(' + line.replace('\\n', ',') + ')')
        if not isinstance(args, tuple):
            args = (args,)
        _r = ${funcName}(*args)
        if _r is not None: print(_r)
    except:
        _r = ${funcName}(line)
        if _r is not None: print(_r)
else:
    _r = ${funcName}(line)
    if _r is not None: print(_r)`
  }

  return `${header}\n${code}\n\n${body}\n`
}

async function executePython(code, input) {
  const wrappedCode = generatePythonHarness(code) || `
import sys, math, random, heapq, bisect, itertools, functools, collections, statistics
from collections import *
from heapq import *
from itertools import *
from functools import *
from math import *
def input():
    return sys.stdin.readline()
${code}
  `
  const start = performance.now()
  const result = await executeRemote(wrappedCode, 'python', input, 10000)
  const executionTime = Math.round(performance.now() - start)
  return { output: result.output, executionTime, memoryUsed: 0 }
}

async function executeCode(code, language, input, harness) {
  switch (language) {
    case 'javascript':
    case 'js':
      return await executeJS(code, input, harness)
    case 'python':
    case 'py':
      return await executePython(code, input)
    case 'cpp':
    case 'c++':
      return await executeCpp(code, input, harness)
    case 'java':
      return await executeJava(code, input, harness)
    case 'c':
      return await executeC(code, input)
    default:
      throw new Error(`Language "${language}" is not supported for execution`)
  }
}

async function runSingleTestCase(code, language, testCase, harness) {
  try {
    const result = await executeCode(code, language, testCase.input, harness)
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

export async function runTestCases(code, language, testCases, harness) {
  const results = []
  for (const tc of testCases) {
    results.push(await runSingleTestCase(code, language, tc, harness))
  }
  return results
}

export async function runSampleTests(code, language, testCases, harness) {
  const sample = testCases.filter((tc) => !tc.isHidden)
  return await runTestCases(code, language, sample, harness)
}

export async function runAllTests(code, language, testCases, harness) {
  return await runTestCases(code, language, testCases, harness)
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
