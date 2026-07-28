"use client";

import { useContext, createContext, useState, ReactNode, useCallback, Dispatch, SetStateAction } from "react";

interface Job {
  jobId: string;
  mapName: string;
}

type JobContextType = {
  activeJob: Job | null;
  setActiveJob: Dispatch<SetStateAction<Job | null>>
}

export const JobContext = createContext<JobContextType | null>(null);

export function MapJobProvider({ children }: { children: ReactNode }) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const startJobTracking = useCallback((job: Job | null) => {
    setActiveJob(job);
  }, []);

  return (
    <JobContext value={{ activeJob, setActiveJob }}>
      { children }
    </JobContext>
  )
}

export function useJobs() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("Context Error")
  }
  return context
}