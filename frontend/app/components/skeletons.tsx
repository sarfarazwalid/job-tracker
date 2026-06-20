"use client";

import { Card, Skeleton } from "./ui";

export function StatsCardSkeleton() {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </Card>
  );
}

export function ApplicationRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border-default)]">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
    </div>
  );
}

export function ApplicationListSkeleton() {
  return (
    <Card padding="sm">
      {[...Array(5)].map((_, i) => (
        <ApplicationRowSkeleton key={i} />
      ))}
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <ApplicationListSkeleton />
      </div>
    </div>
  );
}