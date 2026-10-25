# TrustVault
### Secure Document Sharing with an Audit Trail

TrustVault is a secure document-sharing application designed to help users upload, organize, access, and share documents with controlled permissions. It uses server-side authorization and maintains an audit trail of important document activities.

## Problem Statement

Sharing sensitive documents through ordinary file-sharing methods can lead to unauthorized access, uncontrolled downloads, and limited visibility into document activity.

TrustVault addresses these challenges through authenticated access, document-level permissions, private cloud storage, and activity tracking.

## Features

- User authentication using Supabase
- Document upload and management
- Private document storage using Amazon S3
- Document-level access control
- Read and download permissions
- Share and revoke document access
- Server-side authorization checks
- Document activity audit trail
- Administrative activity dashboard
- File type and size validation
- Document search and organization

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework |
| TypeScript | Type-safe development |
| Supabase Auth | User authentication |
| Supabase Database | Document metadata, permissions, and audit records |
| Amazon S3 | Private document storage |
| AWS SDK | Secure interaction with S3 |
| Tailwind CSS | User interface styling |

## Architecture

1. Users authenticate through Supabase.
2. The application requests a temporary upload URL from its authenticated API.
3. The browser uploads the document directly to the private S3 bucket.
4. The server verifies the uploaded object's metadata and performs basic content-signature validation.
5. Validated document metadata is saved in Supabase.
6. Document access is checked on the server before protected operations.
7. Important activities are recorded in the audit trail.
8. Authorized administrators can view document activity.

## Security Design

- Private S3 bucket for document storage
- Temporary presigned URLs instead of public object URLs
- Server-side authentication and authorization
- Owner-scoped S3 object keys
- Document-level permission checks
- Permission revocation
- Upload size and allowed-type restrictions
- Basic file content-signature validation
- Audit logging for important document operations

## Supported Upload Types

- PDF
- JPEG
- PNG
- Plain text
- DOCX

Maximum upload size: 10 MB.

## Known Limitations

- Basic file-signature validation is not a complete file-format parser or malware scanner.
- Invalid or abandoned uploads may leave objects in S3 until cleanup is performed.
- Audit logging failures are reported in server logs and may not undo an already completed document operation.
- The project requires further security testing and production hardening before handling highly sensitive documents.

## Local Development

Install dependencies:

bash
npm install

Configure the required environment variables in `.env.local`.

Start the development server:

bash
npm run dev


Create a production build:

bash
npm run build

## Project Status

The production build completes successfully, including compilation, TypeScript validation, and static page generation.

TrustVault was developed as a security-focused document-sharing project demonstrating authentication, cloud storage, authorization, and audit logging.