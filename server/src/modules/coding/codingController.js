import * as codingService from './codingService.js'
import { getQuestionById } from '../questions/questionService.js'
import CodingSubmission from './CodingSubmission.js'
import CodingBookmark from './CodingBookmark.js'
import CodingProgress from './CodingProgress.js'
import CodingComment from './CodingComment.js'
import { NotFoundError } from '../../shared/errors/AppError.js'

const HELLO_WORLD = {
  title: 'Hello World',
  codingDetails: {
    testCases: [
      { input: '(no input)', output: 'Hello, World!', isHidden: false, description: 'Should print exactly "Hello, World!"' },
    ],
    harnesses: {
      cpp: `#include <iostream>\nusing namespace std;\n{{USER_CODE}}\nint main() {\n    Solution sol;\n    sol.helloWorld();\n    cout << endl;\n    return 0;\n}`,
    },
  },
}

async function resolveQuestion(questionId) {
  try {
    return await getQuestionById(questionId)
  } catch (err) {
    if (questionId === 'hello-world' || err.name === 'CastError') {
      return null
    }
    throw err
  }
}

function getTestData(questionId, question, lang) {
  if (question) {
    const dbHarnesses = question.codingDetails?.harnesses || {}
    let harness = dbHarnesses[lang] || dbHarnesses.get?.(lang) || null
    if (!harness && (lang === 'cpp' || lang === 'c++')) {
      harness = CPP_HARNESSES[question.title] || null
    }
    return {
      testCases: question.codingDetails?.testCases || [],
      harness,
      title: question.title,
    }
  }
  // Fallback for Hello World
  const harness = HELLO_WORLD.codingDetails.harnesses[lang] || null
  return {
    testCases: HELLO_WORLD.codingDetails.testCases,
    harness,
    title: HELLO_WORLD.title,
  }
}

const CPP_HARNESSES = {
  'Two Sum': `#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\nvector<int> parseArray(string s){vector<int> r;s.erase(0,1);s.pop_back();if(s.empty())return r;stringstream ss(s);string t;while(getline(ss,t,',')){t.erase(0,t.find_first_not_of(' '));r.push_back(stoi(t));}return r;}\nstring stringifyArray(vector<int> v){string r="[";for(int i=0;i<(int)v.size();i++){r+=to_string(v[i]);if(i<(int)v.size()-1)r+=",";}return r+"]";}\n{{USER_CODE}}\nint main(){string line;getline(cin,line);vector<int>nums=parseArray(line);int target;cin>>target;Solution sol;vector<int>result=sol.twoSum(nums,target);cout<<stringifyArray(result)<<endl;return 0;}`,
  'Reverse String': `#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\nvector<char> parseCharArray(string s){vector<char>r;bool inQ=false;for(int i=1;i<(int)s.size();i++){if(s[i]=='"'){inQ=!inQ;continue;}if(inQ)r.push_back(s[i]);}return r;}\nstring stringifyCharArray(vector<char>v){string r="[";for(int i=0;i<(int)v.size();i++){r+='"';r+=v[i];r+='"';if(i<(int)v.size()-1)r+=",";}return r+"]";}\n{{USER_CODE}}\nint main(){string line;getline(cin,line);vector<char>s=parseCharArray(line);Solution sol;sol.reverseString(s);cout<<stringifyCharArray(s)<<endl;return 0;}`,
  'Valid Parentheses': `#include <iostream>\n#include <string>\nusing namespace std;\n{{USER_CODE}}\nint main(){string line;getline(cin,line);Solution sol;cout<<(sol.isValid(line)?"true":"false")<<endl;return 0;}`,
}

