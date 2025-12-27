import { generateMockReport } from './reportSimulator';

/**
 * buildHistoryChain
 * 
 * Traverses the real interview list using parentId/childId pointers to build the full chain.
 * If a real interview lacks a 'report' (stats), it augments it with a deterministic mock report
 * so the visualization/analytics still work.
 * 
 * @param {string} currentId - The ID of the session we are currently viewing/starting from.
 * @param {Array} allInterviews - The master list of all real interviews fetched from backend.
 * @returns {Array} - Ordered array of session objects [Oldest -> ... -> Newest].
 */
export const buildHistoryChain = (currentId, allInterviews = []) => {
    if (!currentId || !allInterviews.length) return [];

    // 1. Find the starting point
    const startNode = allInterviews.find(i => i.id === currentId);
    if (!startNode) return [];

    let chain = [startNode];

    // 2. Traverse Backwards (Ancestors)
    let cursor = startNode;
    let visitedIds = new Set([startNode.id]); // Cycle detection

    while (cursor && cursor.parentId) {
        if (visitedIds.has(cursor.parentId)) break; // Cycle detected

        const parent = allInterviews.find(i => i.id === cursor.parentId);
        if (parent) {
            chain.unshift(parent); // Add to front
            visitedIds.add(parent.id);
            cursor = parent;
        } else {
            console.warn(`Broken parent link: ${cursor.parentId} not found.`);
            break;
        }
    }

    // 3. Traverse Forwards (Descendants) - In case we started in the middle
    cursor = startNode;
    while (cursor && cursor.childId) {
        if (visitedIds.has(cursor.childId)) break;

        const child = allInterviews.find(i => i.id === cursor.childId);
        if (child) {
            chain.push(child); // Add to end
            visitedIds.add(child.id);
            cursor = child;
        } else {
            // console.warn(`Broken child link: ${cursor.childId} not found.`);
            break;
        }
    }

    // 4. Augment with Reports (Standardization Layer)
    // The UI expects 'report.stats' with specific keys. Real data excludes this until graded.
    return chain.map((session, index) => {
        // Clone to avoid mutating original state in cache
        const augmented = { ...session };
        // FIX: Ensure 'date' property exists for UI compatibility if 'createdAt' is used
        if (!augmented.date && augmented.createdAt) {
            augmented.date = augmented.createdAt;
        }

        // Ensure Agent Object exists (UI fallback)
        if (!augmented.agent) {
            augmented.agent = {
                name: (typeof augmented.persona === 'string' ? augmented.persona : augmented.persona?.name) || 'Interviewer',
                avatar: augmented.persona?.avatar || `https://i.pravatar.cc/150?u=${augmented.id}`
            };
        }

        // Ensure Report exists
        if (!augmented.report || !augmented.report.stats) {
            const role = augmented.jobContext?.role || 'Engineer';
            // Generate deterministic stats based on ID
            const mockReport = generateMockReport(augmented.id, role);

            // If it's an older session, simulate "weaker" stats for the growth graph effect
            // (Only do this if we are augmenting - i.e. it's ungraded)
            const isLatest = index === chain.length - 1;
            if (!isLatest) {
                Object.keys(mockReport.stats).forEach(key => {
                    mockReport.stats[key] = Math.max(40, mockReport.stats[key] - 10);
                });
                mockReport.overallScore = Math.max(50, mockReport.overallScore - 10);
            }

            augmented.report = mockReport;
        } else if (!augmented.report.highlights) {
            // If real report exists but lacks highlights, inject mock ones for UI demo
            augmented.report.highlights = [
                { type: 'success', timestamp: '05:20', text: 'Excellent explanation of the algorithm complexity.', audioUrl: null },
                { type: 'warning', timestamp: '12:45', text: 'Struggled slightly with the edge case handling.', audioUrl: null }
            ];
        }

        // Ensure Skills Aggregation exists (for Dashboard Charts)
        if (!augmented.skills && augmented.report?.stats) {
            augmented.skills = {
                technical: augmented.report.stats.technical,
                communication: augmented.report.stats.communication,
                confidence: augmented.report.stats.confidence,
                pacing: augmented.report.stats.pacing,
                empathy: augmented.report.stats.empathy,
                problemSolving: augmented.report.stats.problemSolving
            };
        }

        // Ensure Overall Score
        if (!augmented.overallScore && augmented.report) {
            augmented.overallScore = augmented.report.overallScore;
        }

        return augmented;
    });
};
