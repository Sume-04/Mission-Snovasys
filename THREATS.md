# TrustVault Threat Model

## Assets to Protect

- Uploaded documents and their contents
- User accounts and sessions
- Document permissions
- Audit records
- Document metadata

## Threats and Mitigations

| Threat | Mitigation | Verification |
|---|---|---|
| Unauthorized document download | Server-side authorization on every retrieval | Test user without access |
| IDOR through document IDs | Check access to each requested document | Test another user's document ID |
| Access after revocation | Re-check current permission on each request | Revoke access, then retry |
| Unauthorized permission changes | Verify owner/admin policy on the server | Test a viewer attempting to share |
| Audit event tampering | Append-only design and integrity verification | Alter a test audit record and verify detection |

## Accepted Risks

Document limitations that cannot be eliminated,
including copies of plaintext already downloaded.

## Test Status

Mark each test as pending until it has actually run.