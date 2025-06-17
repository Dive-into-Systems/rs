// Helper function to analyze a sequence list and collect statistics
export function analyzeSequenceList(sequenceList, depth = 0) {
    let stats = {
        beforeWaitPrints: 0,
        afterWaitPrints: 0,
        childPrints: 0,
        otherPrints: 0,
        maxDepth: depth,
        maxWidth: 0,
        totalForks: 0
    };

    for (const item of sequenceList) {
        if (typeof item === 'string') {
            // Count prints based on context
            stats.otherPrints++;
            stats.maxWidth ++;
        } else if (typeof item === 'object') {
            stats.totalForks++;
            // Recursively analyze nested sequences
            const beforeWaitStats = analyzeSequenceList(item.beforeWait, depth + 1);
            const afterWaitStats = analyzeSequenceList(item.afterWait, depth);
            const childStats = analyzeSequenceList(item.child, depth + 1);

            // Update stats
            stats.beforeWaitPrints += beforeWaitStats.otherPrints;
            stats.beforeWaitPrints += beforeWaitStats.beforeWaitPrints;
            stats.beforeWaitPrints += afterWaitStats.beforeWaitPrints;
            stats.beforeWaitPrints += childStats.beforeWaitPrints;

            stats.afterWaitPrints += afterWaitStats.otherPrints;
            stats.afterWaitPrints += beforeWaitStats.afterWaitPrints;
            stats.afterWaitPrints += afterWaitStats.afterWaitPrints;
            stats.afterWaitPrints += childStats.afterWaitPrints;

            stats.childPrints += childStats.otherPrints;
            stats.childPrints += beforeWaitStats.childPrints;
            stats.childPrints += afterWaitStats.childPrints;
            stats.childPrints += childStats.childPrints;
            
            stats.maxDepth = Math.max(stats.maxDepth, beforeWaitStats.maxDepth, afterWaitStats.maxDepth, childStats.maxDepth);
            stats.maxWidth += Math.max(beforeWaitStats.maxWidth, childStats.maxWidth);
            stats.maxWidth += afterWaitStats.maxWidth;
            stats.totalForks += beforeWaitStats.totalForks + afterWaitStats.totalForks + childStats.totalForks;
        }
    }

    return stats;
}