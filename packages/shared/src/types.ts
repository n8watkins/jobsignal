import { z } from "zod";
import {
  ApplicationStatusSchema,
  CapturedJobSchema,
  EmailClassificationResultSchema,
  EmailClassificationSchema,
  JobAnalysisSchema,
  JobExtractionSchema,
  MarkAppliedRequestSchema,
} from "./schemas";

export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type EmailClassification = z.infer<typeof EmailClassificationSchema>;
export type CapturedJob = z.infer<typeof CapturedJobSchema>;
export type MarkAppliedRequest = z.infer<typeof MarkAppliedRequestSchema>;
export type JobExtraction = z.infer<typeof JobExtractionSchema>;
export type JobAnalysis = z.infer<typeof JobAnalysisSchema>;
export type EmailClassificationResult = z.infer<typeof EmailClassificationResultSchema>;
