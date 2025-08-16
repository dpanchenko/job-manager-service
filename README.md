# Job Manager Service

A cross-platform TypeScript/Node.js backend service that manages concurrent C++ processing jobs with REST API endpoints and statistical analysis.

## Features

- **Cross-Platform Support**: Runs on Windows, macOS, and Linux
- **Concurrent Job Execution**: Start and monitor multiple jobs simultaneously
- **Retry Logic**: Failed jobs are automatically retried once
- **Statistical Analysis**: Analyze job patterns and success correlations
- **REST API**: Control and monitor jobs via HTTP endpoints

## Setup and Usage

1. Install dependencies:

```bash
npm install
```

2. Build TypeScript:

```bash
npm run build
```

3. Start the server:

```bash
npm start
```

4. Development mode (with auto-reload):

```bash
npm run dev
```

5. Test the system:

```bash
npm test
npm run test:platform
```

## Cross-Platform Architecture

The service automatically detects the operating system and uses the appropriate job simulator:

- **Windows**: Uses `cpp-simulator.bat` (batch script)
- **macOS/Linux**: Uses `cpp-simulator.sh` (shell script)

Both simulators provide identical functionality with 70% success rate for testing purposes.

## Project Structure

```
src/
├── types.ts              # TypeScript type definitions
├── job-manager.ts         # Core job management and statistics logic
├── server.ts              # Main Express.js server
├── test-client.ts         # API test client
└── test-platform.ts       # Cross-platform functionality test

dist/                      # Compiled JavaScript output
cpp-simulator.bat          # Dummy C++ job simulator for Windows
cpp-simulator.sh           # Dummy C++ job simulator for macOS/Linux
tsconfig.json             # TypeScript configuration
package.json              # Dependencies and scripts
```

## API Endpoints

### POST /jobs

Start a new job.

**Request Body:**

```json
{
  "jobName": "my-task-42",
  "arguments": ["arg1", "arg2"]
}
```

**Response:**

```json
{
  "message": "Job started successfully",
  "jobId": "uuid-here",
  "jobName": "my-task-42",
  "arguments": ["arg1", "arg2"]
}
```

### GET /jobs

Get all jobs and their statuses.

**Response:**

```json
{
  "totalJobs": 5,
  "jobs": [
    {
      "id": "uuid",
      "name": "job-name",
      "arguments": ["arg1"],
      "status": "completed",
      "startTime": "2024-01-01T00:00:00.000Z",
      "endTime": "2024-01-01T00:00:03.000Z",
      "duration": 3000,
      "retryCount": 0
    }
  ]
}
```

### GET /stats

Get statistical analysis of job patterns.

**Response:**

```json
{
  "totalJobs": 100,
  "overallSuccessRate": 0.68,
  "patterns": [
    {
      "pattern": "Job name length > 10",
      "matchCount": 24,
      "successRate": 0.83,
      "differenceFromAverage": "+15%"
    }
  ]
}
```

## Job Statuses

- `running`: Job is currently executing
- `completed`: Job finished successfully (exit code 0)
- `failed`: Job finished with error (exit code 1)
- `crashed`: Job crashed unexpectedly
- `retrying`: Job is being retried after failure

## Statistical Patterns Analyzed

1. **Job name length > 10**: Longer names may correlate with success
2. **Job name contains digits**: Numeric patterns in job names
3. **Jobs with 3+ arguments**: Higher argument count correlation
4. **Job name starts with 'test'**: Test job performance patterns

## Requirements

- Node.js LTS (tested on 20, 22)
- TypeScript 5.0+
- Operating System: Windows, macOS, or Linux
- Dependencies: express, cors, uuid, axios (production)
- Dev Dependencies: typescript, ts-node, @types/\* (development)
