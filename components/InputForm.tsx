"use client";

import { useState } from "react";
import { User, Lock, Fingerprint, Command, Loader2 } from "lucide-react";

export interface FormValues {
  username: string;
  password: string;
  semesterId: number;
  studentId?: string;
}

interface InputFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
}

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [semesterId, setSemesterId] = useState<number>(1);
  const [studentId, setStudentId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    onSubmit({
      username: username.trim(),
      password: password.trim(),
      semesterId,
      studentId: studentId.trim(),
    });
  };

  const inputStyles = `
    w-full rounded-lg border border-slate-200 bg-white px-10 py-2.5 text-sm 
    outline-none transition-all duration-200
    placeholder:text-slate-400
    focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10
    dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="group space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            <User size={12} className="group-focus-within:text-indigo-500 transition-colors" />
            Portal Username
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="eg: SJC23CC006"
              required
              className={inputStyles}
            />
          </div>
        </div>

        <div className="group space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            <Lock size={12} className="group-focus-within:text-indigo-500 transition-colors" />
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputStyles}
            />
          </div>
        </div>

        <div className="group space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            <Fingerprint size={12} />
            Internal ID <span className="lowercase opacity-50 italic">(opt)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="No neeed of this leave it blank"
              className={inputStyles.replace("px-10", "px-4")} 
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
          <Command size={12} />
          Select Semester
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SEMESTERS.map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setSemesterId(sem)}
              className={`
                relative flex items-center justify-center rounded-lg py-2 text-xs font-medium transition-all
                ${semesterId === sem 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-950" 
                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700"
                }
              `}
            >
              S{sem}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !username.trim() || !password.trim()}
        className="
          relative w-full overflow-hidden rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white 
          transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50
          dark:bg-white dark:text-slate-900
        "
      >
        <div className="flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Syncing with KTU...</span>
            </>
          ) : (
            <span>Get Results</span>
          )}
        </div>
      </button>

      <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
        Doesnt have a db to store these...broken fr..credentials wont be stored
      </p>
    </form>
  );
}