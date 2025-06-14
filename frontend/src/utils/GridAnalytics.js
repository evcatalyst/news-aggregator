// Analytics utility for grid system
class GridAnalyticsManager {
  constructor() {
    this.events = [];
    this.performanceMetrics = new Map();
  }

  trackEvent(eventName, metadata = {}) {
    const event = {
      eventName,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    this.events.push(event);
    
    // In production, you would send this to your analytics service
    console.debug('Grid Analytics Event:', event);
  }

  trackCommand(command, success, duration) {
    this.trackEvent('command_executed', {
      command,
      success,
      duration,
      activeLayout: document.documentElement.dataset.gridLayout
    });
  }

  trackLayoutChange(fromLayout, toLayout, transitionDuration) {
    this.trackEvent('layout_changed', {
      fromLayout,
      toLayout,
      transitionDuration
    });
  }

  trackPerformanceMetric(metricName, value) {
    if (!this.performanceMetrics.has(metricName)) {
      this.performanceMetrics.set(metricName, []);
    }
    this.performanceMetrics.get(metricName).push(value);

    // Report if performance degrades
    const recentMetrics = this.performanceMetrics.get(metricName).slice(-5);
    const average = recentMetrics.reduce((a, b) => a + b, 0) / recentMetrics.length;
    
    if (value > average * 1.5) {
      console.warn(`Performance degradation detected for ${metricName}`, {
        current: value,
        average,
        threshold: average * 1.5
      });
    }
  }

  generateReport() {
    const now = new Date();
    const lastHourEvents = this.events.filter(event => 
      new Date(event.timestamp) > new Date(now - 60 * 60 * 1000)
    );

    return {
      totalEvents: this.events.length,
      lastHourEvents: lastHourEvents.length,
      commandUsage: this.getCommandUsageStats(),
      layoutPreferences: this.getLayoutPreferenceStats(),
      performance: this.getPerformanceStats()
    };
  }

  getCommandUsageStats() {
    return this.events
      .filter(e => e.eventName === 'command_executed')
      .reduce((acc, event) => {
        const command = event.metadata.command;
        acc[command] = (acc[command] || 0) + 1;
        return acc;
      }, {});
  }

  getLayoutPreferenceStats() {
    return this.events
      .filter(e => e.eventName === 'layout_changed')
      .reduce((acc, event) => {
        const layout = event.metadata.toLayout;
        acc[layout] = (acc[layout] || 0) + 1;
        return acc;
      }, {});
  }

  getPerformanceStats() {
    const stats = {};
    for (const [metric, values] of this.performanceMetrics.entries()) {
      stats[metric] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        lastValue: values[values.length - 1]
      };
    }
    return stats;
  }
}

// Export a singleton instance
export const gridAnalytics = new GridAnalyticsManager();

// Allow resetting in test environments
export const resetGridAnalytics = () => {
  gridAnalytics.events = [];
  gridAnalytics.performanceMetrics.clear();
};
