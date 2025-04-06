# Task: Implement Robust Download Logic

## Goal

Implement the primary (`ytdl-core`) and fallback (`yt-dlp`) download mechanisms within the Lambda environment and integrate them into the Step Function workflow, as outlined in `plan.md` (sections 3.1, 3.3) and the main worklog (`docs/worklog/2025-04-06-planning-and-test-fixing.md`, step 4).

## Implementation Steps

1.  **Create Lambda Layer:**
    *   Create a directory structure (e.g., `lambda-layers/yt-dlp-layer/python/bin`).
    *   Download the latest `yt-dlp` executable and place it in `python/bin`.
    *   Determine if bundling Python is necessary or if the target Lambda runtime's Python is sufficient. If needed, install a minimal Python distribution into the layer structure.
    *   Check for any `yt-dlp` Python dependencies and install them into the layer (`python/lib/pythonX.Y/site-packages`).
    *   Zip the contents of the `python` directory.
    *   Define this layer in the CDK stack (`youtube-step-function-stack.ts`) and associate it with the relevant Lambda function(s).

2.  **Install `yt-dlp-exec`:**
    *   Add `yt-dlp-exec` to `devDependencies` in `package.json`.
    *   Ensure the install command uses the `YOUTUBE_DL_SKIP_DOWNLOAD=true` environment variable (e.g., update build scripts or CI/CD). Run `npm install`.

3.  **Update Primary Download Lambda (`lib/lambda-handlers/download-video.ts`):**
    *   Refactor the existing `ytdl-core` logic.
    *   Improve error handling to catch specific `ytdl-core` errors that should trigger the fallback.
    *   Return a specific error structure or message that the Step Function can catch to initiate the fallback state.

4.  **Implement Fallback Download Lambda (New or Existing):**
    *   Decide whether to add the fallback logic to the existing `download-video.ts` or create a new `download-video-fallback.ts`. (A separate function might be cleaner for separation of concerns and potentially different resource needs).
    *   If creating a new function, define it in the CDK stack (`lib/youtube-step-function-stack.ts`) and ensure it has the `yt-dlp` layer attached.
    *   In the fallback handler:
        *   Import and instantiate `yt-dlp-exec`, pointing it to the binary path within the layer (e.g., `/opt/bin/yt-dlp`).
        *   Use `youtubedl.exec()` to run `yt-dlp` with appropriate flags (e.g., specifying output format, potentially outputting to stdout).
        *   Implement streaming: Pipe the `stdout` of the `yt-dlp` subprocess to an `S3.ManagedUpload` stream, similar to the `cloudonaut.io` example.
        *   Handle errors from the `yt-dlp` process.

5.  **Update Status Tagging Lambda (`lib/lambda-handlers/tag-video-status.ts`):**
    *   Ensure it can handle potential new status values related to download failures or fallback attempts if needed.

## Acceptance Criteria

- A Lambda layer containing `yt-dlp` (and Python if necessary) is created and deployable via CDK.
- The `yt-dlp-exec` package is installed correctly without attempting to download the binary during install.
- The primary download Lambda uses `ytdl-core` and triggers a fallback on specific errors.
- The fallback mechanism uses `yt-dlp` via the layer and streams the download to S3.
- Both download methods update status appropriately (either directly or via the Step Function flow).

## Next Steps

- Begin implementation, starting with creating the Lambda Layer structure and contents.