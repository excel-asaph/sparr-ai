/**
 * @fileoverview Interview History Chain Utilities
 * 
 * Provides utilities for building and traversing linked interview session chains
 * using parent/child ID relationships. Transforms raw Firestore data into
 * UI-compatible format for the history explorer and report views.
 * 
 * @module utils/historyUtils
 */

/**
 * Builds a complete interview history chain from a starting session.
 * 
 * Traverses both backwards (ancestors) and forwards (descendants) through
 * the linked list structure using parentId/childId references. Transforms
 * Gemini report data into UI-expected format with proper field mapping.
 * 
 * @function buildHistoryChain
 * @param {string} currentId - The ID of the session to start from
 * @param {Array<Object>} allInterviews - All interviews fetched from Firestore
 * @returns {Array<Object>} Ordered array of sessions [Oldest → Newest]
 * 
 * @example
 * const chain = buildHistoryChain(selectedInterview.id, allInterviews);
 * // Returns: [session1, session2, session3] in chronological order
 */
export const buildHistoryChain = (currentId, allInterviews = []) => {
    if (!currentId || !allInterviews.length) return [];

    // Find the starting node
    const startNode = allInterviews.find(i => i.id === currentId);
    if (!startNode) return [];

    let chain = [startNode];

    // Traverse backwards to find all ancestors
    let cursor = startNode;
    let visitedIds = new Set([startNode.id]);

    while (cursor && cursor.parentId) {
        // Cycle detection to prevent infinite loops
        if (visitedIds.has(cursor.parentId)) break;

        const parent = allInterviews.find(i => i.id === cursor.parentId);
        if (parent) {
            chain.unshift(parent);
            visitedIds.add(parent.id);
            cursor = parent;
        } else {
            break;
        }
    }

    // Traverse forwards to find all descendants
    cursor = startNode;
    while (cursor && cursor.childId) {
        if (visitedIds.has(cursor.childId)) break;

        const child = allInterviews.find(i => i.id === cursor.childId);
        if (child) {
            chain.push(child);
            visitedIds.add(child.id);
            cursor = child;
        } else {
            break;
        }
    }

    // Transform each session to UI-expected format
    return chain.map((session) => {
        const augmented = { ...session };

        // Ensure date property exists for UI compatibility
        if (!augmented.date && augmented.createdAt) {
            augmented.date = augmented.createdAt;
        }

        // Transform Gemini report to UI format
        if (augmented.report && augmented.report.stats) {
            const report = augmented.report;

            // Map report fields to top-level for UI components
            augmented.skills = report.stats || {};
            augmented.overallScore = report.overallScore || 0;
            augmented.highlights = report.highlights || [];
            augmented.feedback = report.feedback || {};
            augmented.recommendations = report.recommendations || [];
            augmented.skillsFeedback = report.skillsFeedback || {};
            augmented.audioAnalysis = report.audioAnalysis || {};
            augmented.interviewerMessage = report.interviewerMessage || {};

            // Set recording duration for waveform visualization
            if (!augmented.recording) {
                augmented.recording = {};
            }
            augmented.recording.duration = report.totalDuration || augmented.recording?.duration || "15:00";

            // Extract job context fields
            augmented.role = augmented.jobContext?.role || 'Interview';
            augmented.company = augmented.jobContext?.company || 'Company';
            augmented.companyColor = "#111827";
        }

        // Preserve audioUrl for playback
        augmented.audioUrl = augmented.audioUrl || null;

        // Ensure agent object exists for UI
        if (!augmented.agent) {
            augmented.agent = {
                name: (typeof augmented.persona === 'string' ? augmented.persona : augmented.persona?.name) || 'Interviewer',
                avatar: augmented.persona?.avatar || `https://i.pravatar.cc/150?u=${augmented.id}`
            };
        }

        return augmented;
    });
};
