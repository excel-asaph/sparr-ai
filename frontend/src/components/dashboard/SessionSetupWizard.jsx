import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Upload, Check, AlertCircle, Briefcase, Building, Layers, User, ArrowRight, X, FileText, UploadCloud, Trash2 } from 'lucide-react';
import { SiGoogle, SiAmazon, SiMeta, SiNetflix } from 'react-icons/si';
import { FaMicrosoft } from 'react-icons/fa';
import SparrLoader from '../SparrLoader';
import { PERSONAS, LANGUAGE_NAMES } from '../../data/personas';

const SessionSetupWizard = ({ onCancel, onSessionReady }) => {
    const [step, setStep] = useState(1);

    // --- State Management (Mirrors LandingPage logic) ---
    const [selectedRole, setSelectedRole] = useState('');
    const [isOtherRole, setIsOtherRole] = useState(false);
    const [customRole, setCustomRole] = useState('');

    const [selectedLevel, setSelectedLevel] = useState('');
    const [isOtherLevel, setIsOtherLevel] = useState(false);
    const [customExperience, setCustomExperience] = useState('');

    const [selectedCompany, setSelectedCompany] = useState('');
    const [isOtherCompany, setIsOtherCompany] = useState(false);
    const [customCompany, setCustomCompany] = useState('');

    // Resume
    const [resumeFile, setResumeFile] = useState(null);
    const [uploadStage, setUploadStage] = useState('idle'); // idle, uploading, uploaded
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [resumeAnalysisResult, setResumeAnalysisResult] = useState(null);

    // Jobs
    const [jobVariants, setJobVariants] = useState([]);
    const [selectedJobVariant, setSelectedJobVariant] = useState(null);
    const [isLoadingJobs, setIsLoadingJobs] = useState(false);

    // Persona
    const [selectedPersona, setSelectedPersona] = useState(null);

    // Language
    const [selectedLanguage, setSelectedLanguage] = useState('us');

    // Final Creation
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    // --- Constants ---
    const roles = ["Software Engineer", "Product Manager", "Data Scientist", "Designer", "Marketing Specialist"];
    const levels = ["Internship", "Entry Level", "Associate", "Manager", "Executive"];
    const roleOptions = ["Software Engineer", "Product Manager", "Data Scientist", "Designer", "Marketing Specialist"];
    const experienceLevels = ["Internship", "Entry Level", "Associate", "Manager", "Executive"];
    const companies = [
        { name: "Google", icon: SiGoogle, color: "#4285F4" },
        { name: "Microsoft", icon: FaMicrosoft, color: "#00A4EF" },
        { name: "Amazon", icon: SiAmazon, color: "#FF9900" },
        { name: "Meta", icon: SiMeta, color: "#0668E1" },
        { name: "Netflix", icon: SiNetflix, color: "#E50914" }
    ];

    // --- Helper Functions ---
    const getCompany = () => {
        return isOtherCompany ? customCompany : selectedCompany;
    };

    const getRole = () => {
        return isOtherRole ? customRole : selectedRole;
    };

    const getExperience = () => {
        return isOtherLevel ? customExperience : selectedLevel;
    };

    // --- Actions ---

    const fetchJobs = async () => {
        setIsLoadingJobs(true);
        const finalRole = getRole();
        const finalExp = getExperience();
        const finalComp = getCompany();

        try {
            const res = await fetch('/api/generate-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company: finalComp, role: finalRole, level: finalExp })
            });
            const data = await res.json();
            if (data.jobs) setJobVariants(data.jobs);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingJobs(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setResumeFile(file);
        setUploadStage('uploading');
        setUploadProgress(0); // Reset progress for new upload

        // Sim Upload
        const interval = setInterval(() => {
            setUploadProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setUploadStage('uploaded');
                    handleResumeAnalysis(file);
                    return 100;
                }
                return p + 10;
            });
        }, 200);
    };

    const handleResumeAnalysis = async (file) => {
        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const res = await fetch('/api/analyze-resume', { method: 'POST', body: formData });
            const data = await res.json();
            setResumeAnalysisResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFinish = async () => {
        setIsCreatingSession(true);
        const finalRole = getRole();
        const finalExp = getExperience();
        const finalComp = getCompany();
        const jobArchetype = jobVariants.find(j => j.id === selectedJobVariant) || {};

        const promptPayload = {
            company: finalComp,
            role: finalRole,
            level: finalExp,
            jobArchetype: jobArchetype,
            weaknesses: resumeAnalysisResult?.weaknesses || [],
            persona: selectedPersona.name,
            personaDescription: selectedPersona.description,
            personaStyle: selectedPersona.role,
            language: selectedLanguage
        };

        try {
            // 1. Generate Prompt
            const promptRes = await fetch('/api/generate-system-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(promptPayload)
            });
            const promptData = await promptRes.json();

            // 2. Pass Data Back
            onSessionReady({
                jobContext: { role: finalRole, level: finalExp, company: finalComp, variant: jobArchetype },
                resumeContext: { storageUrl: resumeAnalysisResult?.storageUrl, weaknesses: resumeAnalysisResult?.weaknesses },
                persona: selectedPersona,
                resumeFile: resumeFile,
                systemPrompt: promptData.system_prompt,
                language: selectedLanguage
            });

        } catch (err) {
            console.error("Session Creation Failed", err);
            alert("Failed to start session. Please try again.");
            setIsCreatingSession(false);
        }
    };

    // --- Navigation Logic ---
    const handleNext = () => {
        if (step === 1) {
            setStep(s => s + 1);
            fetchJobs(); // Fetch jobs when moving from step 1 to step 2
        } else if (step < 5) {
            setStep(s => s + 1);
        } else if (step === 5) {
            handleFinish();
        }
    };

    const handleBack = () => setStep(s => s - 1);

    const canProceed = useMemo(() => {
        switch (step) {
            case 1:
                const roleValid = selectedRole || (isOtherRole && customRole.trim());
                const levelValid = selectedLevel;
                const companyValid = selectedCompany || (isOtherCompany && customCompany.trim());
                return !!(roleValid && levelValid && companyValid);
            case 2:
                return !!selectedJobVariant;
            case 3:
                return uploadStage === 'uploaded' && !isAnalyzing;
            case 4:
                return !!selectedPersona;
            case 5:
                return !!selectedLanguage;
            default:
                return false;
        }
    }, [step, selectedRole, isOtherRole, customRole, selectedLevel, selectedCompany, isOtherCompany, customCompany, selectedJobVariant, uploadStage, isAnalyzing, selectedPersona, selectedLanguage]);


    // --- Main Render ---
    if (isCreatingSession) {
        return <SessionCreationLoader />;
    }

    return (
        <div className="flex flex-col bg-white text-gray-900 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white z-10">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">New Session</h2>
                    <p className="text-gray-500 text-sm mt-1">Step {step} of 5</p>
                </div>
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-8 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="h-full flex flex-col" // Removed pb-20, added h-full for centering
                    >
                        {/* Step 1: Context (Role, Experience, Company) */}
                        {step === 1 && (
                            <div className="space-y-8">
                                {/* Role Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Target Role</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {roleOptions.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => { setSelectedRole(role); setIsOtherRole(false); }}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${selectedRole === role
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => { setSelectedRole(''); setIsOtherRole(true); }}
                                            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${isOtherRole
                                                ? 'bg-white text-gray-900 border-gray-900 ring-1 ring-gray-900'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                }`}
                                        >
                                            Other
                                        </button>
                                    </div>
                                    <AnimatePresence>
                                        {isOtherRole && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                className="overflow-hidden p-1" // Added p-1 to prevent ring clipping
                                            >
                                                <input
                                                    type="text"
                                                    value={customRole}
                                                    onChange={(e) => setCustomRole(e.target.value)}
                                                    placeholder="e.g. AI Researcher"
                                                    autoFocus
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>

                                {/* Experience Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Experience Level</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {experienceLevels.map(level => (
                                            <button
                                                key={level}
                                                onClick={() => { setSelectedLevel(level); setIsOtherLevel(false); }}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${selectedLevel === level
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Company Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Target Company</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        {companies.map(company => (
                                            <button
                                                key={company.name}
                                                onClick={() => { setSelectedCompany(company.name); setIsOtherCompany(false); }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedCompany === company.name
                                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedCompany === company.name ? 'bg-white' : 'bg-gray-100'}`}>
                                                    <company.icon className={`w-4 h-4 ${selectedCompany === company.name ? 'text-blue-600' : 'text-gray-500'}`} />
                                                </div>
                                                <span className={`font-semibold text-sm ${selectedCompany === company.name ? 'text-blue-900' : 'text-gray-700'}`}>{company.name}</span>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => { setSelectedCompany(''); setIsOtherCompany(true); }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isOtherCompany
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                                <span className="font-bold text-lg leading-none mb-1">...</span>
                                            </div>
                                            <span className="font-semibold text-sm">Other</span>
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {isOtherCompany && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                className="overflow-hidden p-1" // Added p-1 to prevent ring clipping
                                                onAnimationComplete={() => {
                                                    // Optional: Scroll to bottom if needed
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={customCompany}
                                                    onChange={(e) => setCustomCompany(e.target.value)}
                                                    placeholder="Enter company name..."
                                                    autoFocus
                                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </section>
                            </div>
                        )}

                        {/* Step 2: Job Variant Selection */}
                        {step === 2 && (
                            <div className="space-y-6">
                                {!isLoadingJobs && (
                                    <div className="text-center mb-8">
                                        <h3 className="text-xl font-bold text-gray-900 fa-fade">Finding fit for {getCompany()}...</h3>
                                        <p className="text-gray-500">We're searching for typical roles that match your profile.</p>
                                    </div>
                                )}
                                {isLoadingJobs ? (
                                    <div className="flex flex-col items-center justify-center py-20 h-64">
                                        {/* Inline Loader Logic for visuals */}
                                        <JobSearchLoader company={getCompany()} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {jobVariants.map(variant => (
                                            <div
                                                key={variant.id}
                                                onClick={() => setSelectedJobVariant(variant.id)}
                                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg ${selectedJobVariant === variant.id
                                                    ? 'border-blue-600 bg-blue-50/50'
                                                    : 'border-gray-100 bg-white hover:border-blue-300'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-900">{variant.type}</h4>
                                                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{variant.years}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {variant.skills.slice(0, 4).map(skill => (
                                                        <span key={skill} className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{skill}</span>
                                                    ))}
                                                </div>
                                                <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                                                    {variant.requirements.slice(0, 3).map((req, i) => (
                                                        <li key={i}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* Step 3: Resume Upload */}
                        {step === 3 && (
                            <div className="flex flex-col items-center justify-center h-full py-4">
                                {isAnalyzing ? (
                                    <ResumeAnalysisLoader />
                                ) : (
                                    <div className="w-full max-w-lg">
                                        {!resumeFile ? (
                                            <div
                                                className={`group p-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer ${resumeFile ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                                                    <UploadCloud className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">Upload your Resume</h3>
                                                <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">Drag & drop your PDF here, or click to browse. Max size 10MB.</p>
                                                <label className="cursor-pointer bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-gray-200 text-sm">
                                                    <span>Browse Files</span>
                                                    <input type="file" className="hidden" accept="application/pdf" onChange={handleFileSelect} />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 group relative">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-900 text-gray-200 rounded-xl flex items-center justify-center shadow-lg shadow-gray-200">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className="font-bold text-gray-900 truncate text-base">{resumeFile.name}</p>
                                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                                                    </div>

                                                    {/* Actions / Status */}
                                                    <div className="flex items-center gap-2">
                                                        {uploadStage === 'uploaded' ? (
                                                            <div className="w-8 h-8 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                                                                <Check className="w-5 h-5" />
                                                            </div>
                                                        ) : null}

                                                        {/* Delete Button */}
                                                        {uploadStage !== 'uploading' && !isAnalyzing && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setResumeFile(null);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                                                title="Remove file"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                {uploadStage === 'uploading' && (
                                                    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <motion.div
                                                            className="bg-gray-900 h-full rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 4: Persona Selection */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    {PERSONAS.map((p, index) => (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            onClick={() => setSelectedPersona(p)}
                                            className={`relative h-40 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${selectedPersona?.id === p.id
                                                ? 'ring-4 ring-blue-500 shadow-xl scale-[1.02]'
                                                : 'hover:shadow-lg hover:-translate-y-1'
                                                }`}
                                        >
                                            {/* Card Background Image */}
                                            <div className="absolute inset-0">
                                                <img
                                                    src={p.avatar}
                                                    alt={p.name}
                                                    className={`w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500`}
                                                    style={p.imgStyle || {}}
                                                />
                                                <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90 transition-opacity duration-300 ${selectedPersona?.id === p.id ? 'opacity-80' : 'group-hover:opacity-70'
                                                    }`} />
                                            </div>

                                            {/* Card Content (Name & Role) */}
                                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white z-10">
                                                <h3 className="text-lg font-bold mb-0.5">{p.name}</h3>
                                                <p className="text-[10px] text-blue-200 font-semibold tracking-wide uppercase h-7 line-clamp-2">
                                                    {p.role}
                                                </p>
                                            </div>

                                            {/* Selected Indicator */}
                                            {selectedPersona?.id === p.id && (
                                                <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full z-20 shadow-lg">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            )}

                                            {/* Floating Detail Card (Hover) */}
                                            <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center z-20">
                                                <div className="mb-2">
                                                    <h4 className="text-base font-bold text-white mb-1">{p.role}</h4>
                                                    <p className="text-[10px] text-gray-300 leading-relaxed font-light line-clamp-3">
                                                        {p.description}
                                                    </p>
                                                </div>

                                                {/* Language Flags */}
                                                <div className="mt-auto relative">
                                                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Speaks</p>
                                                    <div className="flex items-center -space-x-1.5">
                                                        {p.languages.slice(0, 3).map((lang) => (
                                                            <img
                                                                key={lang}
                                                                src={`https://flagcdn.com/w40/${lang}.png`}
                                                                alt={lang}
                                                                className="w-5 h-5 rounded-full border-2 border-gray-800 object-cover"
                                                            />
                                                        ))}
                                                        {p.languages.length > 3 && (
                                                            <div className="w-5 h-5 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-[8px] text-white font-bold z-10">
                                                                +{p.languages.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 5: Language Selection */}
                        {step === 5 && selectedPersona && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500 mb-4">
                                    {selectedPersona.name} can conduct interviews in the following languages. Select your preferred language:
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {(selectedPersona.languages || ['us']).map((lang, index) => (
                                        <motion.div
                                            key={lang}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * index }}
                                            onClick={() => setSelectedLanguage(lang)}
                                            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${selectedLanguage === lang
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <img
                                                src={`https://flagcdn.com/w80/${lang}.png`}
                                                alt={lang}
                                                className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                                            />
                                            <div>
                                                <span className={`text-sm font-bold ${selectedLanguage === lang ? 'text-blue-700' : 'text-gray-700'
                                                    }`}>
                                                    {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                                                </span>
                                            </div>
                                            {selectedLanguage === lang && (
                                                <div className="ml-auto">
                                                    <Check className="w-5 h-5 text-blue-500" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer with Actions (Fixed at Bottom) */}
            <div className="p-8 border-t border-gray-100 bg-white flex justify-end gap-4 z-10">
                {step > 1 && (
                    <button
                        onClick={handleBack}
                        disabled={isCreatingSession}
                        className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        Back
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={!canProceed || isCreatingSession}
                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${canProceed && !isCreatingSession
                        ? 'bg-gray-900 hover:bg-gray-800 hover:scale-105 active:scale-95'
                        : 'bg-gray-300 cursor-not-allowed'
                        }`}
                >
                    {isCreatingSession ? (
                        <>
                            <SparrLoader size="sm" color="white" />
                            <span>Creating...</span>
                        </>
                    ) : step === 5 ? (
                        <>Start Session <ArrowRight className="w-4 h-4" /></>
                    ) : (
                        <>Next <ChevronRight className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    );
};

import ShimmeringText from '../ui/ShimmeringText';

const JobSearchLoader = ({ company }) => {
    const messages = [
        `Finding fit for ${company}...`,
        "Analyzing job market...",
        "Matching your profile...",
        "Identifying key roles..."
    ];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/50 rounded-3xl">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8 }}
                >
                    <ShimmeringText
                        text={messages[currentIndex]}
                        className="text-xl font-medium tracking-tight text-gray-900"
                        shimmerColor="#ffffff"
                        spread={3}
                        duration={2.5}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const SessionCreationLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[500px]">
            <AnimatePresence mode='wait'>
                <motion.div
                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8 }}
                >
                    <ShimmeringText
                        text="Gathering Interview context..."
                        className="text-xl font-medium tracking-tight text-gray-900 mb-6"
                        shimmerColor="#ffffff"
                        spread={3}
                        duration={2.5}
                    />
                </motion.div>
            </AnimatePresence>


        </div>
    );
};

const ResumeAnalysisLoader = () => {
    const messages = [
        "Scanning resume for weaknesses...",
        "Identifying core competencies...",
        "Detecting experience gaps...",
        "Calibrating interview difficulty..."
    ];
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white/50 rounded-3xl h-full w-full">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.8 }}
                >
                    <ShimmeringText
                        text={messages[currentIndex]}
                        className="text-xl font-medium tracking-tight text-gray-900"
                        shimmerColor="#ffffff"
                        spread={3}
                        duration={2.5}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SessionSetupWizard;
