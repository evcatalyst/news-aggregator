# Deployment Guide

This document outlines deployment processes for both development and production environments.

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 18+
- NewsAPI and xAI API keys

### Setup
1. Clone the repository
2. Copy environment configuration:
   ```bash
   cp proxy/.env.example proxy/.env
   ```
3. Configure API keys in proxy/.env
4. Start development stack:
   ```bash
   cd proxy && ./rebuild_stack.sh
   ```

## Production Deployment

### Render Deployment

1. Fork the repository
2. Connect to Render (render.com)
3. Create a new "Blueprint" instance
4. Link your repository
5. Configure environment variables:
   - NEWS_API_KEY
   - XAI_API_KEY
6. Deploy

The render.yaml configuration will automatically:
- Build and deploy the frontend static site
- Deploy the API proxy service
- Configure service dependencies
- Set up health checks

### Manual Deployment

1. Build frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Set up proxy:
   ```bash
   cd proxy
   npm install
   ```

3. Configure environment:
   ```bash
   export NEWS_API_KEY=your_key
   export XAI_API_KEY=your_key
   export NODE_ENV=production
   ```

4. Start services:
   ```bash
   node server.js
   ```

## GitHub Pages Documentation

The project documentation is automatically deployed to GitHub Pages.

### Setup
1. Enable GitHub Pages in repository settings
2. Configure build and deployment:
   - Source: GitHub Actions
   - Branch: gh-pages

### Documentation Updates
1. Update documentation in docs/
2. Commit and push changes
3. GitHub Actions will automatically build and deploy

## Monitoring

### Health Checks
- API endpoint: /health
- Metrics available at: /metrics

### Logging
- Production logs stored in /var/log/news-aggregator/
- Development logs in console

## Backup and Recovery

### Database Backups
- Automated daily backups
- 30-day retention
- Manual backup command:
  ```bash
  ./scripts/backup.sh
  ```

### Recovery Procedures
1. Stop services
2. Restore from backup
3. Verify data integrity
4. Restart services

## Security

### SSL Configuration
- Auto-renewed Let's Encrypt certificates
- HTTPS enforced in production

### API Security
- Rate limiting enabled
- CORS configured for production domains
- API keys secured via environment variables

## Scaling

### Horizontal Scaling
- Configure load balancer
- Add application instances
- Scale cache layer

### Performance Optimization
- Enable CDN
- Configure caching
- Optimize database queries

## Troubleshooting

### Common Issues
1. API Connection Errors
   - Check API keys
   - Verify network connectivity
   - Check rate limits

2. Build Failures
   - Clear node_modules/
   - Update dependencies
   - Check build logs

3. Performance Issues
   - Monitor resource usage
   - Check cache hit rates
   - Review database queries

### Support
For additional support:
1. Check issues on GitHub
2. Review documentation
3. Contact maintainers
