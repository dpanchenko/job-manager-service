import axios, { AxiosResponse } from 'axios';
import { JobCreateResponse, JobsListResponse, JobStats } from './types';

const BASE_URL = 'http://localhost:3000';

interface TestJob {
  jobName: string;
  arguments: string[];
}

async function testJobSystem(): Promise<void> {
  console.log('Testing Job Manager Service...\n');

  try {
    const testJobs: TestJob[] = [
      { jobName: 'data-processor-1', arguments: ['input.csv', 'output.json'] },
      {
        jobName: 'test-batch-job',
        arguments: ['--verbose', '--debug', '--output=/tmp'],
      },
      { jobName: 'short', arguments: [] },
      {
        jobName: 'very-long-job-name-with-many-characters',
        arguments: ['arg1'],
      },
      { jobName: 'process42', arguments: ['data1', 'data2'] },
      { jobName: 'test-validation', arguments: ['--strict'] },
      { jobName: 'x-factor', arguments: ['input'] },
      {
        jobName: 'background-task',
        arguments: ['--async', '--timeout=30', '--retry=3'],
      },
    ];

    console.log('Starting multiple concurrent jobs...');
    const jobPromises = testJobs.map(
      async (
        job: TestJob,
        index: number,
      ): Promise<JobCreateResponse | null> => {
        try {
          const response: AxiosResponse<JobCreateResponse> = await axios.post(
            `${BASE_URL}/jobs`,
            job,
          );
          console.log(`Job ${index + 1} started: ${response.data.jobId}`);
          return response.data;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error(
              `Failed to start job ${index + 1}:`,
              error.response?.data || error.message,
            );
          } else {
            console.error(`Failed to start job ${index + 1}:`, error);
          }
          return null;
        }
      },
    );

    await Promise.all(jobPromises);
    console.log('\nAll jobs started. Waiting for completion...\n');

    await new Promise<void>((resolve) => setTimeout(resolve, 8000));

    console.log('Fetching job status...');
    const jobsResponse: AxiosResponse<JobsListResponse> = await axios.get(
      `${BASE_URL}/jobs`,
    );
    console.log('Current jobs:');
    console.log(JSON.stringify(jobsResponse.data, null, 2));

    console.log('\nFetching statistics...');
    const statsResponse: AxiosResponse<JobStats> = await axios.get(
      `${BASE_URL}/stats`,
    );
    console.log('Job Statistics:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Test failed:', error.response?.data || error.message);
    } else {
      console.error('Test failed:', error);
    }
  }
}

async function main(): Promise<void> {
  if (require.main === module) {
    await testJobSystem();
  }
}

main().catch((error: Error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

export { testJobSystem };
