"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SortablePoseItem } from "./sortable-pose-item"
import { Download, Save, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { formatCategory } from "@/lib/utils"
import { useSupabase } from "@/components/providers"
import { Input } from "@/components/ui/input"

interface Pose {
  id: string
  english_name: string
  sanskrit_name: string | null
  category: string | null
  difficulty_level: string | null
  side_option: string | null
}

interface SequencePose {
  id: string
  position: number
  duration: number | null
  side: string | null
  cues: string | null
  poses: Pose
}

interface Sequence {
  id: string
  title: string
  description: string | null
  duration: number | null
  difficulty_level: string | null
  style: string | null
  focus_area: string | null
  is_ai_generated: boolean | null
  created_at: string
  sequence_poses: SequencePose[]
}

interface FlowBlock {
  id: string
  title: string
  description: string
  poses: SequencePose[]
}

interface SequenceEditorProps {
  sequence: Sequence
  isOwner?: boolean
}

export function SequenceEditor({ sequence, isOwner = true }: SequenceEditorProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [sequenceTitle, setSequenceTitle] = useState(sequence.title)
  const [isSaving, setIsSaving] = useState(false)
  const [flowBlocks, setFlowBlocks] = useState<FlowBlock[]>([])

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Group poses into flow blocks based on position
  useEffect(() => {
    // If no poses, create a default block
    if (!sequence.sequence_poses || sequence.sequence_poses.length === 0) {
      setFlowBlocks([
        {
          id: "block-1",
          title: "Centering and Breath Awareness",
          description: "Begin with centering the mind and body, focusing on breath awareness.",
          poses: []
        }
      ]);
      return;
    }

    // Create blocks based on the sequence data
    // For this example, we'll create blocks with specific titles
    const blocks: FlowBlock[] = [
      {
        id: "block-1",
        title: "Centering and Breath Awareness",
        description: "Begin with centering the mind and body, focusing on breath awareness.",
        poses: []
      },
      {
        id: "block-2",
        title: "Gentle Movements and Joint Mobility",
        description: "Gently awaken the body with movements that promote joint mobility.",
        poses: []
      },
      {
        id: "block-3",
        title: "Warm-up with Sun Salutations",
        description: "Begin to build heat with a gentle flow of Sun Salutations.",
        poses: []
      },
      {
        id: "block-4",
        title: "Cool Down",
        description: "Transition to cooling down with gentle stretches.",
        poses: []
      }
    ];

    // Distribute poses among blocks
    const sortedPoses = [...sequence.sequence_poses].sort((a, b) => a.position - b.position);
    const posesPerBlock = Math.ceil(sortedPoses.length / blocks.length);
    
    sortedPoses.forEach((pose, index) => {
      const blockIndex = Math.min(Math.floor(index / posesPerBlock), blocks.length - 1);
      blocks[blockIndex].poses.push(pose);
    });

    setFlowBlocks(blocks);
  }, [sequence.sequence_poses]);

  const handleDragEnd = (event: any, blockId: string) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFlowBlocks(prevBlocks => {
        return prevBlocks.map(block => {
          if (block.id !== blockId) return block;

          const oldIndex = block.poses.findIndex(pose => pose.id === active.id);
          const newIndex = block.poses.findIndex(pose => pose.id === over.id);

          const newPoses = arrayMove(block.poses, oldIndex, newIndex).map((pose, index) => ({
            ...pose,
            position: index * 10, // Update positions to maintain order
          }));

          return {
            ...block,
            poses: newPoses
          };
        });
      });
    }
  };

  const handleCueChange = (poseId: string, cues: string) => {
    setFlowBlocks(prevBlocks => {
      return prevBlocks.map(block => {
        const updatedPoses = block.poses.map(pose => 
          pose.id === poseId ? { ...pose, cues } : pose
        );
        return { ...block, poses: updatedPoses };
      });
    });
  };

  const handleSideChange = (poseId: string, side: string) => {
    setFlowBlocks(prevBlocks => {
      return prevBlocks.map(block => {
        const updatedPoses = block.poses.map(pose => 
          pose.id === poseId ? { ...pose, side } : pose
        );
        return { ...block, poses: updatedPoses };
      });
    });
  };

  const handleDurationChange = (poseId: string, duration: number) => {
    setFlowBlocks(prevBlocks => {
      return prevBlocks.map(block => {
        const updatedPoses = block.poses.map(pose => 
          pose.id === poseId ? { ...pose, duration } : pose
        );
        return { ...block, poses: updatedPoses };
      });
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update sequence title if changed
      if (sequenceTitle !== sequence.title) {
        const { error: titleError } = await supabase
          .from("sequences")
          .update({ title: sequenceTitle })
          .eq("id", sequence.id);

        if (titleError) throw titleError;
      }

      // Flatten all poses from all blocks
      const allPoses = flowBlocks.flatMap((block, blockIndex) => 
        block.poses.map((pose, poseIndex) => ({
          ...pose,
          position: blockIndex * 1000 + poseIndex * 10 // Ensure poses stay in their blocks
        }))
      );

      // Update each sequence pose
      for (const pose of allPoses) {
        const { error } = await supabase
          .from("sequence_poses")
          .update({
            position: pose.position,
            duration: pose.duration,
            side: pose.side,
            cues: pose.cues,
          })
          .eq("id", pose.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Sequence saved successfully",
      });

      router.refresh();
    } catch (error) {
      console.error("Error saving sequence:", error);
      toast({
        title: "Error",
        description: "Failed to save sequence",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    // Create a simple text representation of the sequence
    let content = `${sequenceTitle}\n${sequence.description || ""}\n\n`;
    content += `Duration: ${sequence.duration} minutes\n`;
    content += `Difficulty: ${formatCategory(sequence.difficulty_level)}\n`;
    content += `Style: ${formatCategory(sequence.style)}\n`;
    content += `Focus: ${formatCategory(sequence.focus_area)}\n\n`;

    flowBlocks.forEach((block, blockIndex) => {
      content += `${blockIndex + 1}. ${block.title}\n`;
      content += `${block.description}\n\n`;
      
      block.poses.forEach((pose, poseIndex) => {
        content += `  ${poseIndex + 1}. ${pose.poses.english_name} (${pose.poses.sanskrit_name || "No Sanskrit name"})\n`;
        if (pose.duration) content += `     Duration: ${pose.duration} seconds\n`;
        if (pose.side) content += `     Side: ${pose.side}\n`;
        if (pose.cues) content += `     Cues: ${pose.cues}\n`;
        content += "\n";
      });
    });

    // Create a download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sequenceTitle.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Sequence exported successfully",
    });
  };

  // Only show edit controls if the user is the owner
  const showEditControls = isOwner;

  const handleAddPose = (blockId: string) => {
    // This would typically open a pose selection modal
    // For now, we'll just show a toast
    toast({
      title: "Add Pose",
      description: "Pose selection modal would open here",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/flows')} className="px-0">
            ← Back
          </Button>
          
          {showEditControls && (
            <div className="flex space-x-2">
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? "Saving..." : "Save"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                Export
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <label className="text-sm font-medium mr-2">Sequence Name</label>
            {showEditControls ? (
              <Input 
                value={sequenceTitle} 
                onChange={(e) => setSequenceTitle(e.target.value)}
                className="h-10 text-lg font-medium"
              />
            ) : (
              <h2 className="text-lg font-medium">{sequenceTitle}</h2>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{formatCategory(sequence.difficulty_level)}</Badge>
            <Badge variant="outline">{formatCategory(sequence.style)}</Badge>
            <Badge variant="outline">{formatCategory(sequence.focus_area)}</Badge>
            {sequence.duration && <Badge variant="outline">{sequence.duration} min</Badge>}
          </div>
          
          {sequence.description && (
            <p className="text-muted-foreground mt-2">{sequence.description}</p>
          )}
        </div>
      </div>

      {flowBlocks.map((block, blockIndex) => (
        <div key={block.id} className="mb-8">
          <div className="flex items-center mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary mr-2">
              {blockIndex + 1}
            </div>
            <h3 className="text-xl font-medium">{block.title}</h3>
          </div>
          
          <p className="text-muted-foreground mb-4 ml-10">{block.description}</p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, block.id)}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          >
            <SortableContext 
              items={block.poses.map(pose => pose.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 ml-10">
                {block.poses.map((pose) => (
                  <SortablePoseItem
                    key={pose.id}
                    id={pose.id}
                    pose={pose.poses}
                    cues={pose.cues || ""}
                    side={pose.side || ""}
                    duration={pose.duration || 30}
                    onCueChange={(cues) => handleCueChange(pose.id, cues)}
                    onSideChange={(side) => handleSideChange(pose.id, side)}
                    onDurationChange={(duration) => handleDurationChange(pose.id, duration)}
                    isEditable={showEditControls}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          {showEditControls && (
            <div className="mt-4 ml-10">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-dashed"
                onClick={() => handleAddPose(block.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Drag poses here to add to this phase
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

