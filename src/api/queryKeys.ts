/**
 * Centralized TanStack Query key factory.
 * Guarantees consistent query key tuples across hooks and cache invalidation calls.
 */
export const queryKeys = {
  appointments: {
    all: () => ['appointments'] as const,
    byDate: (date: string) => ['appointments', 'byDate', date] as const,
    byRange: (start: string, end: string) => ['appointments', 'range', start, end] as const,
    todayStats: () => ['appointments', 'todayStats'] as const,
    search: (q: string, start?: string, end?: string) =>
      ['appointments', 'search', q, start ?? '', end ?? ''] as const,
  },
  patients: {
    all: () => ['patients'] as const,
    byId: (id: string) => ['patients', id] as const,
    search: (q: string) => ['patients', 'search', q] as const,
  },
  doctors: {
    all: () => ['doctors'] as const,
    byId: (id: string) => ['doctors', id] as const,
    search: (q: string) => ['doctors', 'search', q] as const,
  },
  therapists: {
    all: () => ['therapists'] as const,
    byService: (svc?: string) => ['therapists', svc ?? 'all'] as const,
  },
  centers: {
    all: () => ['centers'] as const,
    byId: (id: string) => ['centers', id] as const,
  },
  packages: {
    all: () => ['packages'] as const,
    byId: (id: string) => ['packages', id] as const,
    search: (q: string, serviceType?: string) =>
      ['packages', 'search', q, serviceType ?? 'All'] as const,
  },
  enrollments: {
    all: () => ['enrollments'] as const,
    byPatient: (patientId: string) => ['enrollments', 'patient', patientId] as const,
    byId: (id: string) => ['enrollments', id] as const,
    search: (q: string, status?: string) =>
      ['enrollments', 'search', q, status ?? 'All'] as const,
  },
  staff: {
    me: () => ['staff', 'me'] as const,
  },
} as const;
