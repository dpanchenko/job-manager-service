import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import * as path from 'path';
import { Job, JobResponse, JobStats, JobPattern, SimulatorCommand, Platform, PatternAnalyzer } from './types';

export class JobManager {
  private jobs: Map<string, Job>;
  private jobHistory: Job[];
  private platform: Platform;

  constructor() {
    this.jobs = new Map<string, Job>();
    this.jobHistory = [];
    this.platform = os.platform() as Platform;
  }

  private getSimulatorCommand(): SimulatorCommand {
    if (this.platform === 'win32') {
      return {
        command: 'cmd',
        args: ['/c', 'cpp-simulator.bat'],
        scriptPath: path.join(__dirname, '..', 'cpp-simulator.bat'),
      };
    } else {
      return {
        command: './cpp-simulator.sh',
        args: [],
        scriptPath: path.join(__dirname, '..', 'cpp-simulator.sh'),
      };
    }
  }

  public async startJob(jobName: string, jobArguments: string[] = []): Promise<string> {
    const jobId = uuidv4();
    const startTime = new Date();

    const job: Job = {
      id: jobId,
      name: jobName,
      arguments: jobArguments,
      status: 'running',
      startTime,
      endTime: null,
      exitCode: null,
      retryCount: 0,
      maxRetries: 1,
      duration: null,
    };

    this.jobs.set(jobId, job);
    this.jobHistory.push(job);

    try {
      await this.executeJob(job);
    } catch (error) {
      job.status = 'crashed';
      job.endTime = new Date();
      job.duration = job.endTime.getTime() - job.startTime.getTime();

      if (job.retryCount < job.maxRetries) {
        setTimeout(() => this.retryJob(jobId), 1000);
      }
    }

    return jobId;
  }

  private executeJob(job: Job): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const simulator = this.getSimulatorCommand();
      const allArgs = [...simulator.args, job.name, ...job.arguments];

