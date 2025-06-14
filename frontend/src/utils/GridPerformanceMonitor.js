// Performance monitoring utility for grid operations
const PERFORMANCE_MARKS = {
  LAYOUT_CHANGE: 'layout-change',
  CARD_MOVE: 'card-move',
  COMMAND_PROCESS: 'command-process',
  VIEWPORT_ADAPT: 'viewport-adapt'
};

class GridPerformanceMonitor {
  constructor() {
    this.measurements = new Map();
  }

  startMeasurement(operation) {
    const markName = `${operation}-start`;
    performance.mark(markName);
  }

  endMeasurement(operation) {
    const startMark = `${operation}-start`;
    const endMark = `${operation}-end`;
    
    performance.mark(endMark);
    performance.measure(operation, startMark, endMark);
    
    const measurements = performance.getEntriesByName(operation);
    const latestMeasurement = measurements[measurements.length - 1];
    
    this.measurements.set(operation, latestMeasurement.duration);
    
    // Log performance data
    console.debug(`${operation} completed`, {
      duration: latestMeasurement.duration,
      timestamp: new Date().toISOString()
    });

    // Monitor for potential performance issues
    if (latestMeasurement.duration > 100) {
      console.warn(`Performance warning: ${operation} took longer than 100ms`, {
        duration: latestMeasurement.duration,
        operation
      });
    }

    return latestMeasurement.duration;
  }

  getAverageMetrics(operation) {
    const measurements = performance.getEntriesByName(operation);
    if (measurements.length === 0) return null;
    
    const total = measurements.reduce((sum, measure) => sum + measure.duration, 0);
    return total / measurements.length;
  }

  clearMeasurements() {
    performance.clearMarks();
    performance.clearMeasures();
    this.measurements.clear();
  }

  // Get performance report
  generateReport() {
    const report = {
      metrics: {},
      warnings: [],
      timestamp: new Date().toISOString()
    };

    for (const [operation, duration] of this.measurements.entries()) {
      report.metrics[operation] = {
        lastDuration: duration,
        average: this.getAverageMetrics(operation)
      };

      if (duration > 100) {
        report.warnings.push({
          operation,
          duration,
          message: `${operation} exceeded 100ms threshold`
        });
      }
    }

    return report;
  }
}

export const performanceMonitor = new GridPerformanceMonitor();
export { PERFORMANCE_MARKS };
