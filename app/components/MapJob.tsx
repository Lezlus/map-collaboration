"use client";
import { useEffect, useRef, useState } from "react";
import { useJobs } from "../context/MapJobContext";
import { supabaseClient } from "@/utils/supabase/client";
import { JobStatus } from "@/types";
import { useToken } from "../hooks/useToken";
import { RealtimeChannel } from "@supabase/supabase-js";

// TODO
// Potentially add functionality that lets users see any active jobs upon load
// Not just when they intially upload a map

export default function MapJob() {
  const { activeJob, setActiveJob } = useJobs();
  const { token, isLoading } = useToken();
  const [currentState, setCurrentState] = useState<JobStatus | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // if (!activeJob || !token || isLoading) return;
    if (!token || isLoading || !activeJob) return;
    const connect = async () => {
      await supabaseClient.realtime.setAuth(token);
      channelRef.current = supabaseClient
      .channel(`topic:${activeJob.jobId}`, {
        config: { private: true }
      })
      .on("broadcast", { event: "INSERT" }, (payload) => {
        const newState = payload["payload"]["record"]["status"] as JobStatus;
        setCurrentState(newState);
      })
      .on("broadcast", { event: "UPDATE" }, (payload) => {
        const newState = payload["payload"]["record"]["status"] as JobStatus;
        setCurrentState(newState);
      })
      .subscribe((status, err) => {
        console.log(status);
        if (err) {
          console.log(err);
        }
      });
      
    }
    connect();
    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
    
  }, [activeJob, isLoading, token])

  useEffect(() => {
    if (currentState === "COMPLETED") {
      if (!channelRef.current) return;
      supabaseClient.removeChannel(channelRef.current);
      channelRef.current = null;
      setTimeout(() => {
        setActiveJob(null);
      }, 1000);
    }
  }, [currentState, setActiveJob]);

  if (!activeJob) return;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-80 flex-col rounded-xl border border-slate-800 bg-slate-900/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md transition-all duration-300">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {currentState === "PROCESSING" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                currentState === "COMPLETED"
                  ? "bg-emerald-500"
                  : currentState === "FAILED"
                  ? "bg-rose-500"
                  : "bg-blue-500"
              }`}
            />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Map Job Status
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {activeJob?.jobId.slice(0,5)}
        </span>
      </div>

      {/* Details Row */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-200">
            {activeJob?.mapName || "Unnamed Map"}
          </p>
          <p className="text-xs text-slate-400">
            {currentState ? `Status: ${currentState}` : "Initializing..."}
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={`rounded-full px-2.5 py-1 text-xs font-medium border ${
            currentState === "COMPLETED"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : currentState === "FAILED"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
              : "border-blue-500/30 bg-blue-500/10 text-blue-400"
          }`}
        >
          {currentState}
        </div>
      </div>
    </div>
  )
}