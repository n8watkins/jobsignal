import type { JobAnalysis, JobExtraction } from "@jobsignal/shared";

// ─── Technology registry ─────────────────────────────────────────────────────

interface Tech {
  canonical: string;
  re: RegExp;
}

function t(canonical: string, ...alts: string[]): Tech {
  const terms = [canonical, ...alts].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pat = terms.map((s) => `(?<![\\w.])${s}(?![\\w])`).join("|");
  return { canonical, re: new RegExp(pat, "i") };
}

const TECHS: Tech[] = [
  // Languages
  t("TypeScript", "typescript"),
  t("JavaScript", "javascript"),
  t("Python"),
  t("Go", "Golang", "go lang"),
  t("Rust"),
  t("Java"),
  t("Kotlin"),
  t("Swift"),
  t("C#", "C-Sharp", "csharp", ".NET", "dotnet", "ASP.NET"),
  t("C++"),
  t("PHP"),
  t("Ruby"),
  t("Scala"),
  t("Elixir"),
  t("Dart"),
  t("Bash", "shell scripting", "zsh"),
  t("SQL"),

  // Frontend frameworks
  t("React", "ReactJS", "React.js"),
  t("Vue", "Vue.js", "VueJS", "Vue 3"),
  t("Angular", "AngularJS"),
  t("Svelte", "SvelteKit"),
  t("Next.js", "NextJS"),
  t("Nuxt", "Nuxt.js", "NuxtJS"),
  t("Remix"),
  t("Gatsby"),
  t("Solid.js", "SolidJS"),
  t("Ember.js", "Ember"),
  t("Lit"),

  // Frontend tooling / styling
  t("Tailwind CSS", "Tailwind"),
  t("Bootstrap"),
  t("Material UI", "MUI"),
  t("Chakra UI"),
  t("Radix UI", "Radix"),
  t("shadcn/ui", "shadcn"),
  t("Sass", "SCSS"),
  t("Redux"),
  t("Zustand"),
  t("MobX"),
  t("Vite"),
  t("Webpack"),
  t("Rollup"),
  t("esbuild", "ESBuild"),
  t("Turbopack"),
  t("Jest"),
  t("Vitest"),
  t("Cypress"),
  t("Playwright"),
  t("Testing Library"),
  t("Storybook"),

  // Backend frameworks
  t("Node.js", "Node", "NodeJS"),
  t("Express", "Express.js"),
  t("Fastify"),
  t("NestJS", "Nest.js"),
  t("Koa"),
  t("Django"),
  t("Flask"),
  t("FastAPI"),
  t("Rails", "Ruby on Rails"),
  t("Spring Boot", "Spring Framework", "Spring MVC"),
  t("Laravel"),
  t("Symfony"),
  t("Phoenix"),
  t("Gin"),
  t("Echo"),
  t("Fiber"),

  // Databases — relational
  t("PostgreSQL", "Postgres"),
  t("MySQL"),
  t("SQLite"),
  t("MariaDB"),
  t("Oracle"),
  t("SQL Server", "MSSQL"),

  // Databases — document / key-value / graph
  t("MongoDB", "Mongo"),
  t("DynamoDB"),
  t("Firestore", "Firebase Firestore"),
  t("Firebase"),
  t("Cosmos DB", "CosmosDB"),
  t("Redis"),
  t("Memcached"),
  t("Elasticsearch", "OpenSearch"),
  t("Cassandra"),
  t("ClickHouse"),
  t("Neo4j"),

  // ORMs / query builders
  t("Prisma"),
  t("Drizzle"),
  t("TypeORM"),
  t("Sequelize"),
  t("SQLAlchemy"),
  t("Hibernate"),
  t("ActiveRecord"),

  // Cloud — providers
  t("AWS", "Amazon Web Services"),
  t("Azure", "Microsoft Azure"),
  t("GCP", "Google Cloud Platform", "Google Cloud"),
  t("Vercel"),
  t("Netlify"),
  t("Cloudflare"),
  t("Heroku"),
  t("DigitalOcean"),
  t("Fly.io"),
  t("Railway"),
  t("Render"),

  // Cloud — AWS services
  t("Lambda", "AWS Lambda"),
  t("EC2"),
  t("S3"),
  t("RDS"),
  t("ECS"),
  t("EKS"),
  t("CloudFront"),
  t("SQS"),
  t("SNS"),
  t("CloudFormation"),

  // DevOps / infra
  t("Docker"),
  t("Kubernetes", "K8s", "k8s"),
  t("Helm"),
  t("Terraform"),
  t("Pulumi"),
  t("Ansible"),
  t("GitHub Actions"),
  t("GitLab CI"),
  t("CircleCI"),
  t("Jenkins"),
  t("ArgoCD", "Argo CD"),
  t("Datadog"),
  t("Grafana"),
  t("Prometheus"),
  t("OpenTelemetry", "OTel"),
  t("Nginx", "nginx"),
  t("Linux", "Unix"),

  // AI / ML
  t("TensorFlow"),
  t("PyTorch"),
  t("scikit-learn", "sklearn"),
  t("Hugging Face", "HuggingFace"),
  t("LangChain"),
  t("LlamaIndex"),
  t("OpenAI"),
  t("Anthropic"),
  t("LLM", "large language model"),
  t("RAG", "retrieval-augmented generation"),
  t("pandas"),
  t("NumPy", "numpy"),
  t("Jupyter"),

  // APIs / messaging
  t("GraphQL"),
  t("gRPC"),
  t("tRPC"),
  t("REST", "RESTful"),
  t("WebSockets", "WebSocket"),
  t("Kafka", "Apache Kafka"),
  t("RabbitMQ"),
  t("Pub/Sub", "Google Pub/Sub"),
  t("NATS"),
  t("Celery"),
  t("Protobuf", "Protocol Buffers"),

  // Mobile
  t("React Native"),
  t("Flutter"),
  t("SwiftUI"),
  t("Expo"),

  // Misc tools
  t("Git"),
  t("GitHub"),
  t("GitLab"),
  t("Bitbucket"),
];

