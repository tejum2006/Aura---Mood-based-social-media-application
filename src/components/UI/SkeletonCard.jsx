export default function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-orange-50 dark:border-zinc-800 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded-full skeleton" />
          <div className="h-3 w-20 rounded-full skeleton" />
        </div>
      </div>
      {/* Image */}
      <div className="h-52 rounded-2xl skeleton" />
      {/* Text */}
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded-full skeleton" />
        <div className="h-3.5 w-3/4 rounded-full skeleton" />
      </div>
      {/* Actions */}
      <div className="flex gap-4">
        <div className="h-4 w-14 rounded-full skeleton" />
        <div className="h-4 w-14 rounded-full skeleton" />
        <div className="h-4 w-14 rounded-full skeleton" />
      </div>
    </div>
  );
}
