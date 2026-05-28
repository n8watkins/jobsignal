-- CreateTable
CREATE TABLE "RecruiterContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "firmName" TEXT,
    "email" TEXT,
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "trustLevel" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecruiterContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'linkedin',
    "sourceJobId" TEXT,
    "jobUrl" TEXT,
    "companyName" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "location" TEXT,
    "salaryText" TEXT,
    "salaryListed" BOOLEAN NOT NULL DEFAULT false,
    "workArrangement" TEXT NOT NULL DEFAULT 'unknown',
    "employmentType" TEXT NOT NULL DEFAULT 'unknown',
    "contractDuration" TEXT,
    "hoursPerWeek" TEXT,
    "rawCardText" TEXT,
    "rawDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sourced',
    "fitScore" INTEGER,
    "scoreLabel" TEXT,
    "scoreReasons" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "requiredTechnologies" TEXT NOT NULL DEFAULT '[]',
    "preferredTechnologies" TEXT NOT NULL DEFAULT '[]',
    "matchedTechnologies" TEXT NOT NULL DEFAULT '[]',
    "missingTechnologies" TEXT NOT NULL DEFAULT '[]',
    "emphasisAreas" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CandidateJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CandidateJobAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateJobId" TEXT NOT NULL,
    "overallFitScore" INTEGER NOT NULL,
    "techMatchScore" INTEGER,
    "seniorityFitScore" INTEGER,
    "compensationScore" INTEGER,
    "requiredTechnologies" TEXT NOT NULL DEFAULT '[]',
    "preferredTechnologies" TEXT NOT NULL DEFAULT '[]',
    "matchedTechnologies" TEXT NOT NULL DEFAULT '[]',
    "missingTechnologies" TEXT NOT NULL DEFAULT '[]',
    "emphasisAreas" TEXT NOT NULL DEFAULT '[]',
    "likelyDayToDay" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "interviewPrepTopics" TEXT NOT NULL DEFAULT '[]',
    "workArrangement" TEXT NOT NULL DEFAULT 'unknown',
    "employmentType" TEXT NOT NULL DEFAULT 'unknown',
    "seniorityLevel" TEXT NOT NULL DEFAULT 'unknown',
    "reportingLine" TEXT,
    "resumePositioning" TEXT,
    "summary" TEXT,
    "analysisMethod" TEXT NOT NULL DEFAULT 'heuristic',
    "model" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateJobAnalysis_candidateJobId_fkey" FOREIGN KEY ("candidateJobId") REFERENCES "CandidateJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobSearchProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetRoles" TEXT NOT NULL DEFAULT '[]',
    "strongTechnologies" TEXT NOT NULL DEFAULT '[]',
    "secondaryTechnologies" TEXT NOT NULL DEFAULT '[]',
    "learningTechnologies" TEXT NOT NULL DEFAULT '[]',
    "avoidTerms" TEXT NOT NULL DEFAULT '[]',
    "preferredWorkArrangement" TEXT NOT NULL DEFAULT 'remote_or_hybrid',
    "preferredEmploymentType" TEXT NOT NULL DEFAULT 'full_time',
    "salaryFloor" INTEGER,
    "preferredLocation" TEXT,
    "recruiterTolerance" TEXT NOT NULL DEFAULT 'neutral',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobSearchProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "candidateJobId" TEXT,
    "applicationId" TEXT,
    "taskType" TEXT NOT NULL,
    "budgetCategory" TEXT NOT NULL DEFAULT 'baseline',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "reason" TEXT,
    "prompt" TEXT,
    "searchCostEstimate" INTEGER NOT NULL DEFAULT 1,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 2,
    "resultQualityScore" INTEGER,
    "scheduledFor" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "officialWebsite" TEXT,
    "summary" TEXT,
    "productCategory" TEXT,
    "customerSegment" TEXT,
    "companySize" TEXT,
    "companyStage" TEXT,
    "hiringSignalScore" INTEGER,
    "riskScore" INTEGER,
    "sourceQualityScore" INTEGER,
    "profileCompletenessScore" INTEGER,
    "missingFields" TEXT NOT NULL DEFAULT '[]',
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "keySources" TEXT NOT NULL DEFAULT '[]',
    "researchStatus" TEXT NOT NULL DEFAULT 'not_started',
    "lastResearchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCost" REAL,
    "searchEnabled" BOOLEAN NOT NULL DEFAULT false,
    "searchQueries" INTEGER,
    "candidateJobId" TEXT,
    "applicationId" TEXT,
    "emailEventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AiBudgetLedger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "budgetCategory" TEXT NOT NULL,
    "searchUsed" BOOLEAN NOT NULL DEFAULT false,
    "searchRequests" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" REAL,
    "researchTaskId" TEXT,
    "candidateJobId" TEXT,
    "applicationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "candidateJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "source" TEXT,
    "applicationMethod" TEXT,
    "applicationSourceType" TEXT NOT NULL DEFAULT 'unknown',
    "recruiterContactId" TEXT,
    "recruiterName" TEXT,
    "recruiterCompany" TEXT,
    "recruiterNotes" TEXT,
    "appliedAt" DATETIME,
    "resumeVersionId" TEXT,
    "resumeLabel" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "lastContactAt" DATETIME,
    "nextAction" TEXT,
    "actionNeeded" BOOLEAN NOT NULL DEFAULT false,
    "interestLevel" INTEGER,
    "notes" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_candidateJobId_fkey" FOREIGN KEY ("candidateJobId") REFERENCES "CandidateJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Application_recruiterContactId_fkey" FOREIGN KEY ("recruiterContactId") REFERENCES "RecruiterContact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Application_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("actionNeeded", "applicationMethod", "appliedAt", "archivedAt", "contactEmail", "contactName", "createdAt", "id", "interestLevel", "jobPostingId", "lastContactAt", "nextAction", "notes", "resumeVersionId", "source", "status", "updatedAt", "userId") SELECT "actionNeeded", "applicationMethod", "appliedAt", "archivedAt", "contactEmail", "contactName", "createdAt", "id", "interestLevel", "jobPostingId", "lastContactAt", "nextAction", "notes", "resumeVersionId", "source", "status", "updatedAt", "userId" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE UNIQUE INDEX "Application_jobPostingId_key" ON "Application"("jobPostingId");
