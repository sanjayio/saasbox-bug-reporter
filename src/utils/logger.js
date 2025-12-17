class ConsoleLogger {
  constructor(maxLogs = 50) {
    this.logs = [];
    this.maxLogs = maxLogs;
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    this.isIntercepting = false;
  }

  startIntercepting() {
    if (this.isIntercepting) return;
    this.isIntercepting = true;

    const self = this;

    ['log', 'warn', 'error', 'info'].forEach(method => {
      console[method] = function(...args) {
        self.addLog(method, args);
        self.originalConsole[method].apply(console, args);
      };
    });
  }

  stopIntercepting() {
    if (!this.isIntercepting) return;
    this.isIntercepting = false;

    ['log', 'warn', 'error', 'info'].forEach(method => {
      console[method] = this.originalConsole[method];
    });
  }

  addLog(level, args) {
    const logEntry = {
      level: level,
      message: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '),
      timestamp: new Date().toISOString()
    };

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export default ConsoleLogger;
