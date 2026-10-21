## TrustVault — Secure Document Sharing

## About the Project

TrustVault is a secure document management and sharing application that I am developing as part of my Snovasys project work. The main idea is to allow users to upload documents, organize them, search for files, and share them with specific people without making the documents accessible to everyone.

While developing this project, I want to understand how authentication, authorization, cloud storage, and security monitoring work together in a real application. My main focus is not just making the application functional, but also ensuring that users can access only the documents and actions they are permitted to use.

## Problem Statement

Sharing documents through public links or storing files without proper access controls can expose private information. In a multi-user application, a user should not be able to access another user's documents simply by changing a document ID or calling an API directly.

TrustVault aims to address this problem through user authentication, document-level permissions, private cloud storage, and audit logging.

## Main Features

- User authentication and role-based access for administrators, document owners, and viewers.
- Document upload, organization, search, and management.
- Document-level read and edit permissions that owners can grant to specific users.
- Permission revocation so that subsequent requests are checked against the latest access rules.
- Server-side authorization checks for protected operations.
- Audit records for important actions, including uploads, downloads, document changes, deletions, and permission updates.
- An administrative view for reviewing relevant activity records.
- File validation and automated tests for access control and user isolation.

These are the intended features of the project. Features will be marked as implemented only after I have built and tested them.

## Technology Stack

- Next.js and React for the application interface and server-side functionality.
- TypeScript for application code.
- Tailwind CSS for styling.
- Supabase for authentication and PostgreSQL database functionality.
- Amazon S3 for private document storage.
- AWS IAM for controlling access to AWS resources.
- Amazon CloudWatch for operational monitoring and logs.
- Vitest and Playwright for testing application logic and user workflows.

## Current Progress

I have created the Next.js project, installed the initial dependencies, and confirmed that the application runs locally. I have also started the project documentation, created the initial Git commit, and pushed the repository to GitHub. An AWS budget alert has been configured to help monitor costs.

The Supabase configuration, database schema, authentication flow, document storage, permissions, audit logging, and automated security tests still need to be completed and verified. Deployment and the final demonstration will follow once the core functionality is working.

## Security Approach

TrustVault is being designed around the principle that access must be verified on the server for every protected operation. Hiding a button in the interface is not sufficient because a user may still attempt to call an API directly.

The document owner should be able to grant and revoke permissions for individual users. The application should check the current permission before allowing a document to be viewed, downloaded, edited, or deleted. Documents will be stored in a private S3 bucket rather than exposed through public URLs.

Audit records should capture who performed an action, what action was attempted, which document was involved when applicable, the result, and the time of the event. Sensitive document contents, passwords, access tokens, and secret keys should not be included in audit records.

## Running the Project Locally

Install Node.js and Git, clone the repository, and open the project directory in a terminal. Install the project dependencies using `npm install`.

Create a `.env.local` file in the project root and configure the required Supabase project URL and publishable key using the variable names documented in the project setup. Do not commit environment files or share secret credentials.

Start the development server with `npm run dev` and open `http://localhost:3000` in a browser.

Additional setup instructions will be added as the database, authentication, and storage integrations are implemented.

## Testing

Testing will cover normal document operations as well as attempts to bypass permissions. Important cases include accessing another user's document, changing a document ID, using an unauthorized HTTP request, attempting an edit with read-only access, and accessing a document after permission revocation.

The audit system will also need tests for missing events, altered records, and failed audit writes. Tests will be added alongside implementation, and results will be documented only after they have actually been run.

## Project Documentation

`THREATS.md` describes the main security risks, proposed mitigations, and tests for TrustVault.

`PROMPTS.md` records the AI assistance used during development, including the questions asked, the reasoning or suggestions received, corrections made, and the verification performed.

## Limitations and Next Steps

The project is still under development. Until the relevant features are implemented and tested, I will not claim that authentication, document authorization, audit integrity, cloud storage, or deployment is fully operational.

My next steps are to configure Supabase, design the database schema, implement authentication and document-level permissions, integrate private S3 storage, add audit logging, and write tests for the main security requirements. After that, I will work on deployment, monitoring, documentation, and a short demonstration of the completed application.

## AI Usage

I use AI assistance to understand unfamiliar concepts, plan the architecture, identify security risks, review code, and develop test cases. I am responsible for reviewing suggestions, correcting mistakes, running the code, and verifying whether the resulting implementation meets the project requirements.

The prompts and meaningful corrections will be documented in `PROMPTS.md`. AI-generated suggestions will not be treated as proof that a feature is secure unless the implementation and relevant tests support that conclusion.