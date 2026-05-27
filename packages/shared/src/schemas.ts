import { z } from "zod";
import { APPLICATION_STATUSES, EMAIL_CLASSIFICATIONS, SOURCES } from "./constants";

export const ApplicationStatusSchema = z.enum(APPLICATION_STATUSES);
export const EmailClassificationSchema = z.enum(EMAIL_CLASSIFICATIONS);
export const SourceSchema = z.enum(SOURCES);

export const CapturedJobSchema = z.object({
  source: SourceSchema.default("generic"),
  sourceJobId: z.string().optional(),
  jobUrl: z.string().url().optional(),
  companyName: z.string().min(1).optional(),
  roleTitle: z.string().min(1).optional(),
  location: z.string().optional(),
  workplaceType: z.enum(["remote", "hybrid", "onsite", "unknown"]).default("unknown"),
  employmentType: z.enum(["full_time", "contract", "part_time", "internship", "unknown"]).default("unknown"),
  salaryText: z.string().nullable().optional(),
  salaryListed: z.boolean().default(false),
  rawDescription: z.string().optional(),
  applicationMethod: z.string().default("manual"),
  resumeVersionId: z.string().optional(),
  notes: z.string().optional(),
});

export const MarkAppliedRequestSchema = CapturedJobSchema.extend({
  appliedAt: z.string().datetime().optional(),
});

export const JobExtractionSchema = z.object({
  companyName: z.string().nullable(),
  roleTitle: z.string().nullable(),
  seniorityLevel: z.string().nullable(),
  employmentType: z.enum(["full_time", "contract", "part_time", "internship", "unknown"]),
  workplaceType: z.enum(["remote", "hybrid", "onsite", "unknown"]),
  location: z.string().nullable(),
  salaryListed: z.boolean(),
  salaryText: z.string().nullable(),
  requiredSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  techStack: z.array(z.string()),
  responsibilities: z.array(z.string()),
  benefits: z.array(z.string()),
  redFlags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const JobAnalysisSchema = z.object({
  fitScore: z.number().min(0).max(100),
  opportunityScore: z.number().min(0).max(100),
  roleFitScore: z.number().min(0).max(100),
  techStackFitScore: z.number().min(0).max(100),
  compensationClarityScore: z.number().min(0).max(100),
  strongestMatches: z.array(z.string()),
  possibleGaps: z.array(z.string()),
  redFlags: z.array(z.string()),
  resumeAngle: z.string(),
  applicationStrategy: z.string(),
  questionsToAsk: z.array(z.string()),
  concerns: z.array(z.string()),
});

export const EmailClassificationResultSchema = z.object({
  classification: EmailClassificationSchema,
  applicationStatus: ApplicationStatusSchema.optional(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  actionNeeded: z.boolean(),
  suggestedNextAction: z.string().nullable().optional(),
});
