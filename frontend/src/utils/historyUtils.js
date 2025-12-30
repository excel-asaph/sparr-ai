/**
 * buildHistoryChain
 * 
 * Traverses the real interview list using parentId/childId pointers to build the full chain.
 * Transforms real Gemini report data into UI-expected format.
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
            break;
        }
    }

    // 4. Transform Reports to UI-expected format
    return chain.map((session) => {
        // Clone to avoid mutating original state in cache
        const augmented = { ...session };

        // Ensure 'date' property exists for UI compatibility
        if (!augmented.date && augmented.createdAt) {
            augmented.date = augmented.createdAt;
        }

        // Transform real report to UI-expected format
        if (augmented.report && augmented.report.stats) {
            const report = augmented.report;

            // Map report.stats to skills for UI components
            augmented.skills = report.stats || {};
            augmented.overallScore = report.overallScore || 0;
            augmented.highlights = report.highlights || [];
            augmented.feedback = report.feedback || {};
            augmented.recommendations = report.recommendations || [];
            augmented.skillsFeedback = report.skillsFeedback || {};
            augmented.audioAnalysis = report.audioAnalysis || {};
            augmented.interviewerMessage = report.interviewerMessage || {};

            // Map recording duration for waveform pin positioning
            if (!augmented.recording) {
                augmented.recording = {};
            }
            augmented.recording.duration = report.totalDuration || augmented.recording?.duration || "15:00";

            // Ensure basic fields exist
            augmented.role = augmented.jobContext?.role || 'Interview';
            augmented.company = augmented.jobContext?.company || 'Company';
            augmented.companyColor = "#111827";
        }

        // Ensure audioUrl is preserved for audio playback
        // (audioUrl is stored at top level of interview document, not in report)
        augmented.audioUrl = augmented.audioUrl || null;

        // Ensure Agent Object exists (UI fallback)
        if (!augmented.agent) {
            augmented.agent = {
                name: (typeof augmented.persona === 'string' ? augmented.persona : augmented.persona?.name) || 'Interviewer',
                avatar: augmented.persona?.avatar || `https://i.pravatar.cc/150?u=${augmented.id}`
            };
        }

        return augmented;
    });
};
