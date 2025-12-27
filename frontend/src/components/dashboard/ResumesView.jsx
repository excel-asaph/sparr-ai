import React, { useState, useEffect } from 'react';
import { FileText, Download, ExternalLink, RefreshCw, Calendar, HardDrive } from 'lucide-react';

const ResumesView = ({ interviews = [] }) => {
    const [selectedResume, setSelectedResume] = useState(null);
    const [filteredResumes, setFilteredResumes] = useState([]);

    // --- GOLDEN RULE DEDUPLICATION & SELECTION ---
    useEffect(() => {
        if (!interviews || interviews.length === 0) {
            setFilteredResumes([]);
            return;
        }

        console.log("ResumesView: Raw Interviews:", interviews);

        // Rule: Select "Root" interviews (No Parent ID)
        // These represent the start of a chain (or a standalone session).
        // Since children share the resume of the parent/root, we only show the root's resume.
        const rootInterviews = interviews.filter(interview => {
            const isRoot = !interview.parentId;
            const hasUrl = interview.resumeContext?.storageUrl;
            console.log(`Checking ${interview.jobContext?.company}: isRoot=${isRoot}, hasUrl=${!!hasUrl}`, interview.resumeContext);
            return isRoot && hasUrl;
        });

        const processedResumes = rootInterviews.map(interview => {
            const uploadedName = interview.jobContext?.company
                ? `${interview.jobContext.role} @ ${interview.jobContext.company}`
                : "Resume";

            return {
                id: interview.id,
                name: uploadedName, // Friendly Name
                url: interview.resumeContext.storageUrl, // The actual PDF
                created: interview.createdAt,
                // Meta info for detail view
                role: interview.jobContext?.role,
                company: interview.jobContext?.company,
                weaknesses: interview.resumeContext?.weaknesses || []
            };
        });

        // Sort by Newest
        processedResumes.sort((a, b) => new Date(b.created) - new Date(a.created));

        setFilteredResumes(processedResumes);

        // Auto-select first if available and nothing selected
        if (processedResumes.length > 0 && !selectedResume) {
            setSelectedResume(processedResumes[0]);
        }
    }, [interviews]);


    // Utility: Format Date
    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="h-full w-full flex bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            {/* LEFT PANE: List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        My Resumes
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Showing unique resumes from your interview sessions.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredResumes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 mt-10">
                            <HardDrive className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No resumes found</p>
                        </div>
                    ) : (
                        filteredResumes.map((resume) => (
                            <button
                                key={resume.id}
                                onClick={() => setSelectedResume(resume)}
                                className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${selectedResume?.id === resume.id
                                    ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-100'
                                    : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${selectedResume?.id === resume.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className={`font-semibold text-sm truncate ${selectedResume?.id === resume.id ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {resume.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(resume.created)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Viewer */}
            <div className="flex-1 bg-gray-100/50 flex flex-col relative overflow-hidden">
                {selectedResume ? (
                    <>
                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                            <a
                                href={selectedResume.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/90 backdrop-blur text-gray-700 p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                                title="Open in New Tab"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>

                        <iframe
                            src={selectedResume.url} // Modern browsers render PDF via iframe
                            className="w-full h-full relative z-10"
                            title="Resume PDF Viewer"
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-medium">Select a resume to view</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumesView;
