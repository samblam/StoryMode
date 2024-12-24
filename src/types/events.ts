import type { User } from './auth';

export type UserEventType = CustomEvent<{ user?: User | null }>;