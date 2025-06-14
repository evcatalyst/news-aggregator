import axios from 'axios';
import { config } from '../config/env';
import { newsCache } from './cache';
import { NewsApiResponse } from '../types';

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

export const newsService = {
  getNews: async (query: string): Promise<NewsApiResponse> => {
    const cacheKey = `news:${query}`;
    const cachedData = newsCache.get(cacheKey);
    if (cachedData) {
      return cachedData as NewsApiResponse;
    }

    try {
      const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
        params: {
          q: query,
          sortBy: 'publishedAt',
          language: 'en',
        },
        headers: {
          'X-Api-Key': config.newsApiKey,
        },
      });

      const data = response.data;
      newsCache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch news: ${error.message}`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },

  getTopHeadlines: async (country: string = 'us'): Promise<NewsApiResponse> => {
    const cacheKey = `headlines:${country}`;
    const cachedData = newsCache.get(cacheKey);
    if (cachedData) {
      return cachedData as NewsApiResponse;
    }

    try {
      const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
        params: {
          country,
        },
        headers: {
          'X-Api-Key': config.newsApiKey,
        },
      });

      const data = response.data;
      newsCache.set(cacheKey, data);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch headlines: ${error.message}`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  },
};
