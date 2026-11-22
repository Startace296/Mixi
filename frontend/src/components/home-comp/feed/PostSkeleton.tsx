function SkeletonLine({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-[#e4e6eb] ${className}`} />;
}

export default function PostSkeleton() {
  return (
    <article className="overflow-hidden rounded-lg border border-[#e4e6eb] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3 p-4">
        <SkeletonLine className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-3.5 w-32" />
          <SkeletonLine className="h-3 w-24" />
        </div>
      </div>
      <SkeletonLine className="h-48 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-4/5" />
      </div>
    </article>
  );
}
