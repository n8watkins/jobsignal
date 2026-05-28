import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeCandidateJobHeuristically } from "@/lib/candidate-jobs/analyze";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const candidateJob = await prisma.candidateJob.findUnique({ where: { id } });

  if (!candidateJob) return NextResponse.json({ error: "Candidate job not found" }, { status: 404 });

  const analysis = analyzeCandidateJobHeuristically(candidateJob);
  const saved = await prisma.candidateJobAnalysis.create({
    data: {
      candidateJobId: candidateJob.id,
      overallFitScore: analysis.overallFitScore,
      techMatchScore: analysis.techMatchScore,
      seniorityFitScore: analysis.seniorityFitScore,
      compensationScore: analysis.compensationScore,
      requiredTechnologies: JSON.stringify(analysis.requiredTechnologies),
      preferredTechnologies: JSON.stringify(analysis.preferredTechnologies),
      matchedTechnologies: JSON.stringify(analysis.matchedTechnologies),
      missingTechnologies: JSON.stringify(analysis.missingTechnologies),
      emphasisAreas: JSON.stringify(analysis.emphasisAreas),
      likelyDayToDay: JSON.stringify(analysis.likelyDayToDay),
      riskFlags: JSON.stringify(analysis.riskFlags),
      interviewPrepTopics: JSON.stringify(analysis.interviewPrepTopics),
      workArrangement: analysis.workArrangement,
      employmentType: analysis.employmentType,
      seniorityLevel: analysis.seniorityLevel,
      reportingLine: analysis.reportingLine,
      resumePositioning: analysis.resumePositioning,
      summary: analysis.summary,
      analysisMethod: "heuristic",
      model: null,
    },
  });

  await prisma.aiUsageLog.create({
    data: {
      userId: candidateJob.userId,
      feature: "candidate_job_analysis",
      provider: "local",
      model: "heuristic",
      inputTokens: Math.ceil((candidateJob.rawDescription || candidateJob.rawCardText || "").length / 4),
      outputTokens: Math.ceil(JSON.stringify(analysis).length / 4),
      estimatedCost: 0,
      searchEnabled: false,
      candidateJobId: candidateJob.id,
    },
  });

  return NextResponse.json({ ok: true, analysis: saved, aiEnabled: false });
}
