import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, Session } from '../types';

// In a real application, this would be stored in a database
const users: Array<User> = [
  {
    username: 'superUser',
    // In production, use hashed passwords!
    password: bcrypt.hashSync('superpass', 10),
    role: 'super_user',
    company: null,
    whitelabel: null,
  },
  {
    username: 'admin_user',
    password: bcrypt.hashSync('adminpass', 10),
    role: 'admin_user',
    company: 'Vandelay Industries',
    whitelabel: {
      logo: '/static/vandelay_logo.png',
      theme: 'default',
    },
  },
  {
    username: 'test_user',
    password: bcrypt.hashSync('testpass', 10),
    role: 'test_user',
    company: 'Vandelay Industries',
    whitelabel: {
      logo: '/static/vandelay_logo.png',
      theme: 'default',
    },
  },
];

export const userService = {
  authenticate: async (username: string, password: string) => {
    const user = users.find((u) => u.username === username);
    if (!user || !await bcrypt.compare(password, user.password)) {
      return null;
    }

    const session: Session = {
      username: user.username,
      role: user.role,
      company: user.company,
      whitelabel: user.whitelabel,
    };

    const token = jwt.sign(session, config.jwtSecret, { expiresIn: '24h' });
    return { token, user: session };
  },

  validateSession: (token: string): Session | null => {
    try {
      return jwt.verify(token, config.jwtSecret) as Session;
    } catch {
      return null;
    }
  },
};
