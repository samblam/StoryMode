import type { User } from './auth';
import type { Database } from './database';

export type UserEventType = CustomEvent<{ user?: User | null }>;

export type SurveyEventDetail = {
  refresh?: boolean;
  surveyId?: string;
  status?: Database['public']['Tables']['surveys']['Row']['status'];
  error?: string;
};

export type SurveyEventType = CustomEvent<SurveyEventDetail>;

declare global {
  interface WindowEventMap {
    'surveyUpdated': SurveyEventType;
  }
}