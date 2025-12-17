export function getSystemInfo() {
  const nav = window.navigator;
  const screen = window.screen;
  
  function getBrowser() {
    const userAgent = nav.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Edg') > -1) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
    }

    return { name: browserName, version: browserVersion };
  }

  const browser = getBrowser();

  return {
    userAgent: nav.userAgent,
    browser: browser.name,
    browserVersion: browser.version,
    platform: nav.platform,
    language: nav.language,
    screenResolution: {
      width: screen.width,
      height: screen.height
    },
    viewportSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    timestamp: new Date().toISOString(),
    pageUrl: window.location.href,
    referrer: document.referrer || 'Direct'
  };
}