// ─── Section-aware tech matching ─────────────────────────────────────────────

function matchTechs(text: string): string[] {
  return TECHS.filter((t) => t.re.test(text)).map((t) => t.canonical);
}

function extractSection(text: string, headers: string[]): string {
  const hPat = new RegExp(`(?:^|\\n)[ \\t]*(?:${headers.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*:?[ \\t]*(?:\\n|$)`, "i");
  const m = hPat.exec(text);
  if (!m) return "";
  const after = text.slice(m.index + m[0].length);
  // stop at next section-like header (all-caps word or Title Case line under 60 chars)
  const stop = /\n[ \t]*[A-Z][A-Za-z &\/]{2,50}:?\s*\n/.exec(after);
  return stop ? after.slice(0, stop.index) : after.slice(0, 1500);
}

// ─── Field extractors ────────────────────────────────────────────────────────

const SALARY_RE = /\$\s?(\d{1,3}(?:,\d{3})*|\d{2,3}[kK])\s*(?:[-–—]|to)\s*\$?\s?(\d{1,3}(?:,\d{3})*|\d{2,3}[kK])|\$\s?(\d{1,3}(?:,\d{3})*|\d{2,3}[kK])(?:\s*(?:USD|\/yr|per year|annually))/gi;

function extractSalary(text: string, inputSalaryText?: string | null) {
  const matches = [...text.matchAll(SALARY_RE)];
  const salaryText = matches[0]?.[0] ?? inputSalaryText ?? null;
  return { salaryText, salaryListed: Boolean(salaryText) };
}

function extractWorkplaceType(text: string): "remote" | "hybrid" | "onsite" | "unknown" {
  const t = text.toLowerCase();
  if (/\bfully\s+remote\b|\b100%\s+remote\b/.test(t)) return "remote";
  if (/\bremote(-|\s)first\b/.test(t)) return "remote";
  if (/\bhybrid\b/.test(t)) return "hybrid";
  if (/\bin[-\s]?person\b|\bon[-\s]?site\b|\bonsite\b|\bin[-\s]?office\b/.test(t)) return "onsite";
  if (/\bremote\b/.test(t)) return "remote";
  return "unknown";
}

function extractEmploymentType(text: string): "full_time" | "contract" | "part_time" | "internship" | "unknown" {
  const t = text.toLowerCase();
  if (/\binternship\b|\bintern\b|\bco-?op\b/.test(t)) return "internship";
  if (/\bcontract\b|\bcontractor\b|\bfreelance\b|\bc2c\b|\bw2\b/.test(t)) return "contract";
  if (/\bpart[-\s]?time\b/.test(t)) return "part_time";
  if (/\bfull[-\s]?time\b|\bfte\b|\bpermanent\b/.test(t)) return "full_time";
  return "unknown";
}

function extractSeniority(text: string): string | null {
  if (/\bprincipal\b/i.test(text)) return "Principal";
  if (/\bstaff\s+(software|engineer|developer)\b/i.test(text)) return "Staff";
  if (/\blead\s+(software|engineer|developer)\b|\bengineering\s+lead\b/i.test(text)) return "Lead";
  if (/\bsenior\b|(?<!\w)sr\.?\s/i.test(text)) return "Senior";
  if (/\bjunior\b|(?<!\w)jr\.?\s|\bentry[-\s]level\b/i.test(text)) return "Junior";
  if (/\bmid[-\s]level\b|\bmid[-\s]senior\b/i.test(text)) return "Mid-level";
  return null;
}

function extractRoleTitle(text: string): string | null {
  // Explicit label
  const labelMatch = /(?:^|\n)\s*(?:job\s+title|position|role)\s*:\s*(.+)/i.exec(text);
  if (labelMatch) return labelMatch[1].trim();

  // Title-looking line at start of doc (first 300 chars)
  const opening = text.slice(0, 300);
  const titleLine = /^[ \t]*([A-Z][^\n]{4,80}(?:Engineer|Developer|Architect|Manager|Scientist|Analyst|Designer|DevOps|SRE|Lead|Intern)s?)\b/m.exec(opening);
  if (titleLine) return titleLine[1].trim();

  // Pattern anywhere
  const anyMatch = /\b((?:Senior|Junior|Staff|Lead|Principal|Sr\.?|Jr\.?)\s+)?(?:Software|Frontend|Front-End|Backend|Back-End|Full[-\s]Stack|Platform|Infrastructure|DevOps|SRE|Cloud|Data|ML|Mobile|iOS|Android|Security)\s+(?:Engineer|Developer|Architect|Scientist)\b/i.exec(text);
  if (anyMatch) return anyMatch[0].replace(/\s+/g, " ").trim();

  return null;
}

function extractCompanyName(text: string): string | null {
  // "About <Company>" section header
  const aboutMatch = /(?:^|\n)\s*About\s+([A-Z][A-Za-z0-9&.,'\- ]{1,50?})\s*\n/m.exec(text);
  if (aboutMatch) return aboutMatch[1].trim();

  // "<Company> is (hiring|looking for|seeking)"
  const hiringMatch = /\b([A-Z][A-Za-z0-9&.'\-]+(?:\s+[A-Z][A-Za-z0-9&.'\-]+)?)\s+is\s+(?:hiring|looking|seeking|searching)/i.exec(text);
  if (hiringMatch) return hiringMatch[1].trim();

  // "Join <Company>"
  const joinMatch = /\bJoin\s+([A-Z][A-Za-z0-9&.'\-]+(?:\s+[A-Z][A-Za-z0-9&.'\-]+)?)/i.exec(text);
  if (joinMatch) return joinMatch[1].trim();

  // "At <Company>," at start of sentence
  const atMatch = /(?:^|\.\s+)At\s+([A-Z][A-Za-z0-9&.'\-]+(?:\s+[A-Z][A-Za-z0-9&.'\-]+)?)[,\s]/m.exec(text);
  if (atMatch) return atMatch[1].trim();

  return null;
}

function extractLocation(text: string): string | null {
  const labelMatch = /(?:^|\n)\s*(?:location|office)\s*:\s*(.+)/i.exec(text);
  if (labelMatch) return labelMatch[1].split(/[,|;]/)[0].trim();

  if (/\bfully\s+remote\b|\b100%\s+remote\b|\bremote[-\s]first\b/i.test(text)) return "Remote";
  if (/\bremote\b/i.test(text) && !/\bno[nt][-\s]remote\b/i.test(text)) return "Remote";

  const cityMatch = /\b(San Francisco|New York|Seattle|Austin|Boston|Chicago|Los Angeles|Denver|Atlanta|Miami|Toronto|London|Berlin|Amsterdam|Singapore|Remote)(?:,\s*[A-Z]{2})?\b/.exec(text);
  if (cityMatch) return cityMatch[0].trim();

  return null;
}

function extractResponsibilities(text: string): string[] {
  const section = extractSection(text, [
    "What you'll do", "What you will do", "Responsibilities",
    "Your role", "The role", "You will", "In this role",
  ]);
  if (!section) return [];
  return extractBullets(section).slice(0, 6);
}

function extractBenefits(text: string): string[] {
  const section = extractSection(text, [
    "Benefits", "Perks", "What we offer", "Compensation and benefits",
    "Why join us", "What we provide",
  ]);
  if (!section) return [];
  return extractBullets(section).slice(0, 8);
}

function extractBullets(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*–\d.]+/, "").trim())
    .filter((l) => l.length > 10 && l.length < 200 && !l.endsWith(":"));
}

function extractEmphasisAreas(text: string): string[] {
  const areas: string[] = [];
  const t = text.toLowerCase();
  if (/distributed\s+systems?|consensus|raft|paxos/.test(t)) areas.push("Distributed Systems");
  if (/microservices?|service\s+mesh/.test(t)) areas.push("Microservices");
  if (/\bci\/cd\b|continuous\s+(integration|delivery|deployment)/.test(t)) areas.push("CI/CD");
  if (/observabilit|monitori|tracing|log(ging)?/.test(t)) areas.push("Observability");
  if (/data\s+pipeline|etl|data\s+engineering|data\s+infra/.test(t)) areas.push("Data Engineering");
  if (/real[-\s]time|streaming|low[-\s]latency/.test(t)) areas.push("Real-time");
  if (/api\s+design|api\s+platform|developer\s+platform/.test(t)) areas.push("API / Platform");
  if (/developer\s+experience|dx\b|dev\s+tools/.test(t)) areas.push("Developer Experience");
  if (/\bmachine\s+learning\b|\bml\s+platform\b|\bml\s+infra/.test(t)) areas.push("ML / AI");
  if (/security|soc\s*2|compliance|auth(enticati|oriz)/.test(t)) areas.push("Security");
  if (/performance|optimization|latency|throughput/.test(t)) areas.push("Performance");
  if (/mobile|ios|android|react\s+native|flutter/.test(t)) areas.push("Mobile");
  if (/e2e\s+testing|test\s+(automation|infrastructure)|quality/.test(t)) areas.push("Testing / QA");
  return areas;
}

function buildRedFlags(text: string, salaryListed: boolean): string[] {
  const flags: string[] = [];
  if (!salaryListed) flags.push("No salary listed");
  if (/\b10x\s+(engineer|developer)\b/i.test(text)) flags.push('"10x engineer" language');
  if (/\brock\s*star\b|\bninja\b|\bguru\b|\bwizard\b/i.test(text)) flags.push("Rockstar/ninja job ad language");
  if (/must\s+be\s+available\s+24\/7|always\s+on\s+call/i.test(text)) flags.push("24/7 availability expectation");
  if (/unpaid\s+(trial|test|project)|working\s+interview/i.test(text)) flags.push("Unpaid work request");
  if (/\bstartup\s+salary\b|\bbelow\s+market\b/i.test(text)) flags.push("Below-market pay mentioned");
  return flags;
}