export async function runCode(req, res, next) {
  try {
    const { code, language, questionId } = req.validatedBody
    const question = await resolveQuestion(questionId)
    const { testCases, harness } = getTestData(questionId, question, language)
    const results = await codingService.runSampleTests(code, language, testCases, harness)
    const totalTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0)
    const maxMemory = results.length ? Math.max(...results.map(r => r.memoryUsed || 0)) : 0
    res.json({ success: true, data: { results, executionTime: totalTime, memoryUsed: maxMemory }, message: 'Tests executed', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function submitCode(req, res, next) {
  try {
    const { code, language, questionId } = req.validatedBody
    const question = await resolveQuestion(questionId)
    if (!question) throw new NotFoundError('Question not found')
    const { testCases, harness } = getTestData(questionId, question, language)
    const results = await codingService.runAllTests(code, language, testCases, harness)
    const passed = results.filter((r) => r.passed).length
    const total = results.length
    const allPassed = passed === total
    const totalTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0)
    const maxMemory = results.length ? Math.max(...results.map(r => r.memoryUsed || 0)) : 0

    const submission = await CodingSubmission.create({
      user: req.user._id,
      question: questionId,
      code,
      language,
      results,
      passed,
      total,
      allPassed,
      executionTime: totalTime,
      memoryUsed: maxMemory,
      status: allPassed ? 'accepted' : results.some(r => r.error) ? 'error' : 'wrong_answer',
    })

    if (allPassed) {
      const progress = await CodingProgress.findOne({ user: req.user._id })
      const isNewlySolved = !progress?.solvedProblems?.includes(questionId)
      await CodingProgress.findOneAndUpdate(
        { user: req.user._id },
        {
          $addToSet: { solvedProblems: questionId },
          $inc: {
            totalSolved: isNewlySolved ? 1 : 0,
            totalSubmissions: 1,
            [`${question?.difficulty || 'easy'}Solved`]: isNewlySolved ? 1 : 0,
          },
          $set: { lastSolvedDate: new Date() },
        },
        { upsert: true }
      )
    } else {
      await CodingProgress.findOneAndUpdate(
        { user: req.user._id },
        { $inc: { totalSubmissions: 1 } },
        { upsert: true }
      )
    }

    res.json({ success: true, data: { results, passed, total, allPassed, executionTime: totalTime, memoryUsed: maxMemory, submissionId: submission._id }, message: 'Solution submitted', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function seedProblems(req, res, next) {
  try {
    const result = await codingService.seedDemoProblems(req.user._id)
    res.status(result.seeded ? 201 : 200).json({ success: true, data: result, message: result.message, errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getSubmissions(req, res, next) {
  try {
    const { questionId } = req.params
    const submissions = await CodingSubmission.find({ user: req.user._id, question: questionId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-results')
    res.json({ success: true, data: submissions, message: 'Submissions fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getSubmissionById(req, res, next) {
  try {
    const submission = await CodingSubmission.findById(req.params.id)
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' })
    if (submission.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this submission' })
    }
    res.json({ success: true, data: submission, message: 'Submission fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function toggleBookmark(req, res, next) {
  try {
    const { questionId } = req.params
    const existing = await CodingBookmark.findOne({ user: req.user._id, question: questionId })
    if (existing) {
      await CodingBookmark.deleteOne({ _id: existing._id })
      res.json({ success: true, data: { bookmarked: false }, message: 'Bookmark removed', errors: null, meta: null })
    } else {
      await CodingBookmark.create({ user: req.user._id, question: questionId })
      res.json({ success: true, data: { bookmarked: true }, message: 'Bookmark added', errors: null, meta: null })
    }
  } catch (error) { next(error) }
}

export async function getBookmarks(req, res, next) {
  try {
    const bookmarks = await CodingBookmark.find({ user: req.user._id })
      .populate('question', 'title difficulty')
      .sort({ createdAt: -1 })
    res.json({ success: true, data: bookmarks, message: 'Bookmarks fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getProgress(req, res, next) {
  try {
    let progress = await CodingProgress.findOne({ user: req.user._id })
    if (!progress) {
      progress = await CodingProgress.create({ user: req.user._id })
    }
    res.json({ success: true, data: progress, message: 'Progress fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getLeaderboard(req, res, next) {
  try {
    const leaderboard = await CodingProgress.find()
      .populate('user', 'name email')
      .sort({ totalSolved: -1, totalSubmissions: 1 })
      .limit(50)
    res.json({ success: true, data: leaderboard, message: 'Leaderboard fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getComments(req, res, next) {
  try {
    const { questionId } = req.params
    const comments = await CodingComment.find({ question: questionId, parentComment: null })
      .populate('user', 'name')
      .populate({ path: 'parentComment', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 })
    res.json({ success: true, data: comments, message: 'Comments fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function addComment(req, res, next) {
  try {
    const { questionId } = req.params
    const { content, parentComment } = req.validatedBody
    const comment = await CodingComment.create({
      user: req.user._id,
      question: questionId,
      content: content.trim(),
      parentComment: parentComment || null,
    })
    const populated = await comment.populate('user', 'name')
    res.status(201).json({ success: true, data: populated, message: 'Comment added', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function deleteComment(req, res, next) {
  try {
    const comment = await CodingComment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' })
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    await CodingComment.deleteMany({ parentComment: comment._id })
    await comment.deleteOne()
    res.json({ success: true, data: null, message: 'Comment deleted', errors: null, meta: null })
  } catch (error) { next(error) }
}

export function getLanguages(req, res) {
  res.json({ success: true, data: codingService.getSupportedLanguages(), message: 'Languages fetched' })
}

export async function toggleCommentLike(req, res, next) {
  try {
    const comment = await CodingComment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' })
    const liked = comment.likes.includes(req.user._id)
    if (liked) {
      comment.likes.pull(req.user._id)
    } else {
      comment.likes.push(req.user._id)
    }
    await comment.save()
    res.json({ success: true, data: { liked: !liked, likesCount: comment.likes.length }, message: liked ? 'Like removed' : 'Comment liked', errors: null, meta: null })
  } catch (error) { next(error) }
}