      const process: ChildProcess = spawn(simulator.command, allArgs, {
        cwd: path.join(__dirname, '..'),
        shell: this.platform === 'win32' ? false : true,
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      process.on('close', (code: number | null) => {
        job.endTime = new Date();
        job.duration = job.endTime.getTime() - job.startTime.getTime();
        job.exitCode = code;
        job.stdout = stdout;
        job.stderr = stderr;

        if (code === 0) {
          job.status = 'completed';
          resolve();
        } else {
          job.status = 'failed';
          if (job.retryCount < job.maxRetries) {
            setTimeout(() => this.retryJob(job.id), 1000);
          }
          resolve();
        }
      });

      process.on('error', (error: Error) => {
        job.status = 'crashed';
        job.endTime = new Date();
        job.duration = job.endTime.getTime() - job.startTime.getTime();
        job.error = error.message;
        reject(error);
      });
    });
  }

  private async retryJob(jobId: string): Promise<void> {
    const originalJob = this.jobs.get(jobId);
    if (!originalJob || originalJob.retryCount >= originalJob.maxRetries) {
      return;
    }

    const retryJob: Job = {
      ...originalJob,
      id: uuidv4(),
      status: 'retrying',
      startTime: new Date(),
      endTime: null,
      exitCode: null,
      retryCount: originalJob.retryCount + 1,
      originalJobId: jobId,
      duration: null,
    };

    this.jobs.set(retryJob.id, retryJob);
    this.jobHistory.push(retryJob);

    try {
      await this.executeJob(retryJob);
    } catch (error) {
      retryJob.status = 'crashed';
      retryJob.endTime = new Date();
      retryJob.duration = retryJob.endTime.getTime() - retryJob.startTime.getTime();
    }
  }

  public getAllJobs(): JobResponse[] {
    return Array.from(this.jobs.values()).map(
      (job: Job): JobResponse => ({
        id: job.id,
        name: job.name,
        arguments: job.arguments,
        status: job.status,
        startTime: job.startTime,
        endTime: job.endTime,
        duration: job.duration,
        retryCount: job.retryCount,
        originalJobId: job.originalJobId || null,
      }),
    );
  }

  public getJobStats(): JobStats {
    const allJobs = this.jobHistory;
    const totalJobs = allJobs.length;

    if (totalJobs === 0) {
      return {
        totalJobs: 0,
        overallSuccessRate: 0,
        patterns: [],
      };
    }

    const successfulJobs = allJobs.filter((job: Job) => job.status === 'completed');
    const overallSuccessRate = successfulJobs.length / totalJobs;

    const patterns = this.analyzePatterns(allJobs, overallSuccessRate);

    return {
      totalJobs,
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      patterns,
    };
  }

  private analyzePatterns(jobs: Job[], overallSuccessRate: number): JobPattern[] {
    const patterns: JobPattern[] = [];

    patterns.push(this.analyzeJobNameLength(jobs, overallSuccessRate));
    patterns.push(this.analyzeJobNameDigits(jobs, overallSuccessRate));
    patterns.push(this.analyzeArgumentCount(jobs, overallSuccessRate));
    patterns.push(this.analyzeJobNamePrefix(jobs, overallSuccessRate));

    return patterns.filter((pattern: JobPattern) => pattern.matchCount > 0);
  }

  private analyzeJobNameLength: PatternAnalyzer = (jobs: Job[], overallRate: number): JobPattern => {
    const longNameJobs = jobs.filter((job: Job) => job.name.length > 10);
    const successRate =
      longNameJobs.length > 0
        ? longNameJobs.filter((job: Job) => job.status === 'completed').length / longNameJobs.length
        : 0;

    const difference = ((successRate - overallRate) * 100).toFixed(0);
    const differenceStr = difference.startsWith('-') ? difference + '%' : '+' + difference + '%';

    return {
      pattern: 'Job name length > 10',
      matchCount: longNameJobs.length,
      successRate: Math.round(successRate * 100) / 100,
      differenceFromAverage: differenceStr,
    };
  };

  private analyzeJobNameDigits: PatternAnalyzer = (jobs: Job[], overallRate: number): JobPattern => {
    const digitJobs = jobs.filter((job: Job) => /\d/.test(job.name));
    const successRate =
      digitJobs.length > 0 ? digitJobs.filter((job: Job) => job.status === 'completed').length / digitJobs.length : 0;

    const difference = ((successRate - overallRate) * 100).toFixed(0);
    const differenceStr = difference.startsWith('-') ? difference + '%' : '+' + difference + '%';

    return {
      pattern: 'Job name contains digits',
      matchCount: digitJobs.length,
      successRate: Math.round(successRate * 100) / 100,
      differenceFromAverage: differenceStr,
    };
  };

  private analyzeArgumentCount: PatternAnalyzer = (jobs: Job[], overallRate: number): JobPattern => {
    const highArgJobs = jobs.filter((job: Job) => job.arguments.length >= 3);
    const successRate =
      highArgJobs.length > 0
        ? highArgJobs.filter((job: Job) => job.status === 'completed').length / highArgJobs.length
        : 0;

    const difference = ((successRate - overallRate) * 100).toFixed(0);
    const differenceStr = difference.startsWith('-') ? difference + '%' : '+' + difference + '%';

    return {
      pattern: 'Jobs with 3+ arguments',
      matchCount: highArgJobs.length,
      successRate: Math.round(successRate * 100) / 100,
      differenceFromAverage: differenceStr,
    };
  };

  private analyzeJobNamePrefix: PatternAnalyzer = (jobs: Job[], overallRate: number): JobPattern => {
    const testJobs = jobs.filter((job: Job) => job.name.toLowerCase().startsWith('test'));
    const successRate =
      testJobs.length > 0 ? testJobs.filter((job: Job) => job.status === 'completed').length / testJobs.length : 0;

    const difference = ((successRate - overallRate) * 100).toFixed(0);
    const differenceStr = difference.startsWith('-') ? difference + '%' : '+' + difference + '%';

    return {
      pattern: "Job name starts with 'test'",
      matchCount: testJobs.length,
      successRate: Math.round(successRate * 100) / 100,
      differenceFromAverage: differenceStr,
    };
  };

  // Getter for platform (useful for testing)
  public get platformInfo(): Platform {
    return this.platform;
  }

  // Public method to get simulator command (useful for testing)
  public getSimulatorCommandInfo(): SimulatorCommand {
    return this.getSimulatorCommand();
  }
}
