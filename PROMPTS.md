# AI Prompt and Development Log

This file documents how I use AI to plan, develop, review, and troubleshoot TrustVault. I verify suggestions instead of assuming generated code is correct.

## Entry 1 — 21 October 2026: Project Setup

Prompt: Help me plan TrustVault, a secure document-sharing application using Next.js, TypeScript, Supabase, and AWS, with beginner-friendly setup instructions.

Outcome: Created the Next.js project, installed dependencies, ran the application locally, prepared documentation, and pushed the initial Git commit.

Verification: Local application startup and Git setup were checked. Security features were not yet verified.

## Entry 2 — 21 October 2026: Document Authorization

Prompt: Explain how to prevent users from accessing other users' documents by changing document IDs or calling APIs directly.

Learning: Hiding interface elements is insufficient. Every protected server operation must authenticate the requester and verify the required document permission.

Verification: Implementation and cross-user authorization tests are pending.

## Entry 3 — 21 October 2026: Audit Logging

Prompt: Design an audit trail for document operations, permission changes, and denied access attempts, including a method to detect tampering.

Learning: Audit events should record the actor, action, outcome, timestamp, and relevant request details without exposing secrets. A hash chain can help detect tampering but cannot independently prevent complete history rewriting.

Verification: Audit implementation and integrity tests are pending.

## Entry 4 — 21 October 2026: Private AWS Storage

Prompt: Explain how to store TrustVault documents securely in Amazon S3 while preventing public access and supporting permission revocation.

Learning: Use a private bucket, Block Public Access, least-privilege IAM permissions, and server-side authorization before protected file access. Previously downloaded files cannot be recalled.

Verification: S3 configuration and protected document access are pending.

## Entry 5 — 21 October 2026: Security Testing

Prompt: Suggest tests for cross-user isolation, read-only access, permission revocation, and audit logging that detect missing authorization checks.

Learning: Tests should use separate users, attempt unauthorized server requests, verify that protected data remains inaccessible, and check expected audit events.

Verification: Test implementation and execution are pending.

## Responsible AI Usage

I use AI to support learning, implementation planning, and security reviews. I review generated suggestions, investigate problems, and document actual corrections and test results. I will add commit links when the related changes are committed and pushed.