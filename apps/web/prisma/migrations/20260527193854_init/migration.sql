-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT,
    "rawText" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResumeVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "canonicalCompanyName" TEXT,
    "canonicalRoleTitle" TEXT,
    "jobUrl" TEXT,
    "source" TEXT,
    "sourceJobId" TEXT,
    "rawDescription" TEXT,
    "location" TEXT,
    "workplaceType" TEXT NOT NULL DEFAULT 'unknown',
    "employmentType" TEXT NOT NULL DEFAULT 'unknown',
    "salaryText" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT,
    "salaryListed" BOOLEAN NOT NULL DEFAULT false,
    "seniorityLevel" TEXT,
    "requiredSkills" TEXT NOT NULL DEFAULT '[]',
    "niceToHaveSkills" TEXT NOT NULL DEFAULT '[]',
    "techStack" TEXT NOT NULL DEFAULT '[]',
    "responsibilities" TEXT NOT NULL DEFAULT '[]',
    "benefits" TEXT NOT NULL DEFAULT '[]',
    "redFlags" TEXT NOT NULL DEFAULT '[]',
    "extractedConfidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobPosting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "source" TEXT,
    "applicationMethod" TEXT,
    "appliedAt" DATETIME,
    "resumeVersionId" TEXT,
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
    CONSTRAINT "Application_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "gmailMessageId" TEXT NOT NULL,
    "gmailThreadId" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderName" TEXT,
    "subject" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL,
    "classification" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "reason" TEXT,
    "actionNeeded" BOOLEAN NOT NULL DEFAULT false,
    "suggestedNextAction" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "archivedInGmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "opportunityScore" INTEGER NOT NULL,
    "roleFitScore" INTEGER NOT NULL,
    "techStackFitScore" INTEGER NOT NULL,
    "compensationClarityScore" INTEGER NOT NULL,
    "growthPotentialScore" INTEGER,
    "companyStabilityScore" INTEGER,
    "strongestMatches" TEXT NOT NULL DEFAULT '[]',
    "possibleGaps" TEXT NOT NULL DEFAULT '[]',
    "redFlags" TEXT NOT NULL DEFAULT '[]',
    "resumeAngle" TEXT NOT NULL,
    "applicationStrategy" TEXT NOT NULL,
    "questionsToAsk" TEXT NOT NULL DEFAULT '[]',
    "concerns" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobAnalysis_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyResearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "industry" TEXT,
    "companySize" TEXT,
    "recentSignals" TEXT NOT NULL DEFAULT '[]',
    "stabilityNotes" TEXT NOT NULL DEFAULT '[]',
    "reputationNotes" TEXT NOT NULL DEFAULT '[]',
    "interviewPrepNotes" TEXT NOT NULL DEFAULT '[]',
    "sources" TEXT NOT NULL DEFAULT '[]',
    "researchedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyResearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyResearch_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "JobPosting_userId_sourceJobId_idx" ON "JobPosting"("userId", "sourceJobId");

-- CreateIndex
CREATE INDEX "JobPosting_userId_companyName_roleTitle_idx" ON "JobPosting"("userId", "companyName", "roleTitle");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobPostingId_key" ON "Application"("jobPostingId");

-- CreateIndex
CREATE INDEX "Application_userId_status_idx" ON "Application"("userId", "status");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_occurredAt_idx" ON "ApplicationEvent"("applicationId", "occurredAt");

-- CreateIndex
CREATE INDEX "EmailEvent_userId_classification_idx" ON "EmailEvent"("userId", "classification");

-- CreateIndex
CREATE UNIQUE INDEX "EmailEvent_userId_gmailMessageId_key" ON "EmailEvent"("userId", "gmailMessageId");

-- CreateIndex
CREATE INDEX "JobAnalysis_jobPostingId_idx" ON "JobAnalysis"("jobPostingId");
