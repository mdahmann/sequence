import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-secondary/50",
        className
      )}
    />
  );
}

export function PoseSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-800 rounded-md">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-14" />
    </div>
  );
}

export function SequencePhaseSkeleton({ poseCount = 3 }: { poseCount?: number }) {
  return (
    <div className="mb-6 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 bg-warm-white dark:bg-deep-charcoal-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
      <div className="p-4 pt-0">
        <Skeleton className="h-4 w-full max-w-md mt-4 mb-5" />
        <div className="space-y-3 ml-11">
          {Array(poseCount).fill(0).map((_, i) => (
            <PoseSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SequenceSkeletonLoader() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      
      <SequencePhaseSkeleton poseCount={2} />
      <SequencePhaseSkeleton poseCount={4} />
      <SequencePhaseSkeleton poseCount={3} />
    </div>
  );
} 