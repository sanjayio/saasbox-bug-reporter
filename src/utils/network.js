class NetworkMonitor {
  constructor(maxRequests = 20) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.isMonitoring = false;
    this.originalFetch = window.fetch;
    this.originalXHR = {
      open: XMLHttpRequest.prototype.open,
      send: XMLHttpRequest.prototype.send
    };
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    this.interceptFetch();
    this.interceptXHR();
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;

    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHR.open;
    XMLHttpRequest.prototype.send = this.originalXHR.send;
  }

  interceptFetch() {
    const self = this;
    
    window.fetch = function(...args) {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      const method = args[1]?.method || 'GET';

      return self.originalFetch.apply(this, args)
        .then(response => {
          const duration = Date.now() - startTime;
          self.addRequest({
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            duration,
            type: 'fetch',
            timestamp: new Date().toISOString()
          });
          return response;
        })
        .catch(error => {
          const duration = Date.now() - startTime;
          self.addRequest({
            url,
            method,
            status: 0,
            statusText: 'Failed',
            error: error.message,
            duration,
            type: 'fetch',
            timestamp: new Date().toISOString()
          });
          throw error;
        });
    };
  }

  interceptXHR() {
    const self = this;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._bugReporterData = {
        method,
        url,
        startTime: Date.now()
      };
      return self.originalXHR.open.apply(this, [method, url, ...rest]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      
      const onLoad = function() {
        if (xhr._bugReporterData) {
          const duration = Date.now() - xhr._bugReporterData.startTime;
          self.addRequest({
            url: xhr._bugReporterData.url,
            method: xhr._bugReporterData.method,
            status: xhr.status,
            statusText: xhr.statusText,
            duration,
            type: 'xhr',
            timestamp: new Date().toISOString()
          });
        }
      };

      const onError = function() {
        if (xhr._bugReporterData) {
          const duration = Date.now() - xhr._bugReporterData.startTime;
          self.addRequest({
            url: xhr._bugReporterData.url,
            method: xhr._bugReporterData.method,
            status: 0,
            statusText: 'Failed',
            duration,
            type: 'xhr',
            timestamp: new Date().toISOString()
          });
        }
      };

      xhr.addEventListener('load', onLoad);
      xhr.addEventListener('error', onError);

      return self.originalXHR.send.apply(this, args);
    };
  }

  addRequest(request) {
    this.requests.push(request);

    if (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }
  }

  getRequests() {
    return [...this.requests];
  }

  clear() {
    this.requests = [];
  }
}

export default NetworkMonitor;
