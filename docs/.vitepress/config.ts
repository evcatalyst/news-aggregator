import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'News Aggregator',
  description: 'AI-Powered News Dashboard',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Deploy', link: '/deploy/' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is News Aggregator?', link: '/introduction/what-is-news-aggregator' },
          { text: 'Getting Started', link: '/introduction/getting-started' },
          { text: 'Core Concepts', link: '/introduction/core-concepts' }
        ]
      },
      {
        text: 'User Guide',
        items: [
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Usage', link: '/guide/usage' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Overview', link: '/api/overview' },
          { text: 'Endpoints', link: '/api/endpoints' },
          { text: 'Data Models', link: '/api/models' }
        ]
      },
      {
        text: 'Deployment',
        items: [
          { text: 'Development', link: '/deploy/development' },
          { text: 'Production', link: '/deploy/production' },
          { text: 'Monitoring', link: '/deploy/monitoring' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/news-aggregator' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025'
    }
  }
})
