import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { JobManager } from './job-manager';
import {
  JobCreateRequest,
  JobCreateResponse,
  JobsListResponse,
  JobStats,
  HealthResponse,
  ErrorResponse,
} from './types';

const app = express();
const port = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3000;
const jobManager = new JobManager();

app.use(cors());
app.use(express.json());

// POST /jobs endpoint
app.post(
  '/jobs',
  async (
    req: Request<{}, JobCreateResponse | ErrorResponse, JobCreateRequest>,
    res: Response<JobCreateResponse | ErrorResponse>,
  ): Promise<void> => {
    try {
      const { jobName, arguments: jobArgs = [] }: JobCreateRequest = req.body;

      if (!jobName) {
        res.status(400).json({
          error: 'jobName is required',
        } as ErrorResponse);
        return;
      }

      const jobId = await jobManager.startJob(jobName, jobArgs);

      res.status(201).json({
        message: 'Job started successfully',
        jobId: jobId,
        jobName: jobName,
        arguments: jobArgs,
      } as JobCreateResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to start job',
        details: errorMessage,
      } as ErrorResponse);
    }
  },
);

// GET /jobs endpoint
app.get('/jobs', (_req: Request, res: Response<JobsListResponse | ErrorResponse>) => {
  try {
    const jobs = jobManager.getAllJobs();
    res.json({
      totalJobs: jobs.length,
      jobs: jobs,
    } as JobsListResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to retrieve jobs',
      details: errorMessage,
    } as ErrorResponse);
  }
});

// GET /stats endpoint
app.get('/stats', (_req: Request, res: Response<JobStats | ErrorResponse>) => {
  try {
    const stats = jobManager.getJobStats();
    res.json(stats);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      details: errorMessage,
    } as ErrorResponse);
  }
});

// GET /health endpoint
app.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  } as HealthResponse);
});

// 404 handler
app.use((_req: Request, res: Response<ErrorResponse>) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: ['POST /jobs', 'GET /jobs', 'GET /stats', 'GET /health'],
  } as ErrorResponse);
});

// Error handler
app.use((error: Error, _req: Request, res: Response<ErrorResponse>, _next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message,
  } as ErrorResponse);
});

// Start server
app.listen(port, () => {
  console.log(`Job Manager Service running on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  POST http://localhost:${port}/jobs`);
  console.log(`  GET  http://localhost:${port}/jobs`);
  console.log(`  GET  http://localhost:${port}/stats`);
  console.log(`  GET  http://localhost:${port}/health`);
});

export { app, jobManager };
