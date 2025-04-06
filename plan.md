# Plan: Enhancing the YouTube Video Processing Workflow

## 1. Introduction

The goal of this plan is to outline the steps required to enhance the existing YouTube video processing Step Function workflow. Key areas of focus include making the video download process more robust by implementing fallback mechanisms and improving the test suite's reliability and consistency.

## 2. Current State Summary

- **Functionality:** The current workflow accepts YouTube video IDs, saves metadata, downloads thumbnails, and attempts to download the video using `ytdl-core`. It uses S3, DynamoDB, Lambda, and Step Functions. API testing infrastructure is set up using VS Code REST Client.
- **Worklogs Reviewed:**
    - `2025-01-14-api-testing-setup.md`: Details API testing setup.
    - `2025-01-14-youtube-step-function.md`: Documents fixing an environment variable mismatch.
    - `2025-01-15-youtube-step-function.md`: Outlines the initial Step Function design.
- **Test Status (`npm run test`):**
    - 6 tests passed.
    - 4 tests failed due to timeouts (likely related to CDK resource interaction during integration/workflow tests):
        - `test/integration.test.ts > DynamoDB table has correct configuration`
        - `test/integration.test.ts > API Gateway is configured correctly`
        - `test/workflow.test.ts > state machine ARN is correctly exposed`
        - `test/workflow.test.ts > state machine has correct configuration`
- **Test Framework:** The project currently uses `vitest` as the primary test runner (`npm run test`), but `jest` dependencies and configuration (`jest.config.js`) are still present.

## 3. Proposed Enhancements

### 3.1. Robust Video Download

YouTube download libraries can sometimes become unreliable. To mitigate this, we will implement a fallback strategy.

- **Primary Method:** Use `ytdl-core` as the primary download method within the `download-video` Lambda function.
- **Fallback Method:** Research and integrate a secondary download approach. A strong candidate is using a wrapper around the `yt-dlp` command-line tool, as it's actively maintained and often handles problematic videos better. This might require a separate Lambda layer or bundling `yt-dlp` with the function.
- **Step Function Fallback Logic:**
    - Modify the Step Function definition.
    - Catch specific errors from the primary download method (`ytdl-core`).
    - On specific errors with the primary method, invoke the fallback download method (`yt-dlp`).
    - Define clear success/failure states for both primary and fallback methods.
    - Consider a "Manual Intervention Required" state if both methods fail.
- **Error Handling:** Improve error reporting within the Lambda functions to provide clearer reasons for download failures.

```mermaid
graph TD
    A[Start] --> B(Save Video ID);
    B --> C{Fetch Metadata};
    C --> D(Download Thumbnail);
    D --> E{Try Download (ytdl-core)};
    E -- Success --> F(Update Status: Downloaded);
    E -- Failure --> H{Try Download (yt-dlp)};
    H -- Success --> F;
    H -- Failure --> J(Update Status: Download Failed);
    F --> K(Process Video - Future);
    J --> L[End];
    K --> L;
```

### 3.2. Test Suite Improvements

- **Fix Failing Tests:**
    - Investigate the root cause of the timeouts in the 4 failing integration/workflow tests.
    - Potential solutions: Increase test timeouts specifically for these tests, improve mocking strategies for CDK resources, optimize CDK synthesis/deployment steps within the test setup.
- **Complete Vitest Migration:**
    - Remove `jest` and `ts-jest` from `devDependencies` in `package.json`.
    - Delete `jest.config.js`.
    - Ensure all tests (`*.test.ts`) are compatible with and run correctly using `vitest run`.
    - Update any test scripts or documentation referencing Jest.

### 3.3. Step Function and Lambda Updates

- **Modify `youtube-step-function-stack.ts`:** Update the Step Function definition (`StateMachine`) to reflect the new fallback logic for the download state.
- **Update `download-video.ts` Lambda:** Refactor to handle the primary download logic and return specific errors for the Step Function to catch, triggering the fallback.
- **Create `download-video-fallback.ts` Lambda (or integrate into primary):** Implement the `yt-dlp` download logic. This function would need `yt-dlp` available (e.g., via a layer or bundled).
- **Update `tag-video-status.ts` Lambda:** Ensure it correctly handles status updates related to download failures (e.g., `DOWNLOAD_FAILED`).

## 4. Implementation Steps (High-Level)

1.  **Fix Tests:** Address the 4 failing tests first to establish a stable baseline.
2.  **Migrate Tests:** Remove Jest dependencies and configuration, ensuring all tests pass with Vitest.
3.  **Research:** Confirm `yt-dlp` as the fallback and determine the best integration method (wrapper library, direct execution, Lambda layer).
4.  **Implement Download Logic:**
    *   Update the primary `download-video.ts` Lambda with improved error handling.
    *   Implement the fallback download mechanism (either in the same Lambda or a new one).
5.  **Update Step Function:** Modify the state machine definition in the CDK stack.
6.  **Testing:** Perform thorough unit, integration (using the fixed tests), and end-to-end testing (using `invoke-video.http`).
7.  **Deployment:** Deploy the updated stack.

## 5. Next Steps

- Review this plan for feedback and approval.
- Once approved, proceed to implementation (likely by switching to 'code' mode).