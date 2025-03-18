"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, notFound } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingSpinner } from "@/components/ui-enhanced/loading-spinner"
import { useToast } from "@/components/ui-enhanced/toast-provider"
import { Sequence, SequencePhase, SequencePose } from "@/types/sequence"
import { cn } from "@/lib/utils"
import { Skeleton, PoseSkeleton } from "@/components/ui-enhanced/skeleton"
import { ChevronDown, ChevronRight, ChevronLeft, Plus, Pencil, Download, RotateCcw, RotateCw, History, X, Save } from "lucide-react"
import { PoseSidebar } from "./components/pose-sidebar"
import HandDrawnSpiral from "@/components/hand-drawn-spiral"
import { SortablePoseItem } from "./components/sortable-pose-item"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay 
} from "@dnd-kit/core"
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable"
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers"

interface PoseData {
  id: string
  name: string
  sanskrit_name: string | null
  category: string | null
  difficulty: string | null
  side_option: string | null
}

export default function SequenceEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const sequenceId = params?.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [isPosesLoading, setIsPosesLoading] = useState(false)
  const [sequence, setSequence] = useState<Sequence | null>(null)
  const [structureLoaded, setStructureLoaded] = useState(false)
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState(0)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [draggedPose, setDraggedPose] = useState<SequencePose | null>(null)
  const [dragOverPhaseId, setDragOverPhaseId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isEditingSettings, setIsEditingSettings] = useState(false)
  const [tempSettings, setTempSettings] = useState<{
    name: string;
    description: string;
    duration_minutes: number;
    difficulty: string;
    style: string;
    focus: string;
  } | null>(null)
  const [historyStack, setHistoryStack] = useState<Array<{
    sequence: Sequence;
    action: string;
    timestamp: number;
  }>>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState<'phases' | 'history'>('phases')
  const [isHistoryDiscardDialogOpen, setIsHistoryDiscardDialogOpen] = useState(false)
  const [pendingHistoryAction, setPendingHistoryAction] = useState<{
    sequence: Sequence;
    action: string;
  } | null>(null)
  
  // Refs
  const mainContentRef = useRef<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const phaseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isPoseGenerationInProgress = useRef(false);
  
  // Add sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Add state for active drag
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  
  // Add state for side selection modal
  const [pendingPoseWithSideOption, setPendingPoseWithSideOption] = useState<{
    poseData: PoseData;
    phaseId: string;
    targetPoseId?: string;
  } | null>(null);
  
  // Fetch sequence data from localStorage (beta approach)
  useEffect(() => {
    if (!sequenceId) {
      router.push('/')
      return
    }

    try {
      const sequencesJson = localStorage.getItem("generatedSequences")
      if (!sequencesJson) {
        // If no sequences found, redirect to home
        router.push('/')
        return
      }

      const sequences = JSON.parse(sequencesJson)
      const foundSequence = sequences.find((seq: Sequence) => seq.id === sequenceId)
      
      if (!foundSequence) {
        // If sequence not found, redirect to home
        router.push('/')
        return
      }
      
      setSequence(foundSequence)
      
      // Expand all phases by default instead of just the first one
      if (foundSequence.phases && foundSequence.phases.length > 0) {
        setExpandedPhases(foundSequence.phases.map((phase: SequencePhase) => phase.id))
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading sequence:", error)
      showToast("Failed to load sequence", "error")
      router.push('/')
    }
  }, [sequenceId, router, showToast])
  
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
  
  // Save state to history
  const saveToHistory = (newSequence: Sequence, action: string) => {
    // Create a deep copy to avoid reference issues
    const sequenceCopy = JSON.parse(JSON.stringify(newSequence))
    
    // If we're not at the end of the history stack, we need to confirm
    // that the user wants to discard future history states
    if (currentHistoryIndex < historyStack.length - 1) {
      // Store the pending action
      setPendingHistoryAction({
        sequence: sequenceCopy,
        action
      })
      
      // Show confirmation dialog
      setIsHistoryDiscardDialogOpen(true)
      return
    }
    
    // Normal case - adding to the end of history
    const historyEntry = {
      sequence: sequenceCopy,
      action,
      timestamp: Date.now()
    }
    
    setHistoryStack(prev => [...prev, historyEntry])
    setCurrentHistoryIndex(prev => prev + 1)
  }
  
  // Function to confirm discarding future history
  const confirmDiscardHistory = () => {
    if (!pendingHistoryAction) return
    
    // Remove all future states
    const updatedStack = historyStack.slice(0, currentHistoryIndex + 1)
    
    // Add the new state
    const historyEntry = {
      sequence: pendingHistoryAction.sequence,
      action: pendingHistoryAction.action,
      timestamp: Date.now()
    }
    
    // Update the history stack and current index
    setHistoryStack([...updatedStack, historyEntry])
    setCurrentHistoryIndex(updatedStack.length)
    
    // Also update the sequence state to reflect the change
    setSequence(pendingHistoryAction.sequence)
    
    // Mark that there are unsaved changes
    setHasUnsavedChanges(true)
    
    // Clear the dialog and pending action
    setIsHistoryDiscardDialogOpen(false)
    setPendingHistoryAction(null)
  }
  
  // Function to cancel the discard operation
  const cancelDiscardHistory = () => {
    setIsHistoryDiscardDialogOpen(false)
    setPendingHistoryAction(null)
  }
  
  // Navigate through history
  const navigateHistory = (index: number) => {
    if (index >= 0 && index < historyStack.length) {
      // Retrieve sequence state from history
      const historicalState = historyStack[index]
      const historicalSequence = JSON.parse(JSON.stringify(historicalState.sequence))
      setSequence(historicalSequence)
      setCurrentHistoryIndex(index)
    }
  }
  
  // Undo last change
  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      navigateHistory(currentHistoryIndex - 1)
    }
  }
  
  // Redo previously undone change
  const handleRedo = () => {
    if (currentHistoryIndex < historyStack.length - 1) {
      navigateHistory(currentHistoryIndex + 1)
    }
  }
  
  // Initialize history when sequence first loads
  useEffect(() => {
    if (sequence && historyStack.length === 0) {
      // Create a deep copy to avoid reference issues
      const sequenceCopy = JSON.parse(JSON.stringify(sequence))
      setHistoryStack([{
        sequence: sequenceCopy,
        action: "Initial state",
        timestamp: Date.now()
      }])
      setCurrentHistoryIndex(0)
    }
  }, [sequence, historyStack.length])
  
  // Add keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if focus is in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentHistoryIndex, historyStack.length]);
  
  // Handler for updating pose duration
  const handleDurationChange = (poseId: string, newDuration: number) => {
    if (!sequence) return
    
    // Find the pose to include its name in the history action
    let poseName = "";
    sequence.phases.forEach(phase => {
      phase.poses.forEach(pose => {
        if (pose.id === poseId) {
          poseName = pose.name;
        }
      });
    });

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

    const updatedSequence = {
      ...sequence,
      phases: updatedPhases
    }
    
    setSequence(updatedSequence)
    saveToHistory(updatedSequence, `Changed duration for "${poseName}"`)
  }
  
  // Toggle pose sides
  const togglePoseSide = (poseId: string) => {
    if (!sequence) return
    
    // Find the pose to include its name in the history action
    let poseName = "";
    let currentSide = "";
    sequence.phases.forEach(phase => {
      phase.poses.forEach(pose => {
        if (pose.id === poseId) {
          poseName = pose.name;
          currentSide = pose.side === "left" ? "right" : "left";
        }
      });
    });

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

    const updatedSequence = {
      ...sequence,
      phases: updatedPhases
    }
    
    setSequence(updatedSequence)
    saveToHistory(updatedSequence, `Changed "${poseName}" to ${currentSide} side`)
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
      router.push('/')
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
      
      // Add save action to history
      saveToHistory(sequence, "Saved sequence")

      // If we were exiting, now we can safely exit
      if (isExiting) {
        router.push('/')
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

  // Legacy versions for standard HTML drag events
  const handleDragOverLegacy = (e: React.DragEvent<HTMLDivElement>, phaseId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPhaseId(phaseId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPhaseId(null);
  };

  // DndKit event handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the phase this pose belongs to
    if (sequence) {
      for (const phase of sequence.phases) {
        if (phase.poses.some(pose => pose.id === active.id)) {
          setActivePhaseId(phase.id);
          break;
        }
      }
    }
    
    setIsDragging(true);
    
    // Find the pose that's being dragged
    const draggedPose = findPoseById(active.id as string);
    setDraggedPose(draggedPose);
  };
  
  const handleDndDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDragOverPhaseId(null);
      return;
    }
    
    // Find which phase the over item belongs to
    let overPhaseId = null;
    
    // If over element is a pose, find its phase
    if (sequence) {
      for (const phase of sequence.phases) {
        // If directly over a pose, check that
        if (phase.poses.some(pose => pose.id === over.id)) {
          overPhaseId = phase.id;
          break;
        }
      }
      
      // If we found the over phase, highlight it
      if (overPhaseId) {
        setDragOverPhaseId(overPhaseId);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActivePhaseId(null);
    setIsDragging(false);
    setDraggedPose(null);
    setDragOverPhaseId(null);
    
    if (!over || !sequence) return;
    
    // Find the phase IDs for the active and over items
    let sourcePhaseId: string | null = null;
    let destinationPhaseId: string | null = null;
    let sourcePhaseIndex = -1;
    let destinationPhaseIndex = -1;
    let sourcePoseIndex = -1;
    let destinationPoseIndex = -1;
    
    // Find the source phase and pose indices
    sequence.phases.forEach((phase, phaseIndex) => {
      const poseIndex = phase.poses.findIndex(p => p.id === active.id);
      if (poseIndex !== -1) {
        sourcePhaseId = phase.id;
        sourcePhaseIndex = phaseIndex;
        sourcePoseIndex = poseIndex;
      }
    });
    
    // Find the destination phase and pose indices
    sequence.phases.forEach((phase, phaseIndex) => {
      const poseIndex = phase.poses.findIndex(p => p.id === over.id);
      if (poseIndex !== -1) {
        destinationPhaseId = phase.id;
        destinationPhaseIndex = phaseIndex;
        destinationPoseIndex = poseIndex;
      }
    });
    
    // If we couldn't find the source, do nothing
    if (sourcePhaseId === null || sourcePhaseIndex === -1 || sourcePoseIndex === -1) {
      return;
    }
    
    // If destination is not found, it might be an empty phase or something else, so don't handle that case
    if (destinationPhaseId === null || destinationPhaseIndex === -1 || destinationPoseIndex === -1) {
      return;
    }
    
    // Clone the sequence to avoid direct state mutations
    const updatedSequence = JSON.parse(JSON.stringify(sequence)) as Sequence;
    
    // Same phase, just reorder
    if (sourcePhaseId === destinationPhaseId) {
      const phase = updatedSequence.phases[sourcePhaseIndex];
      
      // Use arrayMove to reorder the poses within the phase
      phase.poses = arrayMove(phase.poses, sourcePoseIndex, destinationPoseIndex);
      
      // Update positions to reflect new order
      phase.poses.forEach((pose, idx) => {
        pose.position = idx + 1;
      });
      
      // Get the name of the moved pose for the history action
      const poseName = phase.poses[destinationPoseIndex].name;
      
      setSequence(updatedSequence);
      saveToHistory(updatedSequence, `Reordered "${poseName}" in ${phase.name}`);
    } 
    // Different phases, move between them
    else {
      const sourcePhase = updatedSequence.phases[sourcePhaseIndex];
      const destinationPhase = updatedSequence.phases[destinationPhaseIndex];
      
      // Get the pose to move
      const poseToMove = sourcePhase.poses[sourcePoseIndex];
      
      // Get the name of the moved pose for the history action
      const poseName = poseToMove.name;
      
      // Remove from source phase
      sourcePhase.poses.splice(sourcePoseIndex, 1);
      
      // Add to destination phase
      destinationPhase.poses.splice(destinationPoseIndex, 0, poseToMove);
      
      // Update positions in both phases
      sourcePhase.poses.forEach((pose, idx) => {
        pose.position = idx + 1;
      });
      
      destinationPhase.poses.forEach((pose, idx) => {
        pose.position = idx + 1;
      });
      
      setSequence(updatedSequence);
      saveToHistory(updatedSequence, `Moved "${poseName}" from ${sourcePhase.name} to ${destinationPhase.name}`);
    }
  };

  // Handle side selection and add the pose
  const handleSideSelection = (selectedSide: "left" | "right" | "both" | null) => {
    if (!pendingPoseWithSideOption || !sequence) return;
    
    const { poseData, phaseId, targetPoseId } = pendingPoseWithSideOption;
    
    // Find the phase name for history
    const targetPhase = sequence.phases.find(phase => phase.id === phaseId);
    const phaseName = targetPhase ? targetPhase.name : "phase";

    const updatedPhases = sequence.phases.map((phase: SequencePhase) => {
      if (phase.id === phaseId) {
        let updatedPoses = [...phase.poses];
        
        if (selectedSide === "both") {
          // Create the left side pose first
          const leftPose = {
            id: `${poseData.id}-left-${Date.now()}`,
            pose_id: poseData.id,
            name: poseData.name,
            sanskrit_name: poseData.sanskrit_name || undefined,
            duration_seconds: 30,
            position: 0, // Will be updated below
            side: "left",
            side_option: poseData.side_option
          } as SequencePose;
          
          // Create the right side pose
          const rightPose = {
            id: `${poseData.id}-right-${Date.now()}`,
            pose_id: poseData.id,
            name: poseData.name,
            sanskrit_name: poseData.sanskrit_name || undefined,
            duration_seconds: 30,
            position: 0, // Will be updated below
            side: "right",
            side_option: poseData.side_option
          } as SequencePose;
          
          // If dropping at a specific pose, insert at that position
          if (targetPoseId) {
            const targetIndex = updatedPoses.findIndex(p => p.id === targetPoseId);
            if (targetIndex !== -1) {
              // Insert both poses at the target position
              updatedPoses.splice(targetIndex, 0, leftPose, rightPose);
            } else {
              updatedPoses.push(leftPose, rightPose);
            }
          } else {
            // No target, add to the end
            updatedPoses.push(leftPose, rightPose);
          }
        } else {
          // Create a single pose with the selected side (original behavior)
          const newPose = {
            id: `${poseData.id}-${Date.now()}`,
            pose_id: poseData.id,
            name: poseData.name,
            sanskrit_name: poseData.sanskrit_name || undefined,
            duration_seconds: 30,
            position: 0, // Will be updated below
            side: selectedSide,
            side_option: poseData.side_option
          } as SequencePose;
          
          // If dropping at a specific pose, insert at that position
          if (targetPoseId) {
            const targetIndex = updatedPoses.findIndex(p => p.id === targetPoseId);
            if (targetIndex !== -1) {
              updatedPoses.splice(targetIndex, 0, newPose);
            } else {
              updatedPoses.push(newPose);
            }
          } else {
            // No target, add to the end
            updatedPoses.push(newPose);
          }
        }
        
        // Update positions for all poses
        updatedPoses = updatedPoses.map((pose, index) => ({
          ...pose,
          position: index + 1
        }));
        
        return {
          ...phase,
          poses: updatedPoses
        };
      }
      return phase;
    });

    const updatedSequence = {
      ...sequence,
      phases: updatedPhases
    };
    
    setSequence(updatedSequence);
    
    // Update history message based on selection
    const historyMessage = selectedSide === "both" 
      ? `Added "${poseData.name}" (both sides) to ${phaseName}`
      : `Added "${poseData.name}" (${selectedSide || 'center'}) to ${phaseName}`;
    
    saveToHistory(updatedSequence, historyMessage);
    setPendingPoseWithSideOption(null);
  };

  // Update handleDrop to check for side options
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, phaseId: string, targetPoseId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPhaseId(null);

    try {
      const poseData = JSON.parse(e.dataTransfer.getData("pose")) as PoseData;
      if (!sequence) return;
      
      // If pose has side options, show the selection dialog
      if (poseData.side_option === "left_right" || poseData.side_option === "both") {
        setPendingPoseWithSideOption({
          poseData,
          phaseId,
          targetPoseId
        });
        return;
      }
      
      // Original behavior for poses without side options
      const targetPhase = sequence.phases.find(phase => phase.id === phaseId);
      const phaseName = targetPhase ? targetPhase.name : "phase";

      const updatedPhases = sequence.phases.map((phase: SequencePhase) => {
        if (phase.id === phaseId) {
          const newPose = {
            id: `${poseData.id}-${Date.now()}`,
            pose_id: poseData.id,
            name: poseData.name,
            sanskrit_name: poseData.sanskrit_name || undefined,
            duration_seconds: 30,
            position: 0,
            side: null,
            side_option: poseData.side_option
          } as SequencePose;
          
          let updatedPoses = [...phase.poses];
          
          if (targetPoseId) {
            const targetIndex = updatedPoses.findIndex(p => p.id === targetPoseId);
            if (targetIndex !== -1) {
              updatedPoses.splice(targetIndex, 0, newPose);
            } else {
              updatedPoses.push(newPose);
            }
          } else {
            updatedPoses.push(newPose);
          }
          
          updatedPoses = updatedPoses.map((pose, index) => ({
            ...pose,
            position: index + 1
          }));
          
          return {
            ...phase,
            poses: updatedPoses
          };
        }
        return phase;
      });

      const updatedSequence = {
        ...sequence,
        phases: updatedPhases
      };
      
      setSequence(updatedSequence);
      saveToHistory(updatedSequence, `Added "${poseData.name}" to ${phaseName}`);
    } catch (error) {
      console.error("Error handling pose drop:", error);
    }
  };

  // Create a drop handler that captures the target pose
  const createPoseDropHandler = (phaseId: string, targetPoseId: string) => (e: React.DragEvent<HTMLDivElement>) => {
    handleDrop(e, phaseId, targetPoseId);
  };

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

  const handleStartEditing = () => {
    if (!isEditingSettings && sequence) {
      setTempSettings({
        name: sequence.name,
        description: sequence.description || "",
        duration_minutes: sequence.duration_minutes,
        difficulty: sequence.difficulty,
        style: sequence.style,
        focus: sequence.focus
      });
      setIsEditingSettings(true);
    }
  }

  const handleSettingsSave = () => {
    if (!sequence || !tempSettings) return;
    
    const updatedSequence = {
      ...sequence,
      name: tempSettings.name,
      description: tempSettings.description,
      duration_minutes: tempSettings.duration_minutes,
      difficulty: tempSettings.difficulty,
      style: tempSettings.style,
      focus: tempSettings.focus
    };
    
    setSequence(updatedSequence)
    saveToHistory(updatedSequence, "Updated sequence settings")
    
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
  
  const handlePhaseSelect = (index: number, phaseId: string) => {
    setSelectedPhaseIndex(index);
    
    // Ensure phase is expanded
    if (!expandedPhases.includes(phaseId)) {
      setExpandedPhases(prev => [...prev, phaseId]);
    }
    
    // Scroll to the phase after a small delay to ensure expansion is complete
    setTimeout(() => {
      if (phaseRefs.current[phaseId] && mainContentRef.current && headerRef.current) {
        const phaseElement = phaseRefs.current[phaseId];
        const mainContent = mainContentRef.current;
        const header = headerRef.current;
        
        // Calculate the header height to account for it in the scroll offset
        const headerHeight = header.offsetHeight;
        
        // Calculate the scroll position to place the phase at the top, with extra 10px offset
        const scrollPosition = phaseElement.offsetTop - mainContent.offsetTop - headerHeight - 10;
        
        // Smooth scroll to the position
        mainContent.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  };
  
  // Add this effect to handle 404 cases
  useEffect(() => {
    const fetchSequence = async () => {
      try {
        setIsLoading(true)
        console.log(`Client: Fetching sequence with ID: ${sequenceId}`);
        
        // First try to load from localStorage
        try {
          const localSequences = localStorage.getItem("generatedSequences");
          if (localSequences) {
            const sequences = JSON.parse(localSequences);
            const localSequence = sequences.find((seq: any) => seq.id === sequenceId);
            
            if (localSequence) {
              console.log(`Client: Found sequence in localStorage: ${sequenceId}`);
              
              // Always expand all phases when displaying sequences
              let phasesToExpand: string[] = [];
              if (localSequence.phases && localSequence.phases.length > 0) {
                phasesToExpand = localSequence.phases.map((phase: any) => phase.id);
              }
              
              // Check if sequence has poses or just structure
              const isStructureOnly = localSequence.structureOnly === true;
              
              // If we have the structure but poses are loading placeholders
              if (isStructureOnly) {
                console.log(`Client: Found structure-only sequence, showing skeletons for poses`);
                setSequence(localSequence);
                setStructureLoaded(true);
                setIsPosesLoading(true);
                setExpandedPhases(phasesToExpand); // Expand all phases
              } else {
                // Full sequence with poses
                console.log(`Client: Found complete sequence with poses`);
                setSequence(localSequence);
                setIsPosesLoading(false);
                
                // Expand all phases for complete sequences too
                setExpandedPhases(phasesToExpand);
              }
              
              setIsLoading(false);
              return;
            }
          }
        } catch (localError) {
          console.error("Error checking localStorage:", localError);
        }
        
        // If not in localStorage, try the API
        console.log(`Client: Not found in localStorage, trying API for: ${sequenceId}`);
        const response = await fetch(`/api/sequences/${sequenceId}?t=${Date.now()}`);
        
        if (!response.ok) {
          console.log(`Client: Error response ${response.status}: ${response.statusText}`);
          
          if (response.status === 404) {
            console.log("Client: Sequence not found, redirecting to home page");
            showToast("Sequence not found", "error");
            router.push('/');
            return;
          }
          
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Client: Successfully fetched sequence:`, data.id);
        setSequence(data);
        setIsPosesLoading(false);
      } catch (error) {
        console.error("Client: Failed to fetch sequence:", error);
        showToast("Failed to load sequence", "error");
        // Redirect to home after error
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (sequenceId) {
      fetchSequence();
    }
  }, [sequenceId, showToast, router]);
  
  // Add effect to complete pose generation if we're viewing a structure-only sequence
  useEffect(() => {
    // Only proceed if we have a structure-only sequence
    if (sequence && sequence.structureOnly && isPosesLoading && !isPoseGenerationInProgress.current) {
      console.log(`Client: Generating poses for structure-only sequence: ${sequence.id}`);
      
      // Set flag to prevent duplicate requests
      isPoseGenerationInProgress.current = true;
      
      const completePoseGeneration = async () => {
        try {
          const response = await fetch(`/api/sequences/complete-poses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sequenceId: sequence.id,
              difficulty: sequence.difficulty,
              style: sequence.style,
              focus: sequence.focus,
              // Send the full structure to the API
              structure: sequence
            })
          });
          
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log(`Client: Received complete sequence with poses:`, data.id);
          
          // Update localStorage with the completed sequence
          try {
            const localSequences = localStorage.getItem("generatedSequences");
            if (localSequences) {
              const sequences = JSON.parse(localSequences);
              const updatedSequences = sequences.map((seq: any) => 
                seq.id === data.id ? data : seq
              );
              localStorage.setItem("generatedSequences", JSON.stringify(updatedSequences));
              
              // Update state
              setSequence(data);
              setIsPosesLoading(false);
              
              // Keep all phases expanded after poses are loaded
              if (data.phases && data.phases.length > 0) {
                setExpandedPhases(data.phases.map((phase: SequencePhase) => phase.id));
              }
              
              showToast("Sequence with poses generated successfully!", "success");
            }
          } catch (localError) {
            console.error("Error updating localStorage:", localError);
          }
        } catch (error) {
          console.error("Client: Failed to complete pose generation:", error);
          showToast("Failed to generate poses. Please try again later.", "error");
          // Keep loading state, allow user to still work with the structure
        } finally {
          // Reset flag regardless of success/failure
          isPoseGenerationInProgress.current = false;
        }
      };
      
      completePoseGeneration();
    }
  }, [sequence, isPosesLoading, showToast]);
  
  // Helper function to find a pose by ID
  const findPoseById = (poseId: string): SequencePose | null => {
    if (!sequence) return null;
    
    for (const phase of sequence.phases) {
      const pose = phase.poses.find(p => p.id === poseId);
      if (pose) return pose;
    }
    
    return null;
  };
  
  // Re-adding handlePoseSelect functionality
  const handlePoseSelect = (pose: any) => {
    if (!sequence) return;
    
    // Convert the incoming Pose to a PoseData format if needed
    const poseData: PoseData = {
      id: pose.id,
      name: pose.name,
      sanskrit_name: pose.sanskrit_name || pose.sanskrit_name || null,
      category: pose.category || null,
      difficulty: pose.difficulty || null,
      side_option: pose.side_option || null
    };
    
    const selectedPhase = sequence.phases[selectedPhaseIndex];
    const phaseId = selectedPhase.id;
    
    // If pose has side options, show the selection dialog
    if (poseData.side_option === "left_right" || poseData.side_option === "both") {
      setPendingPoseWithSideOption({
        poseData,
        phaseId
      });
      return;
    }
    
    // Create a fake drag event for poses without side options
    const fakeEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      dataTransfer: {
        getData: () => JSON.stringify(poseData)
      }
    } as unknown as React.DragEvent<HTMLDivElement>;
    
    handleDrop(fakeEvent, phaseId);
  };
  
  // Delete pose handler
  const handleDeletePose = (poseId: string) => {
    if (!sequence) return;
    
    // Find the pose to include its name in the history action
    let poseName = "";
    let phaseId = "";
    
    sequence.phases.forEach(phase => {
      phase.poses.forEach(pose => {
        if (pose.id === poseId) {
          poseName = pose.name;
          phaseId = phase.id;
        }
      });
    });
    
    const updatedPhases = sequence.phases.map(phase => ({
      ...phase,
      poses: phase.poses.filter(pose => pose.id !== poseId)
    }));
    
    const updatedSequence = {
      ...sequence,
      phases: updatedPhases
    };
    
    setSequence(updatedSequence);
    saveToHistory(updatedSequence, `Removed "${poseName}" from sequence`);
  };
  
  // Duplicate pose handler
  const handleDuplicatePose = (poseId: string) => {
    if (!sequence) return;
    
    // Find the pose to duplicate
    let poseToDuplicate: SequencePose | undefined;
    let phaseId = "";
    let poseIndex = -1;
    
    sequence.phases.forEach(phase => {
      phase.poses.forEach((pose, index) => {
        if (pose.id === poseId) {
          poseToDuplicate = { ...pose };
          phaseId = phase.id;
          poseIndex = index;
        }
      });
    });
    
    if (!poseToDuplicate) return;
    
    // Create a duplicate with a new ID
    const duplicatedPose: SequencePose = {
      ...poseToDuplicate,
      id: `${poseToDuplicate.id}-${Date.now()}`, // Ensure a unique ID
      position: poseToDuplicate.position + 1
    };
    
    const updatedPhases = sequence.phases.map(phase => {
      if (phase.id === phaseId) {
        const updatedPoses = [...phase.poses];
        // Insert the duplicated pose after the original
        updatedPoses.splice(poseIndex + 1, 0, duplicatedPose);
        
        // Update positions
        updatedPoses.forEach((pose, idx) => {
          pose.position = idx + 1;
        });
        
        return {
          ...phase,
          poses: updatedPoses
        };
      }
      return phase;
    });
    
    const updatedSequence = {
      ...sequence,
      phases: updatedPhases
    };
    
    setSequence(updatedSequence);
    saveToHistory(updatedSequence, `Duplicated "${poseToDuplicate.name}"`);
  };
  
  if (!sequenceId || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige dark:bg-dark-gray">
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
          href="/generate"
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
        {!isLeftSidebarOpen && (
          /* Icon buttons when sidebar is collapsed */
          <div className="py-4 flex flex-col items-center space-y-6">
            <button
              onClick={() => {
                setActiveSidebarTab('phases');
                setIsLeftSidebarOpen(true);
              }}
              className={cn(
                "p-2 rounded-md transition-colors relative",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                activeSidebarTab === 'phases' 
                  ? "text-vibrant-blue" 
                  : "text-gray-600 dark:text-gray-400"
              )}
              title="Phases Navigator"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {activeSidebarTab === 'phases' && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-vibrant-blue rounded-r-full"></div>
              )}
            </button>
            <button
              onClick={() => {
                setActiveSidebarTab('history');
                setIsLeftSidebarOpen(true);
              }}
              className={cn(
                "p-2 rounded-md transition-colors relative",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                activeSidebarTab === 'history' 
                  ? "text-vibrant-blue" 
                  : "text-gray-600 dark:text-gray-400"
              )}
              title="Edit History"
            >
              <History className="h-5 w-5" />
              {activeSidebarTab === 'history' && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-vibrant-blue rounded-r-full"></div>
              )}
            </button>
          </div>
        )}

        <div className={cn(
          "overflow-hidden transition-all duration-300 flex-1",
          isLeftSidebarOpen ? "block" : "hidden"
        )}>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-2">
            <button
              onClick={() => setActiveSidebarTab('phases')}
              className={cn(
                "flex-1 py-3 font-medium text-center transition-colors",
                activeSidebarTab === 'phases'
                  ? "text-vibrant-blue border-b-2 border-vibrant-blue"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
            </button>
            <button
              onClick={() => setActiveSidebarTab('history')}
              className={cn(
                "flex-1 py-3 font-medium text-center transition-colors",
                activeSidebarTab === 'history'
                  ? "text-vibrant-blue border-b-2 border-vibrant-blue"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <div className="flex items-center justify-center">
                <History className="h-5 w-5" />
              </div>
            </button>
            <button
              onClick={() => setIsLeftSidebarOpen(false)}
              className="px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title="Close Sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          
          {/* Content Area */}
          <div className="h-[calc(100%-4rem)] overflow-y-auto">
            {activeSidebarTab === 'history' ? (
              /* History Panel */
              <div className="px-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Edit History</div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={handleUndo}
                      disabled={currentHistoryIndex <= 0}
                      className={cn(
                        "p-1.5 rounded-md text-gray-700 dark:text-gray-300",
                        currentHistoryIndex <= 0 
                          ? "opacity-40 cursor-not-allowed" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-vibrant-blue"
                      )}
                      title="Undo (Ctrl+Z)"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={handleRedo}
                      disabled={currentHistoryIndex >= historyStack.length - 1}
                      className={cn(
                        "p-1.5 rounded-md text-gray-700 dark:text-gray-300",
                        currentHistoryIndex >= historyStack.length - 1 
                          ? "opacity-40 cursor-not-allowed" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-vibrant-blue"
                      )}
                      title="Redo (Ctrl+Y)"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-full">
                  {historyStack.map((historyItem, index) => {
                    // Format time
                    const date = new Date(historyItem.timestamp);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    return (
                      <button
                        key={index}
                        onClick={() => navigateHistory(index)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs transition-colors rounded-md",
                          index === currentHistoryIndex 
                            ? "bg-vibrant-blue/10 text-vibrant-blue"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate">{historyItem.action}</span>
                          <span className="text-xs text-gray-500 ml-1 flex-shrink-0">{timeString}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Phases Navigation */
              <div className="px-2 py-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-3">Sequence Phases</div>
                <div className="space-y-1">
                  {sequence.phases.map((phase, index) => (
                    <button
                      key={phase.id}
                      onClick={() => handlePhaseSelect(index, phase.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md transition-colors whitespace-nowrap",
                        selectedPhaseIndex === index 
                          ? "bg-vibrant-blue/10 text-vibrant-blue"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary mr-2 text-xs">
                          {index + 1}
                        </div>
                        <span className="truncate">{phase.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
          {isLeftSidebarOpen && (
            <span className="ml-2 text-base font-medium whitespace-nowrap">Sequence</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main 
        ref={mainContentRef}
        className={cn(
          "flex-1 transition-all duration-300 h-screen overflow-y-auto bg-beige dark:bg-dark-gray",
          isLeftSidebarOpen ? "ml-64" : "ml-12",
          isRightSidebarOpen ? "mr-80" : "mr-12"
        )}
        style={{
          backgroundImage: 'url("/images/paper-bg.jpg")',
          backgroundSize: 'repeat',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        }}
      >
        {/* Top Bar */}
        <div 
          ref={headerRef}
          className="sticky top-0 z-10 bg-warm-white dark:bg-deep-charcoal-light border-b border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between">
            {/* Left: Back to Home Button */}
            <div>
              <button
                onClick={handleExit}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Back to Home"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Center: Title */}
            <div 
              className="flex items-center gap-2 cursor-pointer group max-w-xl w-full mx-auto"
              onClick={isEditingSettings ? undefined : handleStartEditing}
            >
              {isEditingSettings ? (
                <input
                  type="text"
                  value={tempSettings?.name || ''}
                  onChange={(e) => setTempSettings({...tempSettings!, name: e.target.value})}
                  className="text-xl font-semibold bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-vibrant-blue px-1 w-full"
                  autoFocus
                />
              ) : (
                <h1 className="text-xl font-semibold group-hover:text-vibrant-blue transition-colors text-center w-full truncate">
                  {sequence.name}
                </h1>
              )}
            </div>

            {/* Right: Export and Save Buttons */}
            <div className="flex items-center space-x-3">
              {isEditingSettings ? (
                <>
                  <button
                    onClick={handleSettingsCancel}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Cancel"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSettingsSave}
                    className="p-2 bg-vibrant-blue text-white rounded-md hover:bg-vibrant-blue/90 transition-colors"
                    title="Save Settings"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {/* TODO: Implement export functionality */}}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Export"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSave}
                    className={cn(
                      "p-2 bg-vibrant-blue text-white rounded-md hover:bg-vibrant-blue/90 transition-colors",
                      hasUnsavedChanges && "animate-pulse"
                    )}
                    title="Save"
                  >
                    <Save className="h-5 w-5" />
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
            {/* Duration */}
            <div 
              className={cn(
                "bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm",
                !isEditingSettings && "cursor-pointer hover:border-vibrant-blue/50 hover:shadow-md transition-shadow"
              )}
              onClick={isEditingSettings ? undefined : handleStartEditing}
            >
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
                <div className="text-xl font-semibold group-hover:text-vibrant-blue">{totalDuration.toFixed(1)} min</div>
              )}
            </div>
            
            {/* Difficulty */}
            <div 
              className={cn(
                "bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm",
                !isEditingSettings && "cursor-pointer hover:border-vibrant-blue/50 hover:shadow-md transition-shadow"
              )}
              onClick={isEditingSettings ? undefined : handleStartEditing}
            >
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
            
            {/* Style */}
            <div 
              className={cn(
                "bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm",
                !isEditingSettings && "cursor-pointer hover:border-vibrant-blue/50 hover:shadow-md transition-shadow"
              )}
              onClick={isEditingSettings ? undefined : handleStartEditing}
            >
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
            
            {/* Focus */}
            <div 
              className={cn(
                "bg-warm-white dark:bg-deep-charcoal-light rounded-lg p-4 shadow-sm",
                !isEditingSettings && "cursor-pointer hover:border-vibrant-blue/50 hover:shadow-md transition-shadow"
              )}
              onClick={isEditingSettings ? undefined : handleStartEditing}
            >
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
          <div className="space-y-6 pb-64">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDndDragOver}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              {sequence?.phases.map((phase, phaseIndex) => (
                <div
                  key={phase.id}
                  ref={el => {
                    phaseRefs.current[phase.id] = el;
                    return undefined;
                  }}
                  className={cn(
                    "bg-warm-white dark:bg-deep-charcoal-light rounded-lg shadow-sm overflow-hidden transition-all duration-200",
                    dragOverPhaseId === phase.id && "ring-2 ring-vibrant-blue shadow-md"
                  )}
                  data-phase-id={phase.id}
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
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleDragOverLegacy(e, phase.id);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, phase.id)}
                    >
                      <p className="text-gray-600 dark:text-gray-400 mb-4 ml-11">
                        {phase.description}
                      </p>

                      <div className="space-y-3 ml-11">
                        {isPosesLoading ? (
                          // Show skeleton UI when poses are loading
                          Array(3).fill(0).map((_, i) => (
                            <PoseSkeleton key={i} />
                          ))
                        ) : phase.poses.length === 0 ? (
                          // Empty state for phase with no poses
                          <div 
                            className="h-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, phase.id)}
                          >
                            Drop poses here
                          </div>
                        ) : (
                          // Show actual poses with SortableContext
                          <SortableContext 
                            items={phase.poses.map(pose => pose.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {phase.poses.map((pose, index) => (
                              <div
                                key={pose.id}
                                className="relative"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => createPoseDropHandler(phase.id, pose.id)(e)}
                              >
                                <SortablePoseItem
                                  id={pose.id}
                                  pose={pose}
                                  index={index}
                                  onDurationChange={handleDurationChange}
                                  onSideToggle={togglePoseSide}
                                  onDelete={handleDeletePose}
                                  onDuplicate={handleDuplicatePose}
                                />
                              </div>
                            ))}
                          </SortableContext>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* DragOverlay for showing the dragged item */}
              <DragOverlay>
                {activeId && (
                  <div className="opacity-70">
                    <SortablePoseItem
                      id={activeId}
                      pose={findPoseById(activeId) || { id: '', pose_id: '', name: '', duration_seconds: 0, position: 0 }}
                      index={0}
                      onDelete={handleDeletePose}
                      onDuplicate={handleDuplicatePose}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
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
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsExiting(false)}
        >
          <div 
            className="bg-white dark:bg-deep-charcoal-light p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Unsaved Changes</h3>
              <button 
                onClick={() => setIsExiting(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have unsaved changes. Would you like to save them before leaving?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsExiting(false)
                  setHasUnsavedChanges(false)
                  router.push('/')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Don't Save
              </button>
              <button
                onClick={() => handleSave()}
                className="px-4 py-2 bg-vibrant-blue text-white rounded-md hover:bg-vibrant-blue/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* History Discard Confirmation Dialog */}
      {isHistoryDiscardDialogOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={cancelDiscardHistory}
        >
          <div 
            className="bg-white dark:bg-deep-charcoal-light p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Discard Future History</h3>
              <button 
                onClick={cancelDiscardHistory}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You're making changes from an earlier point in history. This will discard {historyStack.length - currentHistoryIndex - 1} future changes. Continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDiscardHistory}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDiscardHistory}
                className="px-4 py-2 bg-vibrant-blue text-white rounded-md hover:bg-vibrant-blue/90 transition-colors"
              >
                Discard Future
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Side Selection Dialog */}
      {pendingPoseWithSideOption && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div 
            className="bg-white dark:bg-deep-charcoal-light p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Side for {pendingPoseWithSideOption.poseData.name}</h3>
              <button 
                onClick={() => setPendingPoseWithSideOption(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-5">
              This pose can be practiced on the left or right side. Which side would you like to add?
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => handleSideSelection("left")}
                className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <span className="font-medium">Left Side</span>
              </button>
              
              <button
                onClick={() => handleSideSelection("right")}
                className="flex flex-col items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
              >
                <div className="flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <span className="font-medium">Right Side</span>
              </button>
            </div>
            
            <div className="flex justify-center pt-2">
              <button
                onClick={() => handleSideSelection("both")}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline"
              >
                Add Both Sides
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
