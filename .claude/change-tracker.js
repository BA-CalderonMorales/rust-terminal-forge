#!/usr/bin/env node

/**
 * Terminal Forge Change Tracker
 * Monitors file changes and applies automated refactoring patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

class ChangeTracker {
    constructor() {
        this.config = this.loadConfig();
        this.changeLog = [];
        this.sessionStartTime = new Date();
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'session-automation.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.error('Failed to load config:', error);
            return { refactoring_patterns: {}, automation_commands: {} };
        }
    }

    logChange(filePath, changeType) {
        const change = {
            file: filePath,
            type: changeType,
            timestamp: new Date(),
            pattern: this.identifyPattern(filePath)
        };
        
        this.changeLog.push(change);
        console.log(`📝 Change logged: ${changeType} in ${filePath}`);
        
        // Apply relevant refactoring rules
        this.applyRefactoringRules(change);
    }

    identifyPattern(filePath) {
        const patterns = this.config.refactoring_patterns;
        
        for (const [patternName, config] of Object.entries(patterns)) {
            if (this.matchesGlob(filePath, config.pattern)) {
                return patternName;
            }
        }
        
        return 'unknown';
    }

    matchesGlob(filePath, pattern) {
        // Simple glob matching - could be enhanced with a proper glob library
        const regexPattern = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '[^/]');
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(filePath);
    }

    applyRefactoringRules(change) {
        const pattern = this.config.refactoring_patterns[change.pattern];
        if (!pattern || !pattern.rules) return;

        console.log(`🔧 Applying refactoring rules for pattern: ${change.pattern}`);
        
        pattern.rules.forEach(rule => {
            this.executeRule(rule, change.file);
        });
    }

    executeRule(rule, filePath) {
        try {
            switch (rule) {
                case 'extract_reusable_hooks':
                    this.extractReusableHooks(filePath);
                    break;
                case 'optimize_rerenders':
                    this.optimizeRerenders(filePath);
                    break;
                case 'improve_error_handling':
                    this.improveErrorHandling(filePath);
                    break;
                case 'add_logging':
                    this.addLogging(filePath);
                    break;
                default:
                    console.log(`⚠️  Unknown rule: ${rule}`);
            }
        } catch (error) {
            console.error(`❌ Failed to execute rule ${rule}:`, error.message);
        }
    }

    extractReusableHooks(filePath) {
        if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Look for repeated useState patterns that could be extracted
        const useStateMatches = content.match(/const \[[\w\s,]+\] = useState\([^)]*\);/g);
        if (useStateMatches && useStateMatches.length > 3) {
            console.log(`💡 ${filePath} has ${useStateMatches.length} useState calls - consider extracting to custom hook`);
        }
        
        // Look for repeated useEffect patterns
        const useEffectMatches = content.match(/useEffect\s*\(\s*\(\)\s*=>/g);
        if (useEffectMatches && useEffectMatches.length > 2) {
            console.log(`💡 ${filePath} has ${useEffectMatches.length} useEffect calls - consider extracting logic`);
        }
    }

    optimizeRerenders(filePath) {
        if (!filePath.endsWith('.tsx')) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for missing React.memo
        if (content.includes('export const') && !content.includes('React.memo')) {
            console.log(`💡 ${filePath} - Consider wrapping component with React.memo for performance`);
        }
        
        // Check for inline object/function definitions in JSX
        const inlineObjectMatches = content.match(/\w+={{[^}]+}}/g);
        if (inlineObjectMatches && inlineObjectMatches.length > 2) {
            console.log(`💡 ${filePath} has ${inlineObjectMatches.length} inline objects - consider using useMemo`);
        }
    }

    improveErrorHandling(filePath) {
        if (!filePath.endsWith('.rs')) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Look for unwrap() calls that could use better error handling
        const unwrapMatches = content.match(/\.unwrap\(\)/g);
        if (unwrapMatches) {
            console.log(`💡 ${filePath} has ${unwrapMatches.length} unwrap() calls - consider using proper error handling`);
        }
        
        // Look for missing Result types
        if (content.includes('fn ') && !content.includes('Result<')) {
            const functionCount = (content.match(/fn \w+/g) || []).length;
            if (functionCount > 2) {
                console.log(`💡 ${filePath} has functions that might benefit from Result<T, E> return types`);
            }
        }
    }

    addLogging(filePath) {
        if (!filePath.endsWith('.rs')) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if logging is already present
        if (!content.includes('log::') && !content.includes('println!')) {
            console.log(`💡 ${filePath} - Consider adding logging for better debugging`);
        }
    }

    runQualityChecks() {
        console.log('🔍 Running quality checks...');
        
        const commands = this.config.automation_commands;
        
        Object.entries(commands).forEach(([name, command]) => {
            try {
                execSync(command, { stdio: 'pipe' });
                console.log(`✅ ${name} passed`);
            } catch (error) {
                console.log(`❌ ${name} failed: ${error.message.slice(0, 100)}...`);
            }
        });
    }

    generateSessionReport() {
        const duration = new Date() - this.sessionStartTime;
        const durationMinutes = Math.round(duration / 60000);
        
        const report = {
            session_start: this.sessionStartTime.toISOString(),
            duration_minutes: durationMinutes,
            changes_count: this.changeLog.length,
            patterns_affected: [...new Set(this.changeLog.map(c => c.pattern))],
            files_modified: [...new Set(this.changeLog.map(c => c.file))],
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(__dirname, `session-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📊 Session report generated: ${reportPath}`);
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze change patterns
        const patternCounts = {};
        this.changeLog.forEach(change => {
            patternCounts[change.pattern] = (patternCounts[change.pattern] || 0) + 1;
        });
        
        if (patternCounts.react_components > 5) {
            recommendations.push('High React component activity - consider component architecture review');
        }
        
        if (patternCounts.rust_backend > 3) {
            recommendations.push('Significant backend changes - ensure API documentation is updated');
        }
        
        return recommendations;
    }

    start() {
        console.log('🚀 Terminal Forge Change Tracker started');
        console.log('👁️  Monitoring file changes...');
        
        // Watch for file changes
        const watcher = chokidar.watch(['src/**/*', 'tests/**/*'], {
            ignored: [/node_modules/, /target/, /\.git/],
            persistent: true
        });
        
        watcher.on('change', (filePath) => {
            this.logChange(filePath, 'modified');
        });
        
        watcher.on('add', (filePath) => {
            this.logChange(filePath, 'added');
        });
        
        watcher.on('unlink', (filePath) => {
            this.logChange(filePath, 'deleted');
        });
        
        // Run quality checks every 5 minutes
        setInterval(() => {
            if (this.changeLog.length > 0) {
                this.runQualityChecks();
            }
        }, 5 * 60 * 1000);
        
        // Generate report on exit
        process.on('SIGINT', () => {
            console.log('\n🏁 Generating final session report...');
            this.generateSessionReport();
            process.exit(0);
        });
    }
}

// CLI interface
if (require.main === module) {
    const tracker = new ChangeTracker();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            tracker.start();
            break;
        case 'report':
            tracker.generateSessionReport();
            break;
        default:
            console.log('Usage: node change-tracker.js [start|report]');
    }
}

module.exports = ChangeTracker;