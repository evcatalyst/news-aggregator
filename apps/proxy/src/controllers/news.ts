import { newsService } from '../services/news';
import { Request, Response, RequestHandler } from '../types/express';

export const newsController = {
  getNews: async (req: Request, res: Response): Promise<void> => {
    const { q: query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    try {
      const news = await newsService.getNews(query);
      res.json(news);
    } catch (error) {
      console.error('News fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch news' });
    }
  },

  getTopHeadlines: async (req: Request, res: Response): Promise<void> => {
    const { country } = req.query;

    try {
      const headlines = await newsService.getTopHeadlines(
        typeof country === 'string' ? country : 'us'
      );
      res.json(headlines);
    } catch (error) {
      console.error('Headlines fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch headlines' });
    }
  },
};
