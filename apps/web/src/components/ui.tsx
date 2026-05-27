import { cn } from "@/lib/utils";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-white/10 bg-slate-950/60 shadow-2xl shadow-black/20 backdrop-blur", className)}>
      {children}
    </section>
  );
}

export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", className)}>{children}</span>;
}

export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/50" {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="min-h-36 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/50" {...props} />;
}
