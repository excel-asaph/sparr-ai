/**
 * reportSimulator.js
 * 
 * Generates deterministic mock report data for a given interview.
 * STRICTLY ADHERES to the Industry Standard 6-Axis Schema:
 * - technical
 * - communication
 * - problemSolving
 * - confidence
 * - empathy
 * - pacing
 */

export const generateMockReport = (interviewId, role = 'Software Engineer') => {
    // Deterministic seed simulation using interviewId
    const idSum = interviewId ? interviewId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;

    // Helper to get score based on ID to keep it consistent per card
    // Base score varies by metric to feel realistic
    const getScore = (offset, min = 60, max = 95) => {
        const raw = ((idSum + offset) % (max - min)) + min;
        return Math.min(100, Math.max(0, raw));
    };

    return {
        id: `rep_${interviewId}`,
        createdAt: new Date().toISOString(),
        // SIX AXIS STANDARD STATS
        stats: {
            technical: getScore(10, 65, 95),       // Axis 1
            communication: getScore(20, 70, 98),   // Axis 2
            problemSolving: getScore(30, 60, 90),  // Axis 3
            confidence: getScore(40, 50, 95),      // Axis 4
            empathy: getScore(50, 60, 100),        // Axis 5
            pacing: getScore(60, 70, 90)           // Axis 6
        },
        overallScore: getScore(0, 65, 95), // Calculated aggregate in real app
        questionsAnswered: 5,
        totalDuration: "45m",
        feedback: generateFeedback(role, getScore(10)),
        recommendations: generateRecommendations(role),
        audio: null,
        status: 'completed'
    };
};

const generateFeedback = (role, score) => {
    // Structured Feedback Object
    const isGood = score > 75;

    return {
        summary: isGood
            ? "An impressive showing. You demonstrated strong command of the core principles and communicated complex ideas with clarity."
            : "A solid effort with room for growth. While you found valid solutions, working on your system design depth and confidence will take you effectively to the next level.",
        strengths: [
            "Clear articulation of trade-offs in distributed systems.",
            "Strong empathy demonstrated during the behavioral scenario.",
            "Maintained a steady and professional pacing throughout."
        ],
        improvements: [
            "Deepen your understanding of database sharding strategies.",
            "Work on asserting your opinion more confidently when challenged.",
            "Avoid filling silence with 'um' and 'uh' - pause to think instead."
        ]
    };
};

const generateRecommendations = (role) => {
    // Structured Recommendations
    const common = [
        { type: 'read', title: 'Designing Data-Intensive Applications', link: '#' },
        { type: 'practice', title: 'LeetCode: Dynamic Programming - Med', link: '#' },
        { type: 'watch', title: 'System Design Interview - Alex Xu', link: '#' }
    ];

    if (role.toLowerCase().includes('manager')) {
        return [
            { type: 'read', title: 'The Manager\'s Path', link: '#' },
            { type: 'watch', title: 'Delegation vs Execution', link: '#' },
            { type: 'practice', title: 'Mock: Conflict Resolution', link: '#' }
        ];
    }

    return common;
};
