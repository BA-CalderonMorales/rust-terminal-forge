#!/usr/bin/env node
/**
 * Production Readiness Validation Script
 * Comprehensive checks for build system, performance, and compliance
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionReadinessValidator {
  constructor() {
    this.checks = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m', // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'
    };
    
    const prefix = {
      info: '🔍',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  async check(name, fn) {
    try {
      this.log(`Checking: ${name}`);
      await fn();
      this.log(`${name}: PASSED`, 'success');
      this.passed++;
    } catch (error) {
      this.log(`${name}: FAILED - ${error.message}`, 'error');
      this.failed++;
    }
  }

  warn(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  // Build System Validation
  async validateBuildSystem() {
    await this.check('TypeScript compilation', () => {
      try {
        execSync('npm run typecheck', { stdio: 'pipe' });
      } catch (error) {
        throw new Error('TypeScript compilation failed');
      }
    });

    await this.check('Production build', () => {
      if (!fs.existsSync('dist/index.html')) {
        throw new Error('Production build missing');
      }
      
      const distSize = this.getDirSize('dist');
      if (distSize > 2 * 1024 * 1024) { // 2MB limit
        this.warn(`Bundle size ${(distSize / 1024 / 1024).toFixed(2)}MB exceeds 2MB`);
      }
    });

    await this.check('Essential build artifacts', () => {
      const required = ['dist/index.html', 'dist/assets'];
      for (const file of required) {
        if (!fs.existsSync(file)) {
          throw new Error(`Missing required file: ${file}`);
        }
      }
    });

    await this.check('Build performance under 5 seconds', () => {
      const start = Date.now();
      try {
        execSync('npm run build', { stdio: 'pipe' });
        const buildTime = Date.now() - start;
        if (buildTime > 5000) {
          throw new Error(`Build time ${buildTime}ms exceeds 5000ms target`);
        }
        this.log(`Build completed in ${buildTime}ms`, 'success');
      } catch (error) {
        throw new Error('Build failed or too slow');
      }
    });
  }

  // Performance Validation
  async validatePerformance() {
    await this.check('CSS bundle under 50KB', () => {
      const cssFiles = this.findFiles('dist', '.css');
      let totalSize = 0;
      
      for (const file of cssFiles) {
        totalSize += fs.statSync(file).size;
      }
      
      if (totalSize > 50 * 1024) {
        throw new Error(`CSS bundle ${(totalSize / 1024).toFixed(1)}KB exceeds 50KB limit`);
      }
      
      this.log(`CSS bundle size: ${(totalSize / 1024).toFixed(1)}KB`, 'success');
    });

    await this.check('JavaScript bundle optimization', () => {
      const jsFiles = this.findFiles('dist', '.js');
      let totalSize = 0;
      
      for (const file of jsFiles) {
        totalSize += fs.statSync(file).size;
        
        // Check for unminified code
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('console.log') && process.env.NODE_ENV === 'production') {
          this.warn(`Console.log found in production bundle: ${file}`);
        }
      }
      
      this.log(`JavaScript bundle size: ${(totalSize / 1024).toFixed(1)}KB`, 'info');
      
      if (totalSize > 500 * 1024) {
        this.warn(`JavaScript bundle ${(totalSize / 1024).toFixed(1)}KB is quite large`);
      }
    });

    await this.check('Bundle size within reasonable limits', () => {
      const totalSize = this.getDirSize('dist');
      this.log(`Total bundle size: ${(totalSize / 1024).toFixed(1)}KB`, 'info');
      
      if (totalSize > 1024 * 1024) { // 1MB
        this.warn(`Total bundle size ${(totalSize / 1024 / 1024).toFixed(2)}MB is large`);
      }
    });
  }

  // Component Validation
  async validateComponents() {
    await this.check('New mockup components exist', () => {
      const mockupComponents = [
        'src/components/CleanTerminalView.tsx',
        'src/components/ProfessionalTerminalLayout.tsx',
        'src/components/ProfessionalTerminalWindow.tsx',
        'src/components/ProfessionalThemeProvider.tsx'
      ];
      
      for (const component of mockupComponents) {
        if (!fs.existsSync(component)) {
          throw new Error(`Missing mockup component: ${component}`);
        }
      }
    });

    await this.check('CSS optimization files exist', () => {
      const cssFiles = [
        'src/styles/clean-terminal.css',
        'src/styles/performance-optimizations.css'
      ];
      
      for (const cssFile of cssFiles) {
        if (!fs.existsSync(cssFile)) {
          throw new Error(`Missing CSS file: ${cssFile}`);
        }
      }
    });

    await this.check('Component TypeScript compliance', () => {
      const components = this.findFiles('src/components', '.tsx');
      let compliantComponents = 0;
      
      for (const component of components) {
        const content = fs.readFileSync(component, 'utf8');
        
        // Check for TypeScript patterns
        if (content.includes('interface') || content.includes('type') || 
            content.includes('Props') || content.includes(': React.FC')) {
          compliantComponents++;
        }
      }
      
      const complianceRate = (compliantComponents / components.length) * 100;
      if (complianceRate < 80) {
        this.warn(`Only ${complianceRate.toFixed(1)}% of components use TypeScript interfaces`);
      }
    });
  }

  // Accessibility Validation
  async validateAccessibility() {
    await this.check('Semantic HTML structure', () => {
      if (!fs.existsSync('dist/index.html')) {
        throw new Error('HTML file not found');
      }
      
      const html = fs.readFileSync('dist/index.html', 'utf8');
      
      // Check for basic structure
      if (!html.includes('<!DOCTYPE html>')) {
        throw new Error('Missing DOCTYPE declaration');
      }
      
      if (!html.includes('lang=')) {
        this.warn('Missing language declaration');
      }
    });

    await this.check('Focus management styles', () => {
      const cssContent = this.getAllCSSContent();
      if (!cssContent.includes('focus') && !cssContent.includes(':focus')) {
        this.warn('No focus styles detected in CSS');
      }
      
      if (cssContent.includes('outline: none') && !cssContent.includes('outline:')) {
        this.warn('Focus outlines may be removed without alternatives');
      }
    });

    await this.check('Responsive design support', () => {
      const cssContent = this.getAllCSSContent();
      if (!cssContent.includes('@media')) {
        throw new Error('No responsive breakpoints found in CSS');
      }
      
      // Check for mobile-first approach
      if (!cssContent.includes('max-width') && !cssContent.includes('min-width')) {
        this.warn('Limited responsive design patterns detected');
      }
    });
  }

  // Security and Compliance
  async validateSecurity() {
    await this.check('No sensitive data in bundle', () => {
      const distFiles = this.findFiles('dist', '.js');
      const patterns = [/api_key/i, /secret/i, /password/i, /token.*[a-zA-Z0-9]{20}/];
      
      for (const file of distFiles) {
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of patterns) {
          if (pattern.test(content)) {
            throw new Error(`Potential sensitive data found in ${file}`);
          }
        }
      }
    });

    await this.check('Production configuration', () => {
      const viteConfig = fs.readFileSync('vite.config.production.ts', 'utf8');
      
      if (!viteConfig.includes('minify')) {
        this.warn('Minification may not be enabled');
      }
      
      if (!viteConfig.includes('terser')) {
        this.warn('Terser optimization may not be configured');
      }
    });

    await this.check('Environment safety', () => {
      const distFiles = this.findFiles('dist', '.js');
      for (const file of distFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('eval(') || content.includes('Function(')) {
          this.warn(`Potentially unsafe code patterns in ${file}`);
        }
      }
    });
  }

  // Utility methods
  getDirSize(dir) {
    let size = 0;
    const files = this.findFiles(dir);
    for (const file of files) {
      size += fs.statSync(file).size;
    }
    return size;
  }

  findFiles(dir, ext = '') {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...this.findFiles(fullPath, ext));
      } else if (!ext || item.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  getAllCSSContent() {
    const cssFiles = this.findFiles('src/styles', '.css');
    let content = '';
    for (const file of cssFiles) {
      content += fs.readFileSync(file, 'utf8');
    }
    
    // Also check dist CSS
    const distCssFiles = this.findFiles('dist', '.css');
    for (const file of distCssFiles) {
      content += fs.readFileSync(file, 'utf8');
    }
    
    return content;
  }

  // Generate detailed report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.passed,
        failed: this.failed,
        warnings: this.warnings.length,
        totalChecks: this.passed + this.failed
      },
      performance: {
        bundleSize: this.getDirSize('dist'),
        cssSize: this.findFiles('dist', '.css').reduce((sum, file) => 
          sum + fs.statSync(file).size, 0),
        jsSize: this.findFiles('dist', '.js').reduce((sum, file) => 
          sum + fs.statSync(file).size, 0)
      },
      warnings: this.warnings
    };

    fs.writeFileSync('production-readiness-report.json', JSON.stringify(report, null, 2));
    this.log('Report saved to production-readiness-report.json', 'info');
    
    return report;
  }

  // Run all validations
  async runAll() {
    this.log('🚀 Starting Production Readiness Validation', 'info');
    console.log('=' .repeat(60));
    
    await this.validateBuildSystem();
    await this.validatePerformance();
    await this.validateComponents();
    await this.validateAccessibility();
    await this.validateSecurity();
    
    console.log('=' .repeat(60));
    
    const report = this.generateReport();
    
    this.log(`Validation Complete: ${this.passed} passed, ${this.failed} failed`, 
             this.failed === 0 ? 'success' : 'error');
    
    if (this.warnings.length > 0) {
      this.log(`${this.warnings.length} warnings need attention`, 'warning');
      this.warnings.forEach(warning => this.log(`  - ${warning}`, 'warning'));
    }
    
    // Performance summary
    console.log('\n📊 Performance Summary:');
    console.log(`  Bundle Size: ${(report.performance.bundleSize / 1024).toFixed(1)}KB`);
    console.log(`  CSS Size: ${(report.performance.cssSize / 1024).toFixed(1)}KB`);
    console.log(`  JS Size: ${(report.performance.jsSize / 1024).toFixed(1)}KB`);
    
    if (this.failed === 0) {
      this.log('🎉 Production Ready!', 'success');
    } else {
      this.log('🔧 Fixes needed before production deployment', 'error');
      process.exit(1);
    }
    
    return report;
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ProductionReadinessValidator();
  validator.runAll().catch(console.error);
}

export default ProductionReadinessValidator;