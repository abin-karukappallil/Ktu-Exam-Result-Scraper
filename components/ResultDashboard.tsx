"use client";

import { useState } from "react";
import { InputForm, type FormValues } from "./InputForm";
import { ResultTable } from "./ResultTable";
import { trpc } from "@/trpc/client";
import { LayoutGrid, ShieldCheck, GraduationCap } from "lucide-react";

interface ResultDashboardProps {
  title: string;
  subtitle?: string;
}

export function ResultDashboard({ title, subtitle }: ResultDashboardProps) {
  const [lastQuery, setLastQuery] = useState<FormValues | null>(null);

  const { data, error, isPending, mutate } = trpc.result.getResults.useMutation();

  const handleSubmit = (values: FormValues) => {
    setLastQuery(values);
    mutate({
      username: values.username,
      password: values.password,
      semesterId: values.semesterId,
      studentId: values.studentId || undefined,
    });
  };

  const courses = data?.courses ?? [];

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 dark:bg-[#050505] dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      <div className="fixed inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] mask-[radial-gradient(ellipse_at_center,white,transparent)]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }} 
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-16">
        
        <header className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium tracking-tight">
              <GraduationCap size={18} />
              <span className="text-xs uppercase tracking-[0.2em]">Bit Faster than them</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-md text-slate-500 dark:text-slate-400 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className="hidden md:block h-px flex-1 bg-slate-200 dark:bg-slate-800 mx-8 mb-4 opacity-50" />
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Form Section */}
          <div className="lg:col-span-4 space-y-8">
            <section className="relative group">
              <div className="absolute -inset-2 rounded-4xl bg-linear-to-b from-slate-200 to-transparent opacity-0 transition duration-500 group-hover:opacity-100 dark:from-slate-800" />
              <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Login to get Tokens for Request</h2>
                  <ShieldCheck size={16} className="text-slate-300" />
                </div>
                
                <InputForm onSubmit={handleSubmit} isLoading={isPending} />
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 animate-in fade-in slide-in-from-top-2 dark:border-red-900/30 dark:bg-red-950/20">
                <div className="flex gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300 leading-snug">
                    <span className="font-semibold block mb-0.5 text-xs uppercase tracking-wider">Access Denied</span>
                    {error.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            {lastQuery && !error ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ResultTable
                  courses={courses}
                  semesterId={lastQuery.semesterId}
                  isLoading={isPending}
                />
              </div>
            ) : (
              <div className="relative flex h-100 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50/50 text-center dark:border-slate-800 dark:bg-slate-900/20">
                <LayoutGrid className="mb-4 text-slate-300 dark:text-slate-700" size={40} strokeWidth={1} />
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Waiting for query</h3>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Provide your credentials to retrieve semester grades</p>
                
              </div>
            )}
          </div>
        </main>

        <footer className="mt-24 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Verified Source: KTU Academic Portal
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}