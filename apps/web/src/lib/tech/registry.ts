// Single source of truth for technology names + spelling variants.
//
// Two consumers read this list so they can't drift apart:
//  - analyze-job.ts (applications JD extraction) uses the word-boundary regex.
//  - scorer.ts (candidate/radar scoring) uses aliasesForTech for substring
//    matching against the user's profile technologies.

export interface Tech {
  canonical: string;
  aliases: string[]; // lowercased spelling variants (excludes the canonical)
  re: RegExp;
}

function t(canonical: string, ...alts: string[]): Tech {
  const terms = [canonical, ...alts].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pat = terms.map((s) => `(?<![\\w.])${s}(?![\\w])`).join("|");
  return { canonical, aliases: alts.map((a) => a.toLowerCase()), re: new RegExp(pat, "i") };
}

export const TECHS: Tech[] = [
  // Languages
  t("TypeScript", "typescript", "type-safe", "type safe"),
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
  t("Next.js", "NextJS", "app router", "server components"),
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
  t("Redux", "Redux Toolkit"),
  t("Zustand"),
  t("MobX"),
  t("Vite"),
  t("Webpack"),
  t("Rollup"),
  t("esbuild", "ESBuild"),
  t("Turbopack"),
  t("Turbo", "Turborepo"),
  t("Jest"),
  t("Vitest"),
  t("Cypress"),
  t("Playwright"),
  t("Testing Library", "React Testing Library"),
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
  t("Cloudflare", "Cloudflare Workers"),
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
  t("GraphQL Code Generator", "graphql-codegen", "codegen"),
  t("Apollo", "Apollo Client"),
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

  // Tooling / workspaces
  t("Git"),
  t("GitHub"),
  t("GitLab"),
  t("Bitbucket"),
  t("pnpm", "pnpm workspaces", "pnpm workspace"),
];

// Canonical names matched by a JD's text, via word-boundary regex.
export function matchTechs(text: string): string[] {
  return TECHS.filter((tech) => tech.re.test(text)).map((tech) => tech.canonical);
}

// Lowercased substrings to search for when detecting a given technology name
// (the name itself plus any registry aliases). Falls back to just the name so
// profile techs absent from the registry still match on their own spelling.
export function aliasesForTech(name: string): string[] {
  const lower = name.toLowerCase();
  const entry = TECHS.find((tech) => tech.canonical.toLowerCase() === lower || tech.aliases.includes(lower));
  const base = entry ? [entry.canonical.toLowerCase(), ...entry.aliases] : [];
  return [...new Set([lower, ...base])];
}
