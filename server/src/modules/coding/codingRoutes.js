import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import * as codingController from './codingController.js'

const router = Router()

router.use(authenticate)

router.get('/languages', codingController.getLanguages)
router.post('/run', codingController.runCode)
router.post('/submit', codingController.submitCode)
router.post('/seed', codingController.seedProblems)

router.get('/submissions/:questionId', codingController.getSubmissions)
router.get('/submission/:id', codingController.getSubmissionById)

router.post('/bookmarks/:questionId', codingController.toggleBookmark)
router.get('/bookmarks', codingController.getBookmarks)

router.get('/progress', codingController.getProgress)
router.get('/leaderboard', codingController.getLeaderboard)

router.get('/comments/:questionId', codingController.getComments)
router.post('/comments/:questionId', codingController.addComment)
router.delete('/comments/:id', codingController.deleteComment)
router.post('/comments/:id/like', codingController.toggleCommentLike)

export default router
