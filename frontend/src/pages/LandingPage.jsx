import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { SiGoogle, SiAmazon, SiMeta, SiNetflix } from 'react-icons/si';
import { FaMicrosoft } from 'react-icons/fa';
import SparrLoader from '../components/SparrLoader';


// Import Shared Data
import { PERSONAS, LANGUAGE_NAMES } from '../data/personas';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showScroll, setShowScroll] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Step State
  const [step, setStep] = useState(1);

  // Role State
  const [selectedRole, setSelectedRole] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customRole, setCustomRole] = useState('');

  // Experience State
  const [selectedExperience, setSelectedExperience] = useState('');
  const [isOtherExperienceSelected, setIsOtherExperienceSelected] = useState(false);
  const [customExperience, setCustomExperience] = useState('');

  // Company State
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isOtherCompanySelected, setIsOtherCompanySelected] = useState(false);
  const [customCompany, setCustomCompany] = useState('');

  // Job Variant State
  const [selectedJobVariant, setSelectedJobVariant] = useState(null);
  const [jobVariants, setJobVariants] = useState([]);
  const [lastJobParams, setLastJobParams] = useState(null); // Cache key
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobError, setJobError] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false); // Loading for Step 6

  // Resume Upload State (Step 5)
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('idle'); // 'idle' | 'uploading' | 'uploaded'
  const [uploadError, setUploadError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [resumeAnalysisResult, setResumeAnalysisResult] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsOtherSelected(false);
  };

  const handleOtherSelect = () => {
    setSelectedRole('');
    setIsOtherSelected(true);
  };

  const handleExperienceSelect = (exp) => {
    setSelectedExperience(exp);
    setIsOtherExperienceSelected(false);
  };

  const handleOtherExperienceSelect = () => {
    setSelectedExperience('');
    setIsOtherExperienceSelected(true);
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setIsOtherCompanySelected(false);
  };

  const handleOtherCompanySelect = () => {
    setSelectedCompany('');
    setIsOtherCompanySelected(true);
  };

  const handleNext = () => {
    // Top-Level Context Definitions (Available for all steps)
    const roleToPass = isOtherSelected ? customRole : selectedRole;
    const expToPass = isOtherExperienceSelected ? customExperience : selectedExperience;
    const companyToPass = isOtherCompanySelected ? customCompany : selectedCompany;

    if (step === 1) {
      if (roleToPass) {
        setStep(2);
      }
    } else if (step === 2) {
      if (expToPass) {
        setStep(3);
      }
    } else if (step === 3) {
      // Step 3 Transition: Fetch Jobs

      // Caching Logic: If input matches last fetch, don't refetch
      const currentParams = JSON.stringify({ role: roleToPass, level: expToPass, company: companyToPass });

      if (currentParams === lastJobParams && jobVariants.length > 0) {
        console.log("Using cached job variants");
        setStep(4);
        return;
      }

      if (companyToPass) {
        setIsLoadingJobs(true);
        setJobError(null);
        setLastJobParams(currentParams); // Update cache key

        fetch('/api/generate-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: companyToPass,
            role: roleToPass,
            level: expToPass
          })
        })
          .then(res => res.json())
          .then(data => {
            console.log("Jobs Received:", data);
            if (data.jobs && Array.isArray(data.jobs)) {
              setJobVariants(data.jobs);
              setStep(4);
            } else {
              setJobError("Could not generate job variants. Please try again.");
              setLastJobParams(null); // Reset cache on error
            }
            setIsLoadingJobs(false);
          })
          .catch(err => {
            console.error("Error fetching jobs:", err);
            setJobError("Network error. Please try again.");
            setIsLoadingJobs(false);
            setLastJobParams(null);
          });
      }
    } else if (step === 4) {
      if (selectedJobVariant !== null) {
        setStep(5);
      }
    } else if (step === 5) {
      if ((uploadStage === 'uploaded' || analysisDone) && selectedJobVariant !== null) {
        setStep(6);
      }
    } else if (step === 6) {
      if (selectedPersona) {
        // Construct the full context object
        const jobContext = {
          role: roleToPass,
          level: expToPass,
          company: companyToPass,
          variant: jobVariants.find(j => j.id === selectedJobVariant) || {}
        };

        const resumeContext = {
          storageUrl: resumeAnalysisResult?.storageUrl || null,
          weaknesses: resumeAnalysisResult?.weaknesses || []
        };

        // 1. Generate System Prompt (Agent Brain) - BLOCKING
        setIsCreatingSession(true); // "Connecting to Agent..."

        // Prepare data for Prompt Generation
        const promptPayload = {
          company: companyToPass,
          role: roleToPass,
          level: expToPass,
          jobArchetype: jobVariants.find(j => j.id === selectedJobVariant) || {}, // Full variant object
          weaknesses: resumeAnalysisResult?.weaknesses || [],
          persona: selectedPersona.name,
          personaDescription: selectedPersona.description,
          personaStyle: selectedPersona.role // "The Vibe Check Peer" etc as style
        };

        fetch('/api/generate-system-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptPayload)
        })
          .then(res => res.json())
          .then(data => {
            setIsCreatingSession(false);

            if (data.system_prompt) {
              console.log("Agent Connected! Prompt Generated.");

              // 2. Navigate Immediately (Optimistic Persistence in Dashboard)
              navigate('/dashboard', {
                state: {
                  // Context for Saving (in Dashboard)
                  jobContext,
                  resumeContext,
                  persona: selectedPersona,
                  resumeFile, // Pass file for handling in Dashboard

                  // Agent Brain (for VoiceOrb)
                  systemPrompt: data.system_prompt
                }
              });
            } else {
              throw new Error("Failed to generate agent instructions.");
            }
          })
          .catch(err => {
            console.error("Agent Connection Error:", err);
            setIsCreatingSession(false);
            alert("Agent Error: Could not connect to the interviewer. Please try again.");
          });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setShowScroll(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.deltaY > 50 && !isScrolled) {
        setIsScrolled(true);
      } else if (e.deltaY < -50 && isScrolled && step === 1) {
        setIsScrolled(false);
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isScrolled, step]);

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "Which best describes your role?",
          description: "This helps us tailor the right responses for your interview simulation."
        };
      case 2:
        return {
          title: "Choose your experience level",
          description: "We'll adjust the difficulty and expectations based on your level."
        };
      case 3:
        return {
          title: "Choose your target company",
          description: "We'll simulate the specific culture and interview style of this company."
        };
      case 4:
        return {
          title: "Select a job description",
          description: "Different teams have different requirements. Choose the one that matches your target role."
        };
      case 5:
        return {
          title: "Upload your resume",
          description: "Our AI will analyze your experience to identify your kill zones."
        };
      case 6:
        return {
          title: "Select your interviewer",
          description: "Choose the personality that best fits the challenge you need."
        };
      default:
        return { title: "", description: "" };
    }
  };

  const content = getStepContent();

  const roles = [
    "Software Engineer", "Product Manager", "Data Scientist",
    "Designer", "Marketing Specialist"
  ];

  const experienceLevels = [
    "Internship", "Entry Level", "Associate",
    "Manager", "Executive"
  ];

  const companies = [
    { name: "Google", icon: SiGoogle, color: "#4285F4" },
    { name: "Microsoft", icon: FaMicrosoft, color: "#00A4EF" },
    { name: "Amazon", icon: SiAmazon, color: "#FF9900" },
    { name: "Meta", icon: SiMeta, color: "#0668E1" },
    { name: "Netflix", icon: SiNetflix, color: "#E50914" }
  ];

  // Persona Selection State (Step 6)
  const [selectedPersona, setSelectedPersona] = useState(null);

  const handlePersonaSelect = (persona) => {
    setSelectedPersona(persona);
  };

  const isRoleValid = selectedRole || (isOtherSelected && customRole.trim());
  const isExperienceValid = selectedExperience || (isOtherExperienceSelected && customExperience.trim());
  const isCompanyValid = selectedCompany || (isOtherCompanySelected && customCompany.trim());
  const isJobVariantValid = selectedJobVariant !== null;
  const isResumeValid = resumeFile && (uploadStage === 'uploaded' || analysisDone);
  const isPersonaValid = selectedPersona !== null;

  const canProceed = step === 1 ? isRoleValid
    : (step === 2 ? isExperienceValid
      : (step === 3 ? isCompanyValid
        : (step === 4 ? isJobVariantValid
          : (step === 5 ? isResumeValid
            : (step === 6 ? isPersonaValid : false)))));



  return (
    <div className="h-screen bg-white relative overflow-hidden font-sans text-gray-900 flex">
      {/* Left Panel (Hero -> Sidebar) */}
      <motion.div
        layout
        initial={{ width: '100%' }}
        animate={{
          width: isScrolled ? '40%' : '100%',
        }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`relative flex flex-col justify-center transition-colors duration-1000 ${isScrolled ? 'items-start pl-16 bg-gray-50' : 'items-center bg-white'
          }`}
      >
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                           linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>

        {/* Ambient Gradient */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />

        {/* Laser Scan Line */}
        <motion.div
          className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(96,165,250,0.5)] pointer-events-none z-0"
          animate={{ top: ['0%', '100%'] }}
          transition={{
            duration: 12,
            ease: "linear",
            repeat: Infinity
          }}
        />

        {/* Content */}
        <div className={`relative z-10 flex flex-col ${isScrolled ? 'items-start' : 'items-center'} transition-all duration-1000`}>
          {/* Logo */}
          <motion.div
            layout
            className="mb-8"
          >
            <span className="text-blue-600 text-sm font-bold tracking-[0.3em] uppercase border border-blue-100 bg-blue-50 px-4 py-2 rounded-full">
              Sparr AI
            </span>
          </motion.div>

          {/* Hero Text */}
          <motion.h1
            layout
            className={`font-extrabold tracking-tight text-gray-900 transition-all duration-1000 ${isScrolled ? 'text-4xl text-left' : 'text-5xl md:text-7xl lg:text-8xl text-center'
              } mb-6`}
          >
            Survive The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Interview.</span>
          </motion.h1>

          <AnimatePresence>
            {!isScrolled && (
              <motion.div
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <p className="text-gray-500 text-lg md:text-xl text-center max-w-2xl mb-12 leading-relaxed">
                  Train with the only AI interviewer that interrupts you,
                  doubts your skills, and prepares you for reality.
                </p>

                {/* CTA Button */}
                <div>
                  <button
                    onClick={() => navigate('/wizard')}
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gray-900 rounded-full hover:bg-gray-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                  >
                    <span className="relative z-10">Start Sparring</span>
                    <motion.span
                      className="ml-2"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom decoration - Only visible when not scrolled */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2"
            >
              <div className="w-px h-16 bg-gradient-to-b from-transparent via-gray-300 to-gray-400" />

              <div className="h-14 flex items-start justify-center relative w-48">
                <AnimatePresence mode="wait">
                  {!showScroll ? (
                    <motion.span
                      key="text"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.5 }}
                      className="text-xs text-gray-400 tracking-widest uppercase font-semibold absolute top-0"
                    >
                      Prepare for pressure
                    </motion.span>
                  ) : (
                    <motion.div
                      key="scroll"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.5 }}
                      className="flex flex-col items-center gap-2 absolute top-0"
                    >
                      <div className="w-5 h-8 border-2 border-gray-400 rounded-full flex justify-center p-1">
                        <motion.div
                          className="w-1 h-1.5 bg-gray-400 rounded-full"
                          animate={{ y: [0, 6, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 tracking-widest uppercase font-semibold">
                        Scroll Down
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right Panel (Role Selection) */}
      <motion.div
        initial={{ width: '0%' }}
        animate={{
          width: isScrolled ? '60%' : '0%',
        }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white flex flex-col justify-center relative z-20 overflow-hidden h-full"
      >
        <div className="px-24 min-w-[800px]">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: isScrolled ? 1 : 0, x: isScrolled ? 0 : 20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {content.title}
            </h2>
            <p className="text-gray-500 text-lg mb-12">
              {content.description}
            </p>

            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {roles.map((role, index) => (
                    <motion.button
                      key={role}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + (index * 0.1) }}
                      onClick={() => handleRoleSelect(role)}
                      className={`p-6 text-left border rounded-xl transition-all duration-300 group ${selectedRole === role
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-500 hover:shadow-lg hover:bg-blue-50'
                        }`}
                    >
                      <span className={`text-lg font-semibold ${selectedRole === role ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-700'
                        }`}>{role}</span>
                    </motion.button>
                  ))}

                  {/* Other Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + (roles.length * 0.1) }}
                    onClick={handleOtherSelect}
                    className={`p-6 text-left border rounded-xl transition-all duration-300 group ${isOtherSelected
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-500 hover:shadow-lg hover:bg-blue-50'
                      }`}
                  >
                    <span className={`text-lg font-semibold ${isOtherSelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-700'
                      }`}>Other</span>
                  </motion.button>
                </div>

                {/* Custom Role Input */}
                <AnimatePresence>
                  {isOtherSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8 overflow-hidden p-1"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specify your role</label>
                      <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g. AI Researcher"
                        className="w-full p-4 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {experienceLevels.map((level, index) => (
                    <motion.button
                      key={level}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index * 0.1) }}
                      onClick={() => handleExperienceSelect(level)}
                      className={`p-6 text-left border rounded-xl transition-all duration-300 group ${selectedExperience === level
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-500 hover:shadow-lg hover:bg-blue-50'
                        }`}
                    >
                      <span className={`text-lg font-semibold ${selectedExperience === level ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-700'
                        }`}>{level}</span>
                    </motion.button>
                  ))}

                  {/* Other Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (experienceLevels.length * 0.1) }}
                    onClick={handleOtherExperienceSelect}
                    className={`p-6 text-left border rounded-xl transition-all duration-300 group ${isOtherExperienceSelected
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-500 hover:shadow-lg hover:bg-blue-50'
                      }`}
                  >
                    <span className={`text-lg font-semibold ${isOtherExperienceSelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-700'
                      }`}>Other</span>
                  </motion.button>
                </div>

                {/* Custom Experience Input */}
                <AnimatePresence>
                  {isOtherExperienceSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8 overflow-hidden p-1"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specify your level</label>
                      <input
                        type="text"
                        value={customExperience}
                        onChange={(e) => setCustomExperience(e.target.value)}
                        placeholder="e.g. Distinguished Engineer"
                        className="w-full p-4 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {companies.map((company, index) => (
                    <motion.button
                      key={company.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index * 0.1) }}
                      onClick={() => handleCompanySelect(company.name)}
                      style={{
                        '--brand-color': company.color,
                        '--brand-bg': `${company.color}10`,
                        '--brand-ring': `${company.color}30`
                      }}
                      className={`p-4 text-left border rounded-xl transition-all duration-300 group flex items-center gap-4 ${selectedCompany === company.name
                        ? 'border-[var(--brand-color)] bg-[var(--brand-bg)] ring-2 ring-[var(--brand-ring)]'
                        : 'border-gray-200 hover:border-[var(--brand-color)] hover:shadow-lg hover:bg-[var(--brand-bg)]'
                        }`}
                    >
                      <company.icon className={`w-6 h-6 transition-colors ${selectedCompany === company.name ? 'text-[var(--brand-color)]' : 'text-gray-500 group-hover:text-[var(--brand-color)]'
                        }`} />
                      <span className={`text-lg font-semibold transition-colors ${selectedCompany === company.name ? 'text-[var(--brand-color)]' : 'text-gray-700 group-hover:text-[var(--brand-color)]'
                        }`}>{company.name}</span>
                    </motion.button>
                  ))}

                  {/* Other Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (companies.length * 0.1) }}
                    onClick={handleOtherCompanySelect}
                    className={`p-6 text-left border rounded-xl transition-all duration-300 group ${isOtherCompanySelected
                      ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-500 hover:shadow-lg hover:bg-blue-50'
                      }`}
                  >
                    <span className={`text-lg font-semibold ${isOtherCompanySelected ? 'text-blue-700' : 'text-gray-700 group-hover:text-blue-700'
                      }`}>Other</span>
                  </motion.button>
                </div>

                {/* Custom Company Input */}
                <AnimatePresence>
                  {isOtherCompanySelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-8 overflow-hidden p-1"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specify company</label>
                      <input
                        type="text"
                        value={customCompany}
                        onChange={(e) => setCustomCompany(e.target.value)}
                        placeholder="e.g. OpenAI"
                        className="w-full p-4 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {step === 4 && (
              <div className="mb-6 min-h-[180px]">
                {isLoadingJobs && (
                  <div className="flex items-center justify-center h-48">
                    <SparrLoader text="Generating Job Archetypes" />
                  </div>
                )}
                {jobError && (
                  <div className="flex items-center justify-center h-32 text-red-500 font-semibold">{jobError}</div>
                )}
                {!isLoadingJobs && !jobError && jobVariants.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400 font-semibold">No job variants found.</div>
                )}
                {!isLoadingJobs && !jobError && jobVariants.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {jobVariants.map((variant, index) => (
                      <motion.div
                        key={variant.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (index * 0.1) }}
                        onClick={() => setSelectedJobVariant(variant.id || index)}
                        className={`relative p-4 border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col h-80 ${selectedJobVariant === (variant.id || index)
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-500 hover:shadow-lg hover:bg-blue-50'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 leading-tight">{variant.type}</h3>
                            <p className="text-xs text-gray-500 mt-1">{variant.years}</p>
                          </div>
                          {selectedJobVariant === (variant.id || index) && (
                            <span className="text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {variant.skills && variant.skills.map((skill, i) => (
                            <span key={skill + i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="relative flex-grow">
                          <ul className="space-y-1.5 text-xs text-gray-600">
                            {variant.requirements && variant.requirements.slice(0, 3).map((req, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="mt-1 w-1 h-1 bg-blue-400 rounded-full flex-shrink-0" />
                                <span className="line-clamp-2">{req}</span>
                              </li>
                            ))}
                          </ul>
                          {selectedJobVariant !== (variant.id || index) && (
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white backdrop-blur-[1px] flex items-end justify-center pb-2">
                              <span className="text-blue-600 text-xs font-semibold group-hover:scale-105 transition-transform">
                                View details
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="mb-6">
                <div className="min-h-[300px] flex flex-col justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors relative overflow-hidden group">

                  {/* Idle / Uploading State */}
                  {(!isAnalyzing && !analysisDone) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center text-center"
                    >
                      {!resumeFile ? (
                        <>
                          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Upload your Resume</h3>
                          <p className="text-gray-500 mb-6">PDF only, max 10MB</p>
                          <label className="relative cursor-pointer">
                            <span className="px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                              Select PDF
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="application/pdf"
                              onChange={(e) => {
                                setUploadError(null);
                                const f = e.target.files[0];
                                if (!f) return;
                                if (f.type !== 'application/pdf') {
                                  setUploadError('Only PDF files are allowed');
                                  setResumeFile(null);
                                  return;
                                }
                                if (f.size > 10 * 1024 * 1024) {
                                  setUploadError('File too large. Max 10MB');
                                  setResumeFile(null);
                                  return;
                                }
                                setResumeFile(f);
                                setUploadProgress(0);
                                setUploadStage('uploading'); // Auto start upload simulation

                                // Simulate Upload
                                const interval = setInterval(() => {
                                  setUploadProgress(prev => {
                                    if (prev >= 100) {
                                      clearInterval(interval);
                                      setUploadStage('uploaded');
                                      setIsAnalyzing(true); // Auto start analysis

                                      // REAL API CALL
                                      const formData = new FormData();
                                      formData.append('resume', f);
                                      // Construct helpful context from previous steps
                                      const roleStr = isOtherSelected ? customRole : selectedRole;
                                      const expStr = isOtherExperienceSelected ? customExperience : selectedExperience;
                                      const compStr = isOtherCompanySelected ? customCompany : selectedCompany;
                                      // Get job variant details
                                      const jobVar = jobVariants.find(j => j.id === selectedJobVariant);
                                      const jobContext = `${roleStr} (${expStr}) at ${compStr}. Specifics: ${jobVar ? JSON.stringify(jobVar) : 'Standard role'}`;

                                      formData.append('jobContext', jobContext);

                                      fetch('/api/analyze-resume', {
                                        method: 'POST',
                                        body: formData
                                      })
                                        .then(res => res.json())
                                        .then(data => {
                                          // Store analysis results if needed in state
                                          console.log("Analysis Result:", data);
                                          setResumeAnalysisResult(data); // Store for step 6
                                          setIsAnalyzing(false);
                                          setAnalysisDone(true);
                                        })
                                        .catch(err => {
                                          console.error("Analysis failed", err);
                                          // On error, we just proceed as if analysis was general
                                          setIsAnalyzing(false);
                                          setAnalysisDone(true);
                                        });

                                      return 100;
                                    }
                                    return prev + 10; // Faster upload visual
                                  });
                                }, 50);
                              }}
                            />
                          </label>
                          {uploadError && <p className="text-red-500 mt-4 font-medium">{uploadError}</p>}
                        </>
                      ) : (
                        <div className="w-full max-w-md">
                          <div className="flex justify-between text-sm font-semibold mb-2">
                            <span className="text-gray-900">{resumeFile.name}</span>
                            <span className="text-blue-600">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                            <motion.div
                              className="h-full bg-blue-600 rounded-full relative overflow-hidden"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                            >
                              <motion.div
                                className="absolute inset-0 bg-white/30"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              />
                            </motion.div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-right">Uploading...</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Creative Analysis Animation */}
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-white"
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <SparrLoader text="Gemini is analysing your resume..." />
                      </div>
                    </motion.div>
                  )}

                  {/* Analysis Done State */}
                  {analysisDone && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-center py-8"
                    >
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Resume Analyzed</h3>
                      <p className="text-gray-500">We've identified your potential weak points.</p>
                      <button
                        className="mt-4 text-sm text-gray-400 hover:text-red-500 underline"
                        onClick={() => {
                          setResumeFile(null);
                          setUploadStage('idle');
                          setAnalysisDone(false);
                        }}
                      >
                        Upload a different resume
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="mb-6">
                <div className="grid grid-cols-5 gap-3 h-[320px]">
                  {PERSONAS.map((persona, index) => (
                    <motion.div
                      key={persona.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => handlePersonaSelect(persona)}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${selectedPersona?.name === persona.name
                        ? 'ring-4 ring-blue-500 shadow-xl scale-[1.02]'
                        : 'hover:shadow-lg hover:-translate-y-1'
                        }`}
                    >
                      {/* Card Background Image */}
                      <div className="absolute inset-0">
                        <img
                          src={persona.avatar}
                          alt={persona.name}
                          className={`w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500`}
                          style={persona.imgStyle || {}}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90 transition-opacity duration-300 ${selectedPersona?.name === persona.name ? 'opacity-80' : 'group-hover:opacity-70'
                          }`} />
                      </div>

                      {/* Card Content (Name & Role) */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                        <h3 className="text-xl font-bold mb-1">{persona.name}</h3>
                        <p className="text-xs text-blue-200 font-semibold tracking-wide uppercase h-8 line-clamp-2">
                          {persona.role}
                        </p>
                      </div>

                      {/* Selected Indicator */}
                      {selectedPersona?.name === persona.name && (
                        <div className="absolute top-3 right-3 bg-blue-500 text-white p-1 rounded-full z-20 shadow-lg">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      {/* Floating Detail Card (Hover) */}
                      <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center z-20">
                        <div className="mb-4">
                          <h4 className="text-lg font-bold text-white mb-2">{persona.role}</h4>
                          <p className="text-xs text-gray-300 leading-relaxed font-light">
                            {persona.description}
                          </p>
                        </div>

                        {/* Language Flags with Hover Tooltip */}
                        <div className="mt-auto relative group/lang">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Speaks</p>
                          <div className="flex items-center -space-x-2 cursor-pointer">
                            {persona.languages.slice(0, 3).map((lang, i) => (
                              <img
                                key={lang}
                                src={`https://flagcdn.com/w40/${lang}.png`}
                                alt={lang}
                                className="w-6 h-6 rounded-full border-2 border-gray-800 object-cover"
                              />
                            ))}
                            {persona.languages.length > 3 && (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-[8px] text-white font-bold z-10">
                                +{persona.languages.length - 3}
                              </div>
                            )}
                          </div>

                          {/* Language Tooltip */}
                          <div className="absolute bottom-full left-0 w-max mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-300 transform translate-y-2 group-hover/lang:translate-y-0 z-30 overflow-hidden">
                            <div className="p-3">
                              <div className="space-y-1">
                                {persona.languages.map((lang) => (
                                  <div key={lang} className="text-xs text-gray-400 hover:text-white transition-colors">
                                    {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}


            {/* Footer with Progress and Next */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isScrolled ? 1 : 0 }}
              transition={{ delay: 1 }}
              className="mt-auto pt-8 border-t border-gray-100"
            >
              <div className="w-full h-1 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: step === 1 ? (isRoleValid ? '16.6%' : '0%')
                      : (step === 2 ? (isExperienceValid ? '33.3%' : '16.6%')
                        : (step === 3 ? (isCompanyValid ? '50%' : '33.3%')
                          : (step === 4 ? (isJobVariantValid ? '66.6%' : '50%')
                            : (step === 5 ? (isResumeValid ? '83.3%' : '66.6%')
                              : (step === 6 ? (isPersonaValid ? '100%' : '83.3%') : '0%')))))
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="flex justify-between items-center">
                {step > 1 && !isCreatingSession ? (
                  <button
                    onClick={handleBack}
                    className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back
                  </button>
                ) : <div />}

                {step === 6 ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    disabled={!isPersonaValid || isCreatingSession}
                    className={`px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center ${isPersonaValid && !isCreatingSession
                      ? 'bg-blue-600 hover:bg-blue-500 shadow-lg'
                      : 'bg-gray-300 cursor-not-allowed'
                      }`}
                  >
                    {isCreatingSession ? (
                      <>
                        <SparrLoader text="" className="w-5 h-5 mr-2" />
                        Connecting to Agent...
                      </>
                    ) : (
                      "Start Interview"
                    )}
                  </motion.button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className={`px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 ${canProceed
                      ? 'bg-blue-600 hover:bg-blue-500 transform hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                      : 'bg-gray-300 cursor-not-allowed'
                      }`}
                  >
                    Next Step
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div >
    </div >
  );
};

export default LandingPage;