CREATE UNIQUE INDEX "Application_candidateJobId_key" ON "Application"("candidateJobId");
CREATE INDEX "Application_userId_status_idx" ON "Application"("userId", "status");
CREATE INDEX "Application_userId_applicationSourceType_idx" ON "Application"("userId", "applicationSourceType");
CREATE INDEX "Application_userId_recruiterCompany_idx" ON "Application"("userId", "recruiterCompany");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RecruiterContact_userId_firmName_idx" ON "RecruiterContact"("userId", "firmName");

-- CreateIndex
CREATE INDEX "RecruiterContact_userId_email_idx" ON "RecruiterContact"("userId", "email");

-- CreateIndex
CREATE INDEX "CandidateJob_userId_status_idx" ON "CandidateJob"("userId", "status");

-- CreateIndex
CREATE INDEX "CandidateJob_userId_sourceJobId_idx" ON "CandidateJob"("userId", "sourceJobId");

-- CreateIndex
CREATE INDEX "CandidateJob_userId_companyName_roleTitle_idx" ON "CandidateJob"("userId", "companyName", "roleTitle");

-- CreateIndex
CREATE INDEX "CandidateJobAnalysis_candidateJobId_createdAt_idx" ON "CandidateJobAnalysis"("candidateJobId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobSearchProfile_userId_key" ON "JobSearchProfile"("userId");

-- CreateIndex
CREATE INDEX "ResearchTask_status_priority_idx" ON "ResearchTask"("status", "priority");

-- CreateIndex
CREATE INDEX "ResearchTask_companyName_idx" ON "ResearchTask"("companyName");

-- CreateIndex
CREATE INDEX "ResearchTask_candidateJobId_idx" ON "ResearchTask"("candidateJobId");

-- CreateIndex
CREATE INDEX "ResearchTask_applicationId_idx" ON "ResearchTask"("applicationId");

-- CreateIndex
CREATE INDEX "ResearchTask_budgetCategory_status_idx" ON "ResearchTask"("budgetCategory", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_companyName_key" ON "CompanyProfile"("companyName");

-- CreateIndex
CREATE INDEX "CompanyProfile_profileCompletenessScore_idx" ON "CompanyProfile"("profileCompletenessScore");

-- CreateIndex
CREATE INDEX "CompanyProfile_researchStatus_idx" ON "CompanyProfile"("researchStatus");

-- CreateIndex
CREATE INDEX "AiUsageLog_feature_createdAt_idx" ON "AiUsageLog"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_candidateJobId_idx" ON "AiUsageLog"("candidateJobId");

-- CreateIndex
CREATE INDEX "AiUsageLog_applicationId_idx" ON "AiUsageLog"("applicationId");

-- CreateIndex
CREATE INDEX "AiBudgetLedger_dateKey_provider_model_idx" ON "AiBudgetLedger"("dateKey", "provider", "model");

-- CreateIndex
CREATE INDEX "AiBudgetLedger_budgetCategory_dateKey_idx" ON "AiBudgetLedger"("budgetCategory", "dateKey");

-- CreateIndex
CREATE INDEX "AiBudgetLedger_researchTaskId_idx" ON "AiBudgetLedger"("researchTaskId");

-- CreateIndex
CREATE INDEX "AiBudgetLedger_candidateJobId_idx" ON "AiBudgetLedger"("candidateJobId");

-- CreateIndex
CREATE INDEX "AiBudgetLedger_applicationId_idx" ON "AiBudgetLedger"("applicationId");
