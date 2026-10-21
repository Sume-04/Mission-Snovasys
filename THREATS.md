## TrustVault — Threat Model and Security Plan

 1. Purpose

TrustVault aims to protect documents, user accounts, sharing permissions, and audit records. This document outlines the main security risks and planned mitigations. Controls will be considered verified only after testing.

2. Main Threats and Mitigations

- Unauthorized Access: Users may access other users' documents by changing IDs or calling APIs directly. Every protected server operation must verify authentication and document permissions.

- Permission Misuse: Viewers may attempt to edit documents or users may try to gain administrator privileges. Roles and permissions must be validated on the server.

- Access After Revocation: Previously authorized users may attempt to reuse old links. Keep files private and check current permissions on subsequent requests. Previously downloaded files cannot be recalled.

- Unauthorized Changes: Users may try to modify or delete documents without permission. Verify ownership and edit or delete permissions before performing operations.

- Cloud Storage Exposure: Incorrect S3 settings or leaked credentials may expose files. Use private storage, enable S3 Block Public Access, apply least-privilege IAM policies, and protect secrets.

- Audit Tampering: Audit records may be altered or deleted. Record important successful and denied actions, and use integrity verification to help detect tampering. A hash chain alone cannot prevent complete history rewriting.

- Audit Failures: Operations may succeed without their required audit records. Design reliable audit writes and define safe behavior when logging fails.

- Unsafe File Uploads: Oversized, invalid, or misleading files may introduce risks. Validate uploads on the server and generate safe storage object names.

- Information Leakage: Sensitive metadata, documents, or credentials may appear in API responses, logs, or Git. Restrict returned data and never commit secrets.

- Session and Request Abuse: Invalid sessions, malicious inputs, and repeated requests may threaten security. Validate requests, use secure session handling, and apply suitable rate limits.

3. Security Principles

TrustVault will follow these principles:

- Deny access by default and enforce authorization on the server.
- Apply least privilege to database access and AWS permissions.
- Keep documents private and validate every protected operation.
- Record relevant security events without logging secrets or document contents.
- Validate uploaded files and user inputs.
- Test unauthorized access, permission revocation, and audit integrity.

4. Security Testing Plan

Planned tests will verify that users cannot access each other's documents, viewers cannot edit or delete files, permissions cannot be self-assigned, and revoked access is denied on subsequent requests. Additional tests will cover private S3 access, invalid uploads, sensitive data exposure, missing audit events, and audit tampering.

Actual test results will be documented after implementation and execution.

5. Accepted Risks and Current Status

Users may retain copies of documents downloaded before access was revoked. Audit mechanisms can detect certain forms of tampering but cannot guarantee integrity if all administrative controls and verification data are compromised. Cloud services may also incur costs; budget alerts do not guarantee a spending limit.

The project foundation and initial documentation are complete. Authentication, database permissions, private S3 integration, audit logging, and automated security tests remain under development or planned. This document will be updated as features are implemented and verified.