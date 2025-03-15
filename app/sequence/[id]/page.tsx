"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingSpinner } from "@/components/ui-enhanced/loading-spinner"
import { useToast } from "@/components/ui-enhanced/toast-provider"
import { Sequence, SequencePhase, SequencePose } from "@/types/sequence"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, ChevronLeft, Plus, Pencil, Download } from "lucide-react"
import { PoseSidebar } from "./components/pose-sidebar"
import HandDrawnSpiral from "@/components/hand-drawn-spiral"

interface PoseData {
  id: string
  name: string
  sanskrit_name: string | null
  category: string | null
  difficulty: string | null
  side_option: boolean
}

export default function SequenceEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const sequenceId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [sequence, setSequence] = useState<Sequence | null>(null)
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedPose, setDraggedPose] = useState<SequencePose | null>(null)
  const [dragOverPhaseId, setDragOverPhaseId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [tempSettings, setTempSettings] = useState<{
    name: string;
    description: string;
    duration_minutes: number;
    difficulty: string;
    style: string;
    focus: string;
  } | null>(null)
  
  // Fetch sequence data from localStorage (beta approach)
  useEffect(() => {
    try {
      const sequencesJson = localStorage.getItem("generatedSequences")
      
      if (sequencesJson) {
        const sequences = JSON.parse(sequencesJson)
        const targetSequence = sequences.find((seq: Sequence) => seq.id === sequenceId)
        
        if (targetSequence) {
          setSequence(targetSequence)
          // Initially expand all phases
          setExpandedPhases(targetSequence.phases.map((phase: SequencePhase) => phase.id))
        } else {
          showToast("Sequence not found", "error")
        }
      } else {
        // For demo purposes in beta, load a sample sequence
        loadSampleSequence()
      }
    } catch (error) {
      console.error("Error loading sequence:", error)
      showToast("Failed to load sequence", "error")
      loadSampleSequence() // Fallback to sample for beta
    } finally {
      setIsLoading(false)
    }
  }, [sequenceId, showToast])
  
  // Beta feature - load a sample sequence if none found
  const loadSampleSequence = () => {
    // Generate a simple sample sequence for demonstration
    const sampleSequence: Sequence = {
      id: sequenceId,
      name: "Sample Sequence",
      description: "This is a sample sequence for demonstration",
      duration_minutes: 30,
      difficulty: "intermediate",
      style: "vinyasa",
      focus: "full body",
      phases: [
        {
          id: "phase1",
          name: "Warm Up",
          description: "Gentle poses to warm up the body",
          poses: [
            {
              id: "pose1",
              pose_id: "pose1",
              name: "Mountain Pose",
              sanskrit_name: "Tadasana",
              duration_seconds: 30,
              position: 1,
              image_url: "/poses/mountain.jpg"
            },
            {
              id: "pose2",
              pose_id: "pose2",
              name: "Standing Forward Fold",
              sanskrit_name: "Uttanasana",
              duration_seconds: 45,
              position: 2,
              image_url: "/poses/forward-fold.jpg"
            }
          ]
        },
        {
          id: "phase2",
          name: "Main Sequence",
          description: "Core practice poses",
          poses: [
            {
              id: "pose3",
              pose_id: "pose3",
              name: "Warrior I",
              sanskrit_name: "Virabhadrasana I",
              duration_seconds: 60,
              side: "right",
              position: 3,
              image_url: "/poses/warrior-1.jpg"
            },
            {
              id: "pose4",
              pose_id: "pose3",
              name: "Warrior I",
              sanskrit_name: "Virabhadrasana I",
              duration_seconds: 60,
              side: "left",
              position: 4,
              image_url: "/poses/warrior-1.jpg"
            },
            {
              id: "pose5",
              pose_id: "pose4",
              name: "Triangle Pose",
              sanskrit_name: "Trikonasana",
              duration_seconds: 45,
              side: "right",
              position: 5,
              image_url: "/poses/triangle.jpg"
            },
            {
              id: "pose6",
              pose_id: "pose4",
              name: "Triangle Pose",
              sanskrit_name: "Trikonasana",
              duration_seconds: 45,
              side: "left",
              position: 6,
              image_url: "/poses/triangle.jpg"
            }
          ]
        },
        {
          id: "phase3",
          name: "Cool Down",
          description: "Gentle poses to end practice",
          poses: [
            {
              id: "pose7",
              pose_id: "pose5",
              name: "Seated Forward Bend",
              sanskrit_name: "Paschimottanasana",
              duration_seconds: 60,
              position: 7,
              image_url: "/poses/seated-forward-bend.jpg"
            },
            {
              id: "pose8",
              pose_id: "pose6",
              name: "Corpse Pose",
              sanskrit_name: "Savasana",
              duration_seconds: 180,
              position: 8,
              image_url: "/poses/savasana.jpg"
            }
          ]
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false
    }
    
    setSequence(sampleSequence)
    
    // Store in localStorage for demo purposes
    const sequencesJson = localStorage.getItem("generatedSequences")
    const sequences = sequencesJson ? JSON.parse(sequencesJson) : []
    sequences.push(sampleSequence)
    localStorage.setItem("generatedSequences", JSON.stringify(sequences))
  }
  
  // Handler for updating pose duration
  const handleDurationChange = (poseId: string, newDuration: number) => {
    if (!sequence) return

    const updatedPhases = sequence.phases.map(phase => ({
      ...phase,
      poses: phase.poses.map(pose => {
        if (pose.id === poseId) {
          return {
            ...pose,
            duration_seconds: newDuration
          }
        }
        return pose
      })
    }))

    setSequence({
      ...sequence,
      phases: updatedPhases
    })
  }
  
  // Handler for toggling pose sides
  const togglePoseSide = (poseId: string) => {
    if (!sequence) return

    const updatedPhases = sequence.phases.map(phase => ({
      ...phase,
      poses: phase.poses.map(pose => {
        if (pose.id === poseId) {
          return {
            ...pose,
            side: pose.side === "left" ? ("right" as const) : ("left" as const)
          }
        }
        return pose
      })
    }))

    setSequence({
      ...sequence,
      phases: updatedPhases
    })
  }
  
  // Add effect to track changes
  useEffect(() => {
    if (sequence) {
      setHasUnsavedChanges(true)
    }
  }, [sequence])

  // Add effect to handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleExit = () => {
    if (hasUnsavedChanges) {
      setIsExiting(true)
    } else {
      router.push('/generate/beta')
    }
  }

  const handleSave = async () => {
    if (!sequence) return

    try {
      const sequencesJson = localStorage.getItem("generatedSequences")
      const sequences = sequencesJson ? JSON.parse(sequencesJson) : []
      
      const updatedSequences = sequences.map((seq: Sequence) => 
        seq.id === sequence.id ? sequence : seq
      )
      
      localStorage.setItem("generatedSequences", JSON.stringify(updatedSequences))
      setHasUnsavedChanges(false)
      showToast("Sequence saved successfully", "success")

      // If we were exiting, now we can safely exit
      if (isExiting) {
        router.push('/generate/beta')
      }
    } catch (error) {
      console.error("Error saving sequence:", error)
      showToast("Failed to save sequence", "error")
    }
  }
  
  const togglePhaseExpansion = (phaseId: string) => {
    setExpandedPhases(prev => 
      prev.includes(phaseId) 
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    )
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, phaseId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPhaseId(phaseId)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPhaseId(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, phaseId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverPhaseId(null)

    try {
      const poseData = JSON.parse(e.dataTransfer.getData("pose")) as PoseData
      if (!sequence) return

      const updatedPhases = sequence.phases.map((phase: SequencePhase) => {
        if (phase.id === phaseId) {
          const newPose: SequencePose = {
            id: `${poseData.id}-${Date.now()}`,
            pose_id: poseData.id,
            name: poseData.name,
            sanskrit_name: poseData.sanskrit_name || undefined,
            duration_seconds: 30,
            position: phase.poses.length + 1,
            side: poseData.side_option ? "left" : null
          }
          
          return {
            ...phase,
            poses: [...phase.poses, newPose]
          }
        }
        return phase
      })

      setSequence({
        ...sequence,
        phases: updatedPhases
      })
    } catch (error) {
      console.error("Error handling pose drop:", error)
    }
  }

  const handlePoseSelect = (poseData: PoseData) => {
    if (!sequence) return

    const selectedPhase = sequence.phases[selectedPhaseIndex]
    const updatedPhases = sequence.phases.map((phase: SequencePhase, index: number) => {
      if (index === selectedPhaseIndex) {
        const newPose: SequencePose = {
          id: `${poseData.id}-${Date.now()}`,
          pose_id: poseData.id,
          name: poseData.name,
          sanskrit_name: poseData.sanskrit_name || undefined,
          duration_seconds: 30,
          position: phase.poses.length + 1,
          side: poseData.side_option ? "left" : null
        }

        return {
          ...phase,
          poses: [...phase.poses, newPose]
        }
      }
      return phase
    })

    setSequence({
      ...sequence,
      phases: updatedPhases
    })
  }
  
  // Initialize temp settings when sequence loads
  useEffect(() => {
    if (sequence) {
      setTempSettings({
        name: sequence.name,
        description: sequence.description || "",
        duration_minutes: sequence.duration_minutes,
        difficulty: sequence.difficulty,
        style: sequence.style,
        focus: sequence.focus
      });
    }
  }, [sequence]);

  const handleEditSettings = () => {
    if (!isEditingSettings && sequence) {
      setTempSettings({
        name: sequence.name,
        description: sequence.description || "",
        duration_minutes: sequence.duration_minutes,
        difficulty: sequence.difficulty,
        style: sequence.style,
        focus: sequence.focus
      });
    }
    setIsEditingSettings(!isEditingSettings);
  }

  const handleSettingsSave = () => {
    if (!sequence || !tempSettings) return;
    
    setSequence({
      ...sequence,
      name: tempSettings.name,
      description: tempSettings.description,
      duration_minutes: tempSettings.duration_minutes,
      difficulty: tempSettings.difficulty,
      style: tempSettings.style,
      focus: tempSettings.focus
    });
    
    setIsEditingSettings(false);
    showToast("Sequence settings updated", "success");
  }

  const handleSettingsCancel = () => {
    if (sequence) {
      setTempSettings({
        name: sequence.name,
        description: sequence.description || "",
        duration_minutes: sequence.duration_minutes,
        difficulty: sequence.difficulty,
        style: sequence.style,
        focus: sequence.focus
      });
    }
    setIsEditingSettings(false);
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }
  
  if (!sequence) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-xl font-semibold mb-4">Sequence Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We couldn't find the sequence you're looking for.
        </p>
        <a 
          href="/generate/beta"
          className="px-4 py-2 bg-vibrant-blue text-white rounded-md hover:bg-vibrant-blue/90 transition-colors"
        >
          Generate New Sequence
        </a>
      </div>
    )
  }
  
  const selectedPhase = sequence.phases[selectedPhaseIndex]
  const totalDuration = sequence.phases.reduce(
    (total, phase) => total + phase.poses.reduce(
      (phaseTotal, pose) => phaseTotal + pose.duration_seconds, 0
    ), 0
  ) / 60
  
  return (
    <div className="fixed inset-0 bg-beige dark:bg-dark-gray flex">
      {/* Left Sidebar - Sequence Navigator */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-warm-white dark:bg-deep-charcoal-light border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-20 flex flex-col",
        isLeftSidebarOpen ? "w-64" : "w-12"
      )}>
        <div className={cn(
          "p-4 flex items-center",
          isLeftSidebarOpen ? "justify-between" : "justify-center"
        )}>
          <div className="w-48 overflow-hidden transition-all duration-300" style={{ 
            maxWidth: isLeftSidebarOpen ? '12rem' : '0',
            opacity: isLeftSidebarOpen ? 1 : 0
          }}>
            <h2 className="font-semibold whitespace-nowrap">
              Sequence Navigator
            </h2>
          </div>
          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex-shrink-0"
          >
            {isLeftSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <div className="overflow-hidden transition-all duration-300 flex-1" style={{
          maxWidth: isLeftSidebarOpen ? '16rem' : '0',
          opacity: isLeftSidebarOpen ? 1 : 0
        }}>
          <div className="px-2 py-4">
            {sequence.phases.map((phase, index) => (
              <button
                key={phase.id}
                onClick={() => setSelectedPhaseIndex(index)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md mb-2 transition-colors whitespace-nowrap",
                  selectedPhaseIndex === index 
                    ? "bg-vibrant-blue/10 text-vibrant-blue"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {phase.name}
              </button>
            ))}
          </div>
        </div>

        {/* Logo at bottom of sidebar */}
        <div className={cn(
          "p-4 border-t border-gray-200 dark:border-gray-700 mt-auto",
          isLeftSidebarOpen ? "flex items-center" : "flex justify-center"
        )}>
          <HandDrawnSpiral 
            width={24} 
            height={24} 
            color="hsl(var(--primary))" 
            strokeWidth={1.5} 
            className="flex-shrink-0"
          />
          <div className="overflow-hidden transition-all duration-300 ml-2" style={{ 
            maxWidth: isLeftSidebarOpen ? '8rem' : '0',
            opacity: isLeftSidebarOpen ? 1 : 0
          }}>
            <span className="text-base font-medium whitespace-nowrap">Sequence</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 h-screen overflow-y-auto",
        isLeftSidebarOpen ? "ml-64" : "ml-12",
        isRightSidebarOpen ? "mr-80" : "mr-12"
      )}>
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-warm-white dark:bg-deep-charcoal-light border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            {/* Left: Exit Button */}
            <div>
              <button
                onClick={handleExit}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Exit Editor
              </button>
            </div>

            {/* Center: Title with Edit Icon */}
            <div className="flex items-center gap-2">
              {isEditingSettings ? (
                <input
                  type="text"
                  value={tempSettings?.name || ''}
                  onChange={(e) => setTempSettings({...tempSettings!, name: e.target.value})}
                  className="text-xl font-semibold bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-vibrant-blue px-1"
                />
              ) : (
                <h1 className="text-xl font-semibold">{sequence.name}</h1>
              )}
              <button 
                onClick={handleEditSettings}
                className={cn(
                  "p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md",
                  isEditingSettings && "bg-vibrant-blue/10 text-vibrant-blue"
                )}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            {/* Right: Export and Save Buttons */}
            <div className="flex items-center space-x-3">
              {isEditingSettings ? (
                <>
                  <button
                    onClick={handleSettingsCancel}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSettingsSave}
                    className="px-4 py-2 bg-vibrant-blue text-white rounded-md hover:bg-vibrant-blue/90 transition-colors"
                  >
                    Save Settings
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {/* TODO: Implement export functionality */}}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    onClick={handleSave}
                    className={cn(
                      "px-4 py-2 bg-vibrant-blue text-white rounded-md hover:bg-vibrant-blue/90 transition-colors flex items-center gap-2",
                      hasUnsavedChanges && "animate-pulse"
                    )}
                  >
                    {isExiting ? "Save & Exit" : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sequence Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400">Duration</div>
              {isEditingSettings ? (
                <div>
                  <input
                    type="number"
                    min="1"
                    value={tempSettings?.duration_minutes || 0}
                    onChange={(e) => setTempSettings({...tempSettings!, duration_minutes: parseInt(e.target.value) || 1})}
                    className="text-xl font-semibold w-full bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-vibrant-blue"
                  />
                </div>
              ) : (
                <div className="text-xl font-semibold">{totalDuration.toFixed(1)} min</div>
              )}
            </div>
            <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400">Difficulty</div>
              {isEditingSettings ? (
                <select
                  value={tempSettings?.difficulty || ''}
                  onChange={(e) => setTempSettings({...tempSettings!, difficulty: e.target.value})}
                  className="text-xl font-semibold w-full bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-vibrant-blue capitalize"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              ) : (
                <div className="text-xl font-semibold capitalize">{sequence.difficulty}</div>
              )}
            </div>
            <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400">Style</div>
              {isEditingSettings ? (
                <select
                  value={tempSettings?.style || ''}
                  onChange={(e) => setTempSettings({...tempSettings!, style: e.target.value})}
                  className="text-xl font-semibold w-full bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-vibrant-blue capitalize"
                >
                  <option value="vinyasa">Vinyasa</option>
                  <option value="hatha">Hatha</option>
                  <option value="yin">Yin</option>
                  <option value="power">Power</option>
                  <option value="restorative">Restorative</option>
                </select>
              ) : (
                <div className="text-xl font-semibold capitalize">{sequence.style}</div>
              )}
            </div>
            <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400">Focus</div>
              {isEditingSettings ? (
                <select
                  value={tempSettings?.focus || ''}
                  onChange={(e) => setTempSettings({...tempSettings!, focus: e.target.value})}
                  className="text-xl font-semibold w-full bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-vibrant-blue capitalize"
                >
                  <option value="full body">Full Body</option>
                  <option value="core">Core</option>
                  <option value="upper body">Upper Body</option>
                  <option value="lower body">Lower Body</option>
                  <option value="balance">Balance</option>
                  <option value="flexibility">Flexibility</option>
                  <option value="strength">Strength</option>
                  <option value="relaxation">Relaxation</option>
                </select>
              ) : (
                <div className="text-xl font-semibold capitalize">{sequence.focus}</div>
              )}
            </div>
          </div>

          {isEditingSettings && (
            <div className="bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm mb-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</div>
              <textarea
                value={tempSettings?.description || ''}
                onChange={(e) => setTempSettings({...tempSettings!, description: e.target.value})}
                className="w-full p-2 bg-transparent border border-dashed border-gray-400 focus:outline-none focus:border-vibrant-blue rounded-md min-h-[80px]"
                placeholder="Add a description for your sequence..."
              />
            </div>
          )}

          {/* Phases */}
          <div className="space-y-6">
            {sequence.phases.map((phase, phaseIndex) => (
              <div
                key={phase.id}
                className={cn(
                  "bg-warm-white dark:bg-deep-charcoal-light rounded-lg shadow-sm overflow-hidden",
                  dragOverPhaseId === phase.id && "ring-2 ring-vibrant-blue"
                )}
              >
                <button
                  onClick={() => togglePhaseExpansion(phase.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary mr-3">
                      {phaseIndex + 1}
                    </div>
                    <h3 className="text-lg font-medium">{phase.name}</h3>
                  </div>
                  {expandedPhases.includes(phase.id) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                {expandedPhases.includes(phase.id) && (
                  <div 
                    className="px-6 pb-4"
                    onDragOver={(e) => handleDragOver(e, phase.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, phase.id)}
                  >
                    <p className="text-gray-600 dark:text-gray-400 mb-4 ml-11">
                      {phase.description}
                    </p>

                    <div className="space-y-3 ml-11">
                      {phase.poses.map((pose, index) => (
                        <motion.div
                          key={pose.id}
                          layoutId={pose.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 500, 
                            damping: 30,
                            delay: index * 0.05 
                          }}
                          className={cn(
                            "bg-warm-white dark:bg-deep-charcoal-light rounded-lg shadow-sm overflow-hidden",
                            isDragging && draggedPose?.id === pose.id ? "border-2 border-vibrant-blue" : ""
                          )}
                          drag="y"
                          dragConstraints={{ top: 0, bottom: 0 }}
                          dragElastic={0.1}
                          onDragStart={() => {
                            setIsDragging(true)
                            setDraggedPose(pose)
                          }}
                          onDragEnd={() => {
                            setIsDragging(false)
                            setDraggedPose(null)
                          }}
                        >
                          <div className="flex items-stretch">
                            {/* Drag Handle */}
                            <div className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center px-3 cursor-move">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            
                            {/* Pose Info */}
                            <div className="flex-grow p-4 flex justify-between items-center">
                              <div>
                                <div className="font-medium flex items-center">
                                  {pose.name}
                                  {pose.side && (
                                    <button 
                                      onClick={() => togglePoseSide(pose.id)}
                                      className={cn(
                                        "ml-2 px-2 py-0.5 text-xs rounded-full",
                                        pose.side === "left" 
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" 
                                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                                      )}
                                    >
                                      {pose.side === "left" ? "Left" : "Right"}
                                    </button>
                                  )}
                                </div>
                                {pose.sanskrit_name && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    {pose.sanskrit_name}
                                  </div>
                                )}
                              </div>
                              
                              {/* Duration Selector */}
                              <div className="flex items-center space-x-3">
                                <button 
                                  onClick={() => handleDurationChange(pose.id, Math.max(5, pose.duration_seconds - 5))}
                                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                
                                <div className="w-16 text-center font-medium">
                                  {Math.floor(pose.duration_seconds / 60)}:{(pose.duration_seconds % 60).toString().padStart(2, '0')}
                                </div>
                                
                                <button 
                                  onClick={() => handleDurationChange(pose.id, pose.duration_seconds + 5)}
                                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Right Sidebar - Pose Library */}
      <div className={cn(
        "fixed right-0 top-0 h-full bg-warm-white dark:bg-deep-charcoal-light border-l border-gray-200 dark:border-gray-700 transition-all duration-300 z-20",
        isRightSidebarOpen ? "w-80" : "w-12"
      )}>
        <div className={cn(
          "p-4 flex items-center",
          isRightSidebarOpen ? "justify-between" : "justify-center"
        )}>
          <div className="w-48 overflow-hidden transition-all duration-300" style={{ 
            maxWidth: isRightSidebarOpen ? '12rem' : '0',
            opacity: isRightSidebarOpen ? 1 : 0
          }}>
            <h2 className="font-semibold whitespace-nowrap">
              Add Poses
            </h2>
          </div>
          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex-shrink-0"
          >
            {isRightSidebarOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        
        <div className="overflow-hidden transition-all duration-300" style={{
          maxWidth: isRightSidebarOpen ? '20rem' : '0',
          opacity: isRightSidebarOpen ? 1 : 0
        }}>
          <div className="p-4">
            <PoseSidebar onPoseSelect={handlePoseSelect} />
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {isExiting && hasUnsavedChanges && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-deep-charcoal-light p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Unsaved Changes</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have unsaved changes. Would you like to save them before exiting?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsExiting(false)
                  setHasUnsavedChanges(false)
                  router.push('/generate/beta')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Don't Save
              </button>
              <button
                onClick={() => handleSave()}
                className="px-4 py-2 bg-vibrant-blue text-white rounded-md hover:bg-vibrant-blue/90 transition-colors"
              >
                Save & Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
