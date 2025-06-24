import { genSimpleWaitCode, printSequenceConstraints } from './build.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { analyzeSequenceList } from './timeline_statistics.js';

// Polyfill for random number generation
if (typeof window === 'undefined') {
    global.window = {
        crypto: {
            getRandomValues: (array) => {
                const bytes = crypto.randomBytes(array.length * 4);
                for (let i = 0; i < array.length; i++) {
                    array[i] = bytes.readUInt32BE(i * 4);
                }
                return array;
            }
        }
    };
}

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run tests for a specific setup
function runTests(numForks, numPrints, numTests) {
    const results = [];
    
    for (let i = 0; i < numTests; i++) {
        const code = genSimpleWaitCode(numForks, numPrints);
        const sequenceList = printSequenceConstraints(code);
        const stats = analyzeSequenceList(sequenceList);
        
        results.push({
            code,
            stats
        });
    }

    return results;
}

// Main test function
function runAllTests() {
    const testConfigs = [
        { numForks: 2, numPrints: 6, numTests: 10 },
        { numForks: 2, numPrints: 7, numTests: 10 },
        { numForks: 3, numPrints: 8, numTests: 10 },
        { numForks: 3, numPrints: 9, numTests: 10 },
        { numForks: 3, numPrints: 10, numTests: 10 }
    ];

    const allResults = {};
    let runCount = 0;
    const totalRuns = 10;

    for (let run = 0; run < totalRuns; run++) {
        console.log(`\nRunning test batch ${run + 1} of ${totalRuns}`);
        
        for (const config of testConfigs) {
            const key = `forks_${config.numForks}_prints_${config.numPrints}`;
            if (!allResults[key]) {
                allResults[key] = [];
            }
            const results = runTests(config.numForks, config.numPrints, config.numTests);
            allResults[key].push(...results);
        }
    }

    // Calculate aggregate statistics
    const aggregateStats = {};
    for (const [key, results] of Object.entries(allResults)) {
        const stats = {
            avgBeforeWaitPrints: 0,
            avgAfterWaitPrints: 0,
            avgChildPrints: 0,
            avgMaxDepth: 0,
            avgTotalForks: 0,
            uniqueCodes: new Set()
        };

        for (const result of results) {
            stats.avgBeforeWaitPrints += result.stats.beforeWaitPrints;
            stats.avgAfterWaitPrints += result.stats.afterWaitPrints;
            stats.avgChildPrints += result.stats.childPrints;
            stats.avgMaxDepth += result.stats.maxDepth;
            stats.avgTotalForks += result.stats.totalForks;
            stats.uniqueCodes.add(result.code);
        }

        // Calculate averages
        const numResults = results.length;
        stats.avgBeforeWaitPrints /= numResults;
        stats.avgAfterWaitPrints /= numResults;
        stats.avgChildPrints /= numResults;
        stats.avgMaxDepth /= numResults;
        stats.avgTotalForks /= numResults;
        stats.uniqueCodeCount = stats.uniqueCodes.size;
        delete stats.uniqueCodes; // Remove the Set from the output

        aggregateStats[key] = stats;
    }

    // Save results to file
    const output = {
        individualResults: allResults,
        aggregateStats: aggregateStats
    };

    const outputPath = path.join(__dirname, 'fork_variability_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log('\nResults have been saved to', outputPath);
}

// Run the tests
runAllTests(); 