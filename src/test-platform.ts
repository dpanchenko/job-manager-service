import { JobManager } from './job-manager';
import { JobResponse, JobStats } from './types';

async function testCrossPlatform(): Promise<void> {
  console.log('Testing cross-platform functionality...\n');

  const jobManager = new JobManager();

  console.log('Platform detected:', jobManager.platformInfo);
  console.log('Simulator config:', jobManager.getSimulatorCommandInfo());
  console.log('');

  console.log('Testing direct job execution...');
  try {
    const jobId: string = await jobManager.startJob('platform-test', [
      'cross-platform',
      'test',
    ]);
    console.log('✓ Job started:', jobId);

    // Wait a bit for job to complete
    await new Promise<void>((resolve) => setTimeout(resolve, 3000));

    const jobs: JobResponse[] = jobManager.getAllJobs();
    console.log('✓ Jobs retrieved:', jobs.length);

    jobs.forEach((job: JobResponse) => {
      console.log(`  - ${job.name}: ${job.status} (${job.duration}ms)`);
    });

    const stats: JobStats = jobManager.getJobStats();
    console.log(
      '✓ Stats generated:',
      stats.totalJobs,
      'jobs,',
      stats.overallSuccessRate,
      'success rate',
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('✗ Test failed:', errorMessage);
  }
}

async function main(): Promise<void> {
  if (require.main === module) {
    await testCrossPlatform();
  }
}

main().catch((error: Error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

export { testCrossPlatform };
