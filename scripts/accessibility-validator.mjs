#!/usr/bin/env node
/**
 * Accessibility Validation Script
 * Validates WCAG compliance and accessibility best practices
 */

import { chromium } from 'playwright';
import fs from 'fs';

class AccessibilityValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: [],
      violations: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    
    const prefix = {
      info: '♿',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  async validateHTML() {
    this.log('Validating HTML semantic structure...', 'info');
    
    if (!fs.existsSync('dist/index.html')) {
      throw new Error('HTML build file not found');
    }
    
    const html = fs.readFileSync('dist/index.html', 'utf8');
    
    // DOCTYPE check
    if (!html.includes('<!DOCTYPE html>')) {
      this.results.violations.push('Missing HTML5 DOCTYPE declaration');
    } else {
      this.results.passed++;
    }
    
    // Language declaration
    if (!html.includes('lang=')) {
      this.results.warnings.push('Missing language declaration on html element');
    } else {
      this.results.passed++;
    }
    
    // Meta viewport
    if (!html.includes('viewport')) {
      this.results.violations.push('Missing viewport meta tag for responsive design');
    } else {
      this.results.passed++;
    }
    
    // Title tag
    if (!html.includes('<title>') && !html.includes('"title"')) {
      this.results.violations.push('Missing page title');
    } else {
      this.results.passed++;
    }
  }

  async validateCSS() {
    this.log('Validating CSS accessibility features...', 'info');
    
    const cssFiles = fs.readdirSync('src/styles').filter(f => f.endsWith('.css'));
    let allCSS = '';
    
    for (const file of cssFiles) {
      allCSS += fs.readFileSync(`src/styles/${file}`, 'utf8');
    }
    
    // Focus styles
    if (allCSS.includes(':focus') || allCSS.includes('focus-visible')) {
      this.results.passed++;
    } else {
      this.results.violations.push('No focus styles found in CSS');
    }
    
    // Reduced motion support
    if (allCSS.includes('prefers-reduced-motion')) {
      this.results.passed++;
    } else {
      this.results.warnings.push('No reduced motion preferences support');
    }
    
    // High contrast support
    if (allCSS.includes('prefers-contrast')) {
      this.results.passed++;
    } else {
      this.results.warnings.push('No high contrast preferences support');
    }
    
    // Color-only information
    if (allCSS.includes('outline') && !allCSS.includes('outline: none')) {
      this.results.passed++;
    } else {
      this.results.warnings.push('Potential issues with focus outlines');
    }
    
    // Font size accessibility
    if (allCSS.includes('rem') || allCSS.includes('em')) {
      this.results.passed++;
    } else {
      this.results.warnings.push('No relative font units found - may impact text scaling');
    }
  }

  async validateWithBrowser() {
    this.log('Running browser-based accessibility tests...', 'info');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
      
      // Color contrast check
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll('*');
        
        for (const el of elements) {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const textColor = styles.color;
          
          // Simple contrast check (would need full implementation for real testing)
          if (textColor === 'rgb(255, 255, 255)' && bgColor === 'rgb(255, 255, 255)') {
            issues.push('Potential contrast issue: white text on white background');
          }
        }
        
        return issues;
      });
      
      if (contrastIssues.length === 0) {
        this.results.passed++;
      } else {
        this.results.violations.push(...contrastIssues);
      }
      
      // Keyboard navigation test
      const keyboardAccessible = await page.evaluate(async () => {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        return focusableElements.length > 0;
      });
      
      if (keyboardAccessible) {
        this.results.passed++;
      } else {
        this.results.violations.push('No focusable elements found for keyboard navigation');
      }
      
      // ARIA labels check
      const ariaSupport = await page.evaluate(() => {
        const elementsNeedingLabels = document.querySelectorAll('button, input, select, textarea');
        let properlyLabeled = 0;
        
        for (const el of elementsNeedingLabels) {
          if (el.getAttribute('aria-label') || 
              el.getAttribute('aria-labelledby') ||
              el.querySelector('label') ||
              el.textContent.trim()) {
            properlyLabeled++;
          }
        }
        
        return {
          total: elementsNeedingLabels.length,
          labeled: properlyLabeled
        };
      });
      
      if (ariaSupport.total === 0 || ariaSupport.labeled === ariaSupport.total) {
        this.results.passed++;
      } else {
        this.results.violations.push(
          `${ariaSupport.total - ariaSupport.labeled} interactive elements lack proper labels`
        );
      }
      
      // Semantic structure test
      const semanticStructure = await page.evaluate(() => {
        const hasMain = document.querySelector('main') !== null;
        const hasHeadings = document.querySelector('h1, h2, h3, h4, h5, h6') !== null;
        const hasNav = document.querySelector('nav') !== null || 
                      document.querySelector('[role="navigation"]') !== null;
        
        return { hasMain, hasHeadings, hasNav };
      });
      
      if (semanticStructure.hasMain && semanticStructure.hasHeadings) {
        this.results.passed++;
      } else {
        const missing = [];
        if (!semanticStructure.hasMain) missing.push('main element');
        if (!semanticStructure.hasHeadings) missing.push('heading structure');
        
        this.results.violations.push(`Missing semantic elements: ${missing.join(', ')}`);
      }
      
      // Mobile accessibility test
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      const mobileAccessible = await page.evaluate(() => {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
        let adequateSize = 0;
        
        for (const el of interactiveElements) {
          const rect = el.getBoundingClientRect();
          if (rect.width >= 44 && rect.height >= 44) {
            adequateSize++;
          }
        }
        
        return {
          total: interactiveElements.length,
          adequateSize
        };
      });
      
      if (mobileAccessible.total === 0 || 
          mobileAccessible.adequateSize / mobileAccessible.total >= 0.8) {
        this.results.passed++;
      } else {
        this.results.warnings.push(
          `${mobileAccessible.total - mobileAccessible.adequateSize} interactive elements may be too small for touch (< 44px)`
        );
      }
      
    } catch (error) {
      this.results.violations.push(`Browser test failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }

  async validateComponents() {
    this.log('Validating component accessibility patterns...', 'info');
    
    const componentFiles = fs.readdirSync('src/components')
      .filter(f => f.endsWith('.tsx'))
      .map(f => `src/components/${f}`);
    
    let totalComponents = 0;
    let accessibleComponents = 0;
    
    for (const file of componentFiles) {
      const content = fs.readFileSync(file, 'utf8');
      totalComponents++;
      
      // Check for accessibility patterns
      const hasAriaAttributes = /aria-\w+/.test(content);
      const hasRoleAttribute = /role=/.test(content);
      const hasKeyboardHandlers = /onKeyDown|onKeyUp|onKeyPress/.test(content);
      const hasFocusManagement = /focus|tabIndex/.test(content);
      const hasSemanticElements = /<(main|nav|header|footer|section|article|aside|h[1-6])/.test(content);
      
      const accessibilityScore = [
        hasAriaAttributes,
        hasRoleAttribute,
        hasKeyboardHandlers,
        hasFocusManagement,
        hasSemanticElements
      ].filter(Boolean).length;
      
      if (accessibilityScore >= 2) {
        accessibleComponents++;
      }
    }
    
    const accessibilityRate = (accessibleComponents / totalComponents) * 100;
    
    if (accessibilityRate >= 80) {
      this.results.passed++;
      this.log(`Component accessibility: ${accessibilityRate.toFixed(1)}% compliant`, 'success');
    } else {
      this.results.violations.push(
        `Only ${accessibilityRate.toFixed(1)}% of components follow accessibility patterns`
      );
    }
  }

  generateReport() {
    const totalTests = this.results.passed + this.results.violations.length;
    const score = Math.round((this.results.passed / totalTests) * 100);
    
    const report = {
      timestamp: new Date().toISOString(),
      score,
      summary: {
        passed: this.results.passed,
        violations: this.results.violations.length,
        warnings: this.results.warnings.length,
        totalTests
      },
      violations: this.results.violations,
      warnings: this.results.warnings,
      recommendations: []
    };
    
    // Generate recommendations
    if (this.results.violations.length > 0) {
      report.recommendations.push('Address accessibility violations before production');
    }
    
    if (this.results.warnings.length > 0) {
      report.recommendations.push('Consider addressing accessibility warnings for better UX');
    }
    
    if (score < 100) {
      report.recommendations.push('Implement automated accessibility testing in CI/CD');
      report.recommendations.push('Conduct user testing with assistive technologies');
    }
    
    return report;
  }

  async run() {
    this.log('🚀 Starting Accessibility Validation', 'info');
    
    try {
      await this.validateHTML();
      await this.validateCSS();
      await this.validateComponents();
      
      // Only run browser tests if we can connect
      try {
        await this.validateWithBrowser();
      } catch (error) {
        this.log(`Browser tests skipped: ${error.message}`, 'warning');
        this.results.warnings.push('Browser-based tests could not run - ensure app is running on localhost:4173');
      }
      
      const report = this.generateReport();
      
      // Display results
      console.log('\n♿ Accessibility Results:');
      console.log(`  Score: ${report.score}%`);
      console.log(`  Passed: ${report.summary.passed}`);
      console.log(`  Violations: ${report.summary.violations}`);
      console.log(`  Warnings: ${report.summary.warnings}`);
      
      if (report.violations.length > 0) {
        console.log('\n❌ Violations:');
        report.violations.forEach(v => console.log(`  • ${v}`));
      }
      
      if (report.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        report.warnings.forEach(w => console.log(`  • ${w}`));
      }
      
      if (report.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach(r => console.log(`  • ${r}`));
      }
      
      // Save report
      fs.writeFileSync('accessibility-report.json', JSON.stringify(report, null, 2));
      this.log('Report saved to accessibility-report.json', 'info');
      
      // Final assessment
      console.log('\n' + '='.repeat(50));
      if (report.score >= 90) {
        this.log(`🎉 Excellent accessibility score: ${report.score}%`, 'success');
      } else if (report.score >= 80) {
        this.log(`✅ Good accessibility score: ${report.score}%`, 'success');
      } else if (report.score >= 70) {
        this.log(`⚠️ Acceptable accessibility score: ${report.score}%`, 'warning');
      } else {
        this.log(`❌ Poor accessibility score: ${report.score}%`, 'error');
        process.exit(1);
      }
      
      return report;
      
    } catch (error) {
      this.log(`Accessibility validation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new AccessibilityValidator();
  validator.run().catch(console.error);
}

export default AccessibilityValidator;