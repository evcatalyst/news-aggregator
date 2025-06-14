export interface User {
  username: string;
  password: string;
  role: 'super_user' | 'admin_user' | 'test_user';
  company: string | null;
  whitelabel: {
    logo: string;
    theme: string;
  } | null;
}

export interface Session {
  username: string;
  role: User['role'];
  company: User['company'];
  whitelabel: User['whitelabel'];
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Article[];
}

export interface Article {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}
