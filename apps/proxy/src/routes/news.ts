import { Router } from 'express';
import { newsController } from '../controllers/news';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/news', authenticateToken, newsController.getNews);
router.get('/top-headlines', authenticateToken, newsController.getTopHeadlines);

export const newsRoutes = router;