function computeConfidence(fields: {
  companyName: string | null;
  roleTitle: string | null;
  location: string | null;
  salaryText: string | null;
  techStack: string[];
}): number {
  let score = 0.3; // base for having any JD text
  if (fields.companyName) score += 0.15;
  if (fields.roleTitle) score += 0.2;
  if (fields.location) score += 0.1;
  if (fields.salaryText) score += 0.1;
  if (fields.techStack.length >= 3) score += 0.1;
  if (fields.techStack.length >= 8) score += 0.05;
  return Math.min(0.95, score);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function extractJobDescription(input: {
  rawDescription?: string;
  companyName?: string;
  roleTitle?: string;
  location?: string;
  salaryText?: string | null;
}): Promise<JobExtraction> {
  const text = input.rawDescription || "";

  const { salaryText, salaryListed } = extractSalary(text, input.salaryText);
  const workplaceType = extractWorkplaceType(text);
  const employmentType = extractEmploymentType(text);
  const seniorityLevel = extractSeniority(text);

  const companyName = extractCompanyName(text) || input.companyName || null;
  const roleTitle = extractRoleTitle(text) || input.roleTitle || null;
  const location = extractLocation(text) || input.location || null;

  // Section-aware tech matching
  const requiredSection = extractSection(text, [
    "Requirements", "Required qualifications", "Required skills", "What you bring",
    "What we're looking for", "What we are looking for", "Qualifications", "Must have",
    "You have", "You bring", "Minimum qualifications",
  ]);
  const niceSection = extractSection(text, [
    "Nice to have", "Preferred", "Bonus points", "Bonus", "Plus", "Ideal",
    "Preferred qualifications", "It would be great",
  ]);

  const allTechs = matchTechs(text);
  const requiredTechs = requiredSection ? matchTechs(requiredSection) : allTechs;
  const niceTechs = niceSection ? matchTechs(niceSection).filter((t) => !requiredTechs.includes(t)) : [];

  const responsibilities = extractResponsibilities(text);
  const benefits = extractBenefits(text);
  const redFlags = buildRedFlags(text, salaryListed);

  return {
    companyName,
    roleTitle,
    seniorityLevel,
    employmentType,
    workplaceType,
    location,
    salaryListed,
    salaryText,
    requiredSkills: requiredTechs,
    niceToHaveSkills: niceTechs,
    techStack: allTechs,
    responsibilities,
    benefits,
    redFlags,
    confidence: computeConfidence({ companyName, roleTitle, location, salaryText, techStack: allTechs }),
  };
}

export async function analyzeJobFit(input: {
  rawDescription?: string;
  resumeText?: string;
  extraction: JobExtraction;
}): Promise<JobAnalysis> {
  const required = input.extraction.requiredSkills;
  const resume = input.resumeText || "React Next.js TypeScript Node.js PostgreSQL GraphQL API dashboard automation";
  const matches = required.filter((s) => resume.toLowerCase().includes(s.toLowerCase()));
  const techScore = required.length ? Math.round((matches.length / required.length) * 100) : 70;
  const compensationScore = input.extraction.salaryListed ? 90 : 35;
  const fitScore = Math.round(techScore * 0.65 + compensationScore * 0.15 + 20);

  return {
    fitScore: clamp(fitScore),
    opportunityScore: clamp(Math.round((fitScore + compensationScore) / 2)),
    roleFitScore: clamp(fitScore),
    techStackFitScore: clamp(techScore),
    compensationClarityScore: compensationScore,
    strongestMatches: matches.length ? matches : ["Web application experience", "Frontend product work"],
    possibleGaps: required.filter((s) => !resume.toLowerCase().includes(s.toLowerCase())).slice(0, 4),
    redFlags: input.extraction.redFlags,
    resumeAngle: "Lead with recent product work, API integrations, and TypeScript/React experience.",
    applicationStrategy: input.extraction.salaryListed
      ? "Worth pursuing — salary is listed and tech overlap is calculable."
      : "Proceed cautiously — no salary listed. Ask for the range before investing heavily.",
    questionsToAsk: [
      "Can you share the compensation range?",
      "What's the frontend/backend ownership split?",
      "What does the first 90 days look like?",
    ],
    concerns: input.extraction.redFlags,
  };
}

function clamp(v: number) {
  return Math.max(0, Math.min(100, v));
}
