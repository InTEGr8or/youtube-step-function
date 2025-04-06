# Task: Fix Failing Tests

## Goal

Address the 4 failing tests identified in `plan.md` (section 3.2) to establish a stable baseline before implementing new features.

## Failing Tests

- `test/integration.test.ts > DynamoDB table has correct configuration` (Timeout)
- `test/integration.test.ts > API Gateway is configured correctly` (Timeout)
- `test/workflow.test.ts > state machine ARN is correctly exposed` (Timeout)
- `test/workflow.test.ts > state machine has correct configuration` (Timeout)

## Investigation Areas (from plan.md)

- **Test Timeouts:** Are the default timeouts too short for these CDK-interaction tests? Consider increasing them specifically for these test suites or globally via Vitest configuration.
- **CDK Resource Mocking:** Is the interaction with CDK resources being mocked effectively, or are the tests attempting real interactions that are slow or incomplete in the test environment?
- **CDK Synthesis/Deployment:** Are the CDK operations within the test setup (`beforeAll`, `beforeEach`) taking too long? Can they be optimized or performed less frequently?

## Acceptance Criteria

- All 10 tests pass when running `npm run test`.
- The root cause of the timeouts is understood and documented (if necessary).
- The solution applied is robust and doesn't mask underlying issues.

## Next Steps

- Investigate the specific code in `test/integration.test.ts` and `test/workflow.test.ts`.
- Analyze the test setup and teardown procedures.
- Experiment with potential solutions (increasing timeouts, improving mocks, optimizing CDK usage).

## Resolution (2025-04-06)

The failing tests were due to timeouts caused by CDK operations (stack instantiation and synthesis) exceeding the default 5-second Vitest timeout.

**Fix:** Increased the timeout to 30000ms (30 seconds) for the following tests:
- `test/integration.test.ts > DynamoDB table has correct configuration`
- `test/integration.test.ts > API Gateway is configured correctly`
- `test/workflow.test.ts > state machine ARN is correctly exposed`
- `test/workflow.test.ts > state machine has correct configuration`

**Result:** All 10 tests now pass when running `npm run test`.