# Bug Report Example

## Summary

`runDelegateGaiaTool` sometimes reports `parse_failed` even though response text includes valid JSON.

## Symptoms

- Command output includes: `No JSON object found in response`
- `.gaia/<unit>/plan.md` is written, but parsed contract metadata is missing.

## Repro Steps

1. Call `runDelegateGaiaTool` with model response wrapped in extra prose and fenced JSON.
2. Observe `parse_failed` status.

## Expected

- Fenced JSON should be extracted and parsed.
- Status should be `ok` or `retry_succeeded`.

## Observed

- Status is `parse_failed`.
- Parse error references missing JSON object.
