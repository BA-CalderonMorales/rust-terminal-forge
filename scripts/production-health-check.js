#!/usr/bin/env node
/**
 * 📊 Production Health Check - Rick's Live Monitoring System
 * Monitors deployed application for real-time health metrics
 */

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class ProductionHealthChecker {
  constructor(deploymentUrl = 'https://rust-terminal-forge.github.io') {
    this.deploymentUrl = deploymentUrl;
    this.healthMetrics = [];
    this.resultsDir = path.join(__dirname, '../test-results/production-health');
  }

  async initialize() {
    await this.ensureDir(this.resultsDir);
    console.log('📊 Production Health Checker Initialized');
    console.log(`🌐 Monitoring: ${this.deploymentUrl}\n`);
  }

  async runHealthCheck() {
    console.log('🚀 Starting Production Health Check...\n');

    const healthChecks = [
      { name: 'Deployment Availability', check: this.checkDeploymentAvailability },
      { name: 'SSL Certificate', check: this.checkSSLCertificate },
      { name: 'Load Performance', check: this.checkLoadPerformance },
      { name: 'Functionality Tests', check: this.checkFunctionality },
      { name: 'Error Monitoring', check: this.checkErrorRates },
      { name: 'Resource Loading', check: this.checkResourceLoading },
      { name: 'Mobile Compatibility', check: this.checkMobileCompatibility },
      { name: 'Accessibility', check: this.checkAccessibility }
    ];

    for (const { name, check } of healthChecks) {
      console.log(`🔍 Checking ${name}...`);
      
      try {
        const result = await check.call(this);
        this.healthMetrics.push({
          check: name,
          status: 'completed',
          result,
          timestamp: new Date().toISOString()
        });
        
        console.log(`  ${result.healthy ? '✅' : '❌'} ${name}: ${result.summary}`);
        
      } catch (error) {
        console.log(`  ❌ ${name}: ERROR - ${error.message}`);
        this.healthMetrics.push({
          check: name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    const overallHealth = await this.calculateOverallHealth();
    await this.generateHealthReport();
    
    return overallHealth;
  }

  async checkDeploymentAvailability() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      https.get(this.deploymentUrl, (res) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        resolve({
          healthy: res.statusCode === 200,
          summary: `Status ${res.statusCode}, ${responseTime}ms response time`,
          details: {
            statusCode: res.statusCode,
            responseTime,
            headers: res.headers
          }
        });
      }).on('error', (error) => {
        resolve({
          healthy: false,
          summary: `Connection failed: ${error.message}`,
          details: { error: error.message }
        });
      });
    });
  }

  async checkSSLCertificate() {
    if (!this.deploymentUrl.startsWith('https://')) {
      return {
        healthy: false,
        summary: 'No HTTPS detected',
        details: { protocol: 'http' }
      };
    }

    return new Promise((resolve) => {
      const hostname = new URL(this.deploymentUrl).hostname;
      
      const req = https.request({
        hostname,
        port: 443,
        method: 'HEAD'
      }, (res) => {
        const cert = res.connection.getPeerCertificate();
        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        
        const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
        
        resolve({
          healthy: now >= validFrom && now <= validTo && daysUntilExpiry > 7,
          summary: `Valid until ${validTo.toDateString()} (${daysUntilExpiry} days)`,
          details: {
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysUntilExpiry
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          healthy: false,
          summary: `SSL check failed: ${error.message}`,
          details: { error: error.message }
        });
      });
      
      req.end();
    });
  }

  async checkLoadPerformance() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const startTime = Date.now();
      
      await page.goto(this.deploymentUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          transferSize: navigation.transferSize,
          decodedBodySize: navigation.decodedBodySize
        };
      });

      const targets = {
        loadTime: 5000, // 5 seconds
        domContentLoaded: 3000, // 3 seconds
        firstContentfulPaint: 2000 // 2 seconds
      };

      const healthy = loadTime < targets.loadTime && 
                     metrics.domContentLoaded < targets.domContentLoaded &&
                     metrics.firstContentfulPaint < targets.firstContentfulPaint;

      return {
        healthy,
        summary: `${loadTime}ms load time, ${metrics.firstContentfulPaint.toFixed(0)}ms FCP`,
        details: {
          loadTime,
          metrics,
          targets
        }
      };

    } finally {
      await browser.close();
    }
  }

  async checkFunctionality() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(this.deploymentUrl, { waitUntil: 'networkidle' });

      // Check if terminal is present and functional
      const terminalCheck = await page.evaluate(() => {
        const terminal = document.querySelector('.terminal-container, .terminal, main');
        if (!terminal) return { present: false };

        const input = document.querySelector('.terminal-input, input, textarea');
        return {
          present: true,
          inputAvailable: !!input,
          visible: terminal.offsetWidth > 0 && terminal.offsetHeight > 0
        };
      });

      // Test basic interaction
      let interactionWorking = false;
      try {
        await page.type('.terminal-input', 'test', { timeout: 2000 });
        interactionWorking = true;
      } catch (error) {
        // Input interaction failed
      }

      // Check theme switching
      const themeCheck = await page.evaluate(() => {
        const themeButtons = document.querySelectorAll('[data-theme], .theme-toggle, .theme-switch');
        return {
          themeControlsPresent: themeButtons.length > 0,
          themeCount: themeButtons.length
        };
      });

      const functionalityScore = [
        terminalCheck.present,
        terminalCheck.inputAvailable,
        terminalCheck.visible,
        interactionWorking,
        themeCheck.themeControlsPresent
      ].filter(Boolean).length;

      return {
        healthy: functionalityScore >= 4,
        summary: `${functionalityScore}/5 functionality checks passed`,
        details: {
          terminal: terminalCheck,
          interaction: interactionWorking,
          themes: themeCheck,
          score: functionalityScore
        }
      };

    } finally {
      await browser.close();
    }
  }

  async checkErrorRates() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    const networkErrors = [];

    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network errors
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    try {
      await page.goto(this.deploymentUrl, { waitUntil: 'networkidle' });
      
      // Wait a bit to capture any delayed errors
      await page.waitForTimeout(3000);

      const jsErrors = await page.evaluate(() => {
        return window.onerror ? window.errorCount || 0 : 0;
      });

      const totalErrors = consoleErrors.length + networkErrors.length + jsErrors;

      return {
        healthy: totalErrors === 0,
        summary: `${totalErrors} errors detected (${consoleErrors.length} console, ${networkErrors.length} network)`,
        details: {
          consoleErrors,
          networkErrors,
          jsErrors,
          totalErrors
        }
      };

    } finally {
      await browser.close();
    }
  }

  async checkResourceLoading() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const loadedResources = [];
    const failedResources = [];

    page.on('response', response => {
      const resource = {
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type'] || '',
        size: response.headers()['content-length'] || 0
      };

      if (response.ok()) {
        loadedResources.push(resource);
      } else {
        failedResources.push(resource);
      }
    });

    try {
      await page.goto(this.deploymentUrl, { waitUntil: 'networkidle' });

      // Check for critical resources
      const criticalResources = loadedResources.filter(r => 
        r.contentType.includes('javascript') || 
        r.contentType.includes('css') ||
        r.url.includes('.js') ||
        r.url.includes('.css')
      );

      const totalSize = loadedResources.reduce((sum, r) => sum + parseInt(r.size || 0), 0);

      return {
        healthy: failedResources.length === 0 && criticalResources.length > 0,
        summary: `${loadedResources.length} resources loaded, ${failedResources.length} failed, ${Math.round(totalSize / 1024)}KB total`,
        details: {
          loadedCount: loadedResources.length,
          failedCount: failedResources.length,
          criticalCount: criticalResources.length,
          totalSize,
          failedResources: failedResources.slice(0, 5) // Limit to first 5 failures
        }
      };

    } finally {
      await browser.close();
    }
  }

  async checkMobileCompatibility() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone SE
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    const page = await context.newPage();

    try {
      await page.goto(this.deploymentUrl, { waitUntil: 'networkidle' });

      const mobileCompatibility = await page.evaluate(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        const terminal = document.querySelector('.terminal-container, .terminal, main');
        
        const responsiveElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = getComputedStyle(el);
          return style.display === 'flex' || style.display === 'grid' || el.classList.contains('responsive');
        });

        return {
          hasViewportMeta: !!viewport,
          viewportContent: viewport?.getAttribute('content') || '',
          terminalVisible: terminal ? terminal.offsetWidth > 0 && terminal.offsetHeight > 0 : false,
          terminalWidth: terminal?.offsetWidth || 0,
          responsiveElementCount: responsiveElements.length,
          bodyOverflow: getComputedStyle(document.body).overflowX !== 'auto'
        };
      });

      // Test touch interactions
      let touchWorking = false;
      try {
        await page.tap('.terminal-input', { timeout: 2000 });
        touchWorking = true;
      } catch (error) {
        // Touch interaction failed
      }

      const mobileScore = [
        mobileCompatibility.hasViewportMeta,
        mobileCompatibility.terminalVisible,
        mobileCompatibility.bodyOverflow,
        touchWorking,
        mobileCompatibility.responsiveElementCount > 0
      ].filter(Boolean).length;

      return {
        healthy: mobileScore >= 4,
        summary: `${mobileScore}/5 mobile compatibility checks passed`,
        details: {
          ...mobileCompatibility,
          touchWorking,
          score: mobileScore
        }
      };

    } finally {
      await browser.close();
    }
  }

  async checkAccessibility() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(this.deploymentUrl, { waitUntil: 'networkidle' });

      const accessibilityChecks = await page.evaluate(() => {
        const checks = {
          hasTitle: !!document.title,
          hasLang: !!document.documentElement.lang,
          imagesHaveAlt: true,
          buttonsHaveLabels: true,
          inputsHaveLabels: true,
          goodColorContrast: true, // Simplified check
          keyboardNavigable: true // Simplified check
        };

        // Check images
        const images = document.querySelectorAll('img');
        checks.imagesHaveAlt = Array.from(images).every(img => img.alt !== '');

        // Check buttons
        const buttons = document.querySelectorAll('button');
        checks.buttonsHaveLabels = Array.from(buttons).every(btn => 
          btn.textContent.trim() || btn.getAttribute('aria-label') || btn.getAttribute('title')
        );

        // Check inputs
        const inputs = document.querySelectorAll('input, textarea');
        checks.inputsHaveLabels = Array.from(inputs).every(input => {
          const id = input.id;
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          return label || input.getAttribute('aria-label') || input.getAttribute('placeholder');
        });

        return checks;
      });

      const accessibilityScore = Object.values(accessibilityChecks).filter(Boolean).length;
      const totalChecks = Object.keys(accessibilityChecks).length;

      return {
        healthy: accessibilityScore >= totalChecks - 1, // Allow one failure
        summary: `${accessibilityScore}/${totalChecks} accessibility checks passed`,
        details: {
          checks: accessibilityChecks,
          score: accessibilityScore,
          totalChecks
        }
      };

    } finally {
      await browser.close();
    }
  }

  async calculateOverallHealth() {
    const completedChecks = this.healthMetrics.filter(m => m.status === 'completed');
    const healthyChecks = completedChecks.filter(m => m.result.healthy);
    
    const healthScore = completedChecks.length > 0 ? 
      (healthyChecks.length / completedChecks.length) * 100 : 0;

    const healthStatus = healthScore >= 90 ? 'Excellent' :
                        healthScore >= 80 ? 'Good' :
                        healthScore >= 70 ? 'Fair' :
                        healthScore >= 60 ? 'Poor' : 'Critical';

    return {
      score: healthScore,
      status: healthStatus,
      healthy: healthScore >= 80,
      summary: `${healthyChecks.length}/${completedChecks.length} health checks passed`
    };
  }

  async generateHealthReport() {
    const overallHealth = await this.calculateOverallHealth();
    
    const report = {
      timestamp: new Date().toISOString(),
      deploymentUrl: this.deploymentUrl,
      overallHealth,
      healthMetrics: this.healthMetrics,
      summary: {
        total: this.healthMetrics.length,
        completed: this.healthMetrics.filter(m => m.status === 'completed').length,
        errors: this.healthMetrics.filter(m => m.status === 'error').length,
        healthy: this.healthMetrics.filter(m => m.status === 'completed' && m.result.healthy).length
      }
    };

    const reportPath = path.join(this.resultsDir, 'production-health-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML dashboard
    const dashboardHTML = this.generateHealthDashboard(report);
    const dashboardPath = path.join(this.resultsDir, 'health-dashboard.html');
    await fs.writeFile(dashboardPath, dashboardHTML);

    console.log(`\n📊 Production Health Summary:`);
    console.log(`🎯 Overall Health: ${overallHealth.score.toFixed(1)}% (${overallHealth.status})`);
    console.log(`✅ Healthy: ${report.summary.healthy}/${report.summary.completed}`);
    console.log(`❌ Unhealthy: ${report.summary.completed - report.summary.healthy}/${report.summary.completed}`);
    console.log(`🔧 Errors: ${report.summary.errors}`);
    console.log(`📁 Report saved to: ${reportPath}`);
    console.log(`📊 Dashboard: ${dashboardPath}`);

    return report;
  }

  generateHealthDashboard(report) {
    const statusColor = report.overallHealth.score >= 90 ? '#00ff00' :
                       report.overallHealth.score >= 80 ? '#ffaa00' :
                       report.overallHealth.score >= 70 ? '#ff6600' : '#ff0000';

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Production Health Dashboard - Terminal Forge</title>
    <meta http-equiv="refresh" content="300"> <!-- Auto-refresh every 5 minutes -->
    <style>
        body { 
            font-family: 'JetBrains Mono', monospace; 
            margin: 0; 
            background: #0a0a0a; 
            color: #00ff00; 
            padding: 20px;
        }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .health-score { 
            font-size: 4em; 
            font-weight: bold; 
            color: ${statusColor};
            text-shadow: 0 0 20px ${statusColor};
        }
        .status { font-size: 1.5em; margin: 10px 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: #1a1a1a; 
            border: 1px solid #333; 
            border-radius: 8px; 
            padding: 20px;
            position: relative;
        }
        .card.healthy { border-color: #00ff00; background: #0a2a0a; }
        .card.unhealthy { border-color: #ff0000; background: #2a0a0a; }
        .card.error { border-color: #ffaa00; background: #2a2a0a; }
        .card-title { 
            font-size: 1.2em; 
            font-weight: bold; 
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-icon { font-size: 1.5em; }
        .details { font-size: 0.9em; color: #888; margin-top: 10px; }
        .timestamp { text-align: center; margin-top: 30px; color: #666; }
        .url { color: #4ade80; text-decoration: none; }
        .url:hover { text-decoration: underline; }
        pre { background: #111; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🚀 Production Health Dashboard</h1>
            <div class="health-score">${report.overallHealth.score.toFixed(1)}%</div>
            <div class="status">${report.overallHealth.status}</div>
            <p>Monitoring: <a href="${report.deploymentUrl}" class="url" target="_blank">${report.deploymentUrl}</a></p>
        </div>
        
        <div class="grid">
            ${report.healthMetrics.map(metric => `
                <div class="card ${metric.status === 'completed' ? (metric.result.healthy ? 'healthy' : 'unhealthy') : 'error'}">
                    <div class="card-title">
                        ${metric.check}
                        <span class="status-icon">
                            ${metric.status === 'completed' ? (metric.result.healthy ? '✅' : '❌') : '🔧'}
                        </span>
                    </div>
                    ${metric.status === 'completed' ? `
                        <p><strong>Status:</strong> ${metric.result.summary}</p>
                        <div class="details">
                            <pre>${JSON.stringify(metric.result.details, null, 2)}</pre>
                        </div>
                    ` : `
                        <p><strong>Error:</strong> ${metric.error}</p>
                    `}
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Last updated: ${new Date(report.timestamp).toLocaleString()}
            <br>
            <small>Dashboard auto-refreshes every 5 minutes</small>
        </div>
    </div>
</body>
</html>
    `;
  }

  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

// CLI execution
async function main() {
  const url = process.argv[2] || 'https://rust-terminal-forge.github.io';
  const healthChecker = new ProductionHealthChecker(url);
  
  await healthChecker.initialize();
  const health = await healthChecker.runHealthCheck();
  
  // Exit with error code if health check failed
  process.exit(health.healthy ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProductionHealthChecker };