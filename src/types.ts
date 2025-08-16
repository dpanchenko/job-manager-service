export type JobStatus = 'running' | 'completed' | 'failed' | 'crashed' | 'retrying';

export type Platform = 'win32' | 'darwin' | 'linux' | 'freebsd' | 'openbsd' | 'sunos' | 'aix';

export interface Job {
  id: string;
  name: string;
  arguments: string[];
  status: JobStatus;
  startTime: Date;
  endTime: Date | null;
  exitCode: number | null;
  retryCount: number;
  maxRetries: number;
  duration: number | null;
  originalJobId?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export interface JobResponse {
  id: string;
  name: string;
  arguments: string[];
  status: JobStatus;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  retryCount: number;
  originalJobId: string | null;
}

export interface SimulatorCommand {
  command: string;
  args: string[];
  scriptPath: string;
}

export interface JobPattern {
  pattern: string;
  matchCount: number;
  successRate: number;
  differenceFromAverage: string;
}

export interface JobStats {
  totalJobs: number;
  overallSuccessRate: number;
  patterns: JobPattern[];
}

export interface PatternAnalyzer {
  (jobs: Job[], overallRate: number): JobPattern;
}
