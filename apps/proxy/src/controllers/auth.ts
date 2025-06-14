import { userService } from '../services/user';
import { Request, Response, RequestHandler } from '../types/express';

export const authController = {
  login: async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
      const result = await userService.authenticate(username, password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getMe: async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json(req.user);
  },
};
