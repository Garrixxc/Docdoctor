# DocDoctor - Data-to-Dataset Studio

Production-grade MVP for a self-serve document-to-structured-dataset platform. Extract structured data from documents (PDFs) using LLMs, review in-app with confidence scores and evidence, and export to CSV.

## Features

- **Multi-tenant Workspaces**: Secure workspace isolation with RBAC (Owner, Admin, Member, Reviewer)
- **Vertical Templates**: COI (Certificate of Insurance) template with extensible blueprint system
- **Document Upload**: Direct S3 upload with presigned URLs
- **LLM Extraction**: OpenAI-powered extraction with confidence scores and evidence snippets
- **Validation Engine**: Configurable rules (date checks, thresholds, required fields)
- **Review Workflow**: In-app review with inline editing, approval, and audit trail
- **Background Jobs**: BullMQ with retries, exponential backoff, and job deduplication
- **CSV Export**: Export approved datasets with download links
- **Futureproof Architecture**: Swappable LLM providers, chunking strategies, and template system

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Email + Google OAuth)
- **Queue**: BullMQ + Redis
- **Storage**: AWS S3
- **LLM**: OpenAI API (supports BYO API keys)
- **UI**: Tailwind CSS + shadcn/ui

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server
- AWS S3 bucket
- OpenAI API key (optional: users can bring their own)

### Installation

1. **Clone and install dependencies:**

\`\`\`bash
cd /path/to/DocDoctor
npm install
\`\`\`

2. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in your values:

\`\`\`bash
cp .env.example .env
\`\`\`

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXTAUTH_SECRET`: Random secret (generate with \`openssl rand -base64 32\`)
- `AWS_*`: AWS credentials and S3 bucket name
- `OPENAI_API_KEY`: Platform default API key
- `ENCRYPTION_KEY`: For encrypting BYO API keys (generate with \`openssl rand -base64 32\`)

3. **Set up database:**

\`\`\`bash
npx prisma generate
npx prisma db push
npm run db:seed
\`\`\`

4. **Start development servers:**

Terminal 1 - Next.js dev server:
\`\`\`bash
npm run dev
\`\`\`

Terminal 2 - Background worker:
\`\`\`bash
npm run worker
\`\`\`

5. **Access the app:**

Open [http://localhost:3000](http://localhost:3000)

Default demo user: \`demo@docdoctor.app\`

## Project Structure

\`\`\`
/app                    # Next.js App Router pages
  /api                  # API routes
  /dashboard            # Main dashboard
  /projects             # Project pages
/lib                    # Core business logic
  /auth                 # Authentication & RBAC
  /llm                  # LLM provider abstraction
  /processing           # Document processing pipeline
  /queues               # BullMQ queues and workers
  /storage              # S3 client
  /templates            # Vertical templates (COI)
  /utils                # Utilities (encryption, logging, cost)
/components/ui          # shadcn/ui components
/prisma                 # Database schema and seed
\`\`\`

## Core Workflows

### 1. Create Project

1. Choose vertical template (e.g., COI)
2. Set project requirements (min liability limits)
3. Configure extraction settings (model, chunking)
4. Optionally provide BYO API key

### 2. Upload Documents

1. Navigate to project
2. Upload PDF files (presigned S3 URLs)
3. Documents registered in database

### 3. Process Run

1. Trigger "Start New Run"
2. Background job: parse → chunk → LLM extract → validate → persist
3. Monitor progress in UI

### 4. Review & Approve

1. Navigate to review page
2. See extracted fields with confidence scores
3. Edit values if needed
4. Approve fields
5. All changes tracked in audit trail

### 5. Export Dataset

1. Click "Export to CSV"
2. Download CSV with approved records
3. Export saved to S3 with metadata

## Deployment

### Vercel (App)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### AWS (Infrastructure)

- **RDS PostgreSQL**: Set up managed Postgres instance
- **S3**: Create bucket with CORS enabled
- **ElastiCache/Upstash**: Redis for BullMQ

### Worker Process

Deploy as separate long-running process:
- **Render/Railway**: Easy deployment
- **EC2**: Full control
- **Docker**: Containerized deployment

Run command: \`npm run worker\`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | \`postgresql://user:pass@host:5432/db\` |
| `REDIS_URL` | Redis connection string | \`redis://localhost:6379\` |
| `NEXTAUTH_URL` | App URL | \`http://localhost:3000\` |
| `NEXTAUTH_SECRET` | Random secret for JWT | \`<32-char-random>\` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | \`<google-client-id>\` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | \`<google-secret>\` |
| `AWS_REGION` | AWS region | \`us-east-1\` |
| `AWS_ACCESS_KEY_ID` | AWS credentials | \`<aws-key>\` |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | \`<aws-secret>\` |
| `S3_BUCKET_NAME` | S3 bucket for uploads | \`docdoctor-uploads\` |
| `OPENAI_API_KEY` | Platform OpenAI key | \`sk-...\` |
| `ENCRYPTION_KEY` | For BYO API keys | \`<32-char-random>\` |

## Scripts

- \`npm run dev\` - Start Next.js dev server
- \`npm run build\` - Production build
- \`npm run start\` - Start production server
- \`npm run worker\` - Start background worker
- \`npm run db:generate\` - Generate Prisma client
- \`npm run db:push\` - Push schema to database
- \`npm run db:migrate\` - Run migrations
- \`npm run db:seed\` - Seed database

## Security

- Multi-tenant query scoping (all queries filtered by workspace)
- API key encryption at rest (AES-256-GCM)
- RBAC enforcement on all routes
- Prompt injection safety (documents treated as untrusted input)
- Cost guardrails (configurable limits per run)
- Rate limiting (per workspace)

## Future Enhancements

- Additional vertical templates (invoices, receipts, contracts)
- Multiple LLM providers (Anthropic, Azure OpenAI)
- OCR support for image documents
- Webhook integrations
- Google Sheets export
- Automated workflows (expiring soon reminders)
- Advanced confidence tuning
- Batch processing

## License

Proprietary

## Support

For issues or questions, contact support@docdoctor.app
