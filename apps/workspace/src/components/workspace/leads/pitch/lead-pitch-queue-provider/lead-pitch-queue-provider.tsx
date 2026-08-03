"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import type { ProfileSnapshot } from "@invessiv/common/contracts/leads/outreach/profile-snapshot";
import {
  PITCH_QUEUE_CONCURRENCY,
  PITCH_QUEUE_JITTER_MS,
  PITCH_QUEUE_MIN_DELAY_MS,
} from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";
import { LeadPitchJobState } from "@/common/constants/leads/pitch/lead-pitch-job-states";
import type {
  LeadPitchJob,
  LeadPitchTarget,
} from "@/common/contracts/leads/pitch/lead-pitch-job";
import { leadPitchClientService } from "@/client/leads/outreach/lead-pitch-client-service";
import { outreachProviderStatusService } from "@/client/leads/outreach/lead-outreach-provider-status-service";
import { profileBridgeClientService } from "@/client/leads/outreach/profile-bridge-client-service";

const IDLE_JOB: LeadPitchJob = {
  state: LeadPitchJobState.Idle,
  draft: null,
  body: "",
  errorCode: null,
};

type ProviderStatus = {
  isChecking: boolean;
  hasOpenAi: boolean;
  model: string | null;
  hasBridge: boolean;
};

type LeadPitchQueueValue = {
  getJob: (leadId: string, channel: PitchChannel) => LeadPitchJob;
  enqueue: (target: LeadPitchTarget) => void;
  generateFromSnapshot: (
    target: LeadPitchTarget,
    snapshot: ProfileSnapshot,
  ) => void;
  loadLatest: (leadId: string, channel: PitchChannel) => void;
  setBody: (leadId: string, channel: PitchChannel, body: string) => void;
  providerStatus: ProviderStatus;
};

const LeadPitchQueueContext = createContext<LeadPitchQueueValue | null>(null);

function toKey(leadId: string, channel: PitchChannel): string {
  return `${leadId}:${channel}`;
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}

export function LeadPitchQueueProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Record<string, LeadPitchJob>>({});
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({
    isChecking: true,
    hasOpenAi: false,
    model: null,
    hasBridge: false,
  });

  const pendingRef = useRef<LeadPitchTarget[]>([]);
  const activeCountRef = useRef(0);
  const lastStartRef = useRef(0);
  const loadedRef = useRef(new Set<string>());

  const patchJob = useCallback((key: string, patch: Partial<LeadPitchJob>) => {
    setJobs((current) => ({
      ...current,
      [key]: { ...(current[key] ?? IDLE_JOB), ...patch },
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      outreachProviderStatusService.checkOutreachProviders(),
      profileBridgeClientService.isAvailable(),
    ]).then(([status, hasBridge]) => {
      if (cancelled) return;
      setProviderStatus({
        isChecking: false,
        hasOpenAi: status.openai,
        model: status.openaiModel,
        hasBridge,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const runGeneration = useCallback(
    async (target: LeadPitchTarget, snapshot: ProfileSnapshot) => {
      const key = toKey(target.leadId, target.channel);
      patchJob(key, { state: LeadPitchJobState.Generating, errorCode: null });

      const result = await leadPitchClientService.generatePitch({
        leadId: target.leadId,
        channel: target.channel,
        snapshot,
      });

      if (!result.ok) {
        patchJob(key, {
          state: LeadPitchJobState.Error,
          errorCode: result.code,
        });
        return;
      }

      patchJob(key, {
        state: LeadPitchJobState.Ready,
        draft: result.draft,
        body: result.draft.body,
        errorCode: null,
      });
    },
    [patchJob],
  );

  const runJob = useCallback(
    async (target: LeadPitchTarget) => {
      const key = toKey(target.leadId, target.channel);
      const sinceLastStart = Date.now() - lastStartRef.current;
      const requiredDelay =
        PITCH_QUEUE_MIN_DELAY_MS + Math.random() * PITCH_QUEUE_JITTER_MS;

      if (lastStartRef.current > 0 && sinceLastStart < requiredDelay) {
        await wait(requiredDelay - sinceLastStart);
      }

      lastStartRef.current = Date.now();
      patchJob(key, { state: LeadPitchJobState.Capturing, errorCode: null });

      const bridgeResponse = await profileBridgeClientService.captureProfile({
        platform: target.channel,
        handle: target.handle,
        profileUrl: target.profileUrl,
      });

      if (!bridgeResponse.ok) {
        patchJob(key, {
          state: LeadPitchJobState.Error,
          errorCode: bridgeResponse.code,
        });
        return;
      }

      if (!("snapshot" in bridgeResponse)) {
        patchJob(key, {
          state: LeadPitchJobState.Error,
          errorCode: LeadPitchErrorCode.Internal,
        });
        return;
      }

      await runGeneration(target, bridgeResponse.snapshot);
    },
    [patchJob, runGeneration],
  );

  const drainRef = useRef<() => void>(() => undefined);

  const drain = useCallback(() => {
    while (
      activeCountRef.current < PITCH_QUEUE_CONCURRENCY &&
      pendingRef.current.length > 0
    ) {
      const target = pendingRef.current.shift();
      if (!target) {
        return;
      }

      activeCountRef.current += 1;
      void runJob(target).finally(() => {
        activeCountRef.current -= 1;
        drainRef.current();
      });
    }
  }, [runJob]);

  useEffect(() => {
    drainRef.current = drain;
  }, [drain]);

  const enqueue = useCallback(
    (target: LeadPitchTarget) => {
      const key = toKey(target.leadId, target.channel);
      patchJob(key, { state: LeadPitchJobState.Capturing, errorCode: null });
      pendingRef.current.push(target);
      drain();
    },
    [drain, patchJob],
  );

  const generateFromSnapshot = useCallback(
    (target: LeadPitchTarget, snapshot: ProfileSnapshot) => {
      void runGeneration(target, snapshot);
    },
    [runGeneration],
  );

  const loadLatest = useCallback((leadId: string, channel: PitchChannel) => {
    const key = toKey(leadId, channel);
    if (loadedRef.current.has(key)) {
      return;
    }

    loadedRef.current.add(key);

    void leadPitchClientService
      .getLatestPitch(leadId, channel)
      .then((draft) => {
        if (!draft) {
          return;
        }

        setJobs((current) => {
          const existing = current[key];
          if (existing && existing.state !== LeadPitchJobState.Idle) {
            return current;
          }

          return {
            ...current,
            [key]: {
              state: LeadPitchJobState.Ready,
              draft,
              body: draft.body,
              errorCode: null,
            },
          };
        });
      });
  }, []);

  const setBody = useCallback(
    (leadId: string, channel: PitchChannel, body: string) => {
      patchJob(toKey(leadId, channel), { body });
    },
    [patchJob],
  );

  const getJob = useCallback(
    (leadId: string, channel: PitchChannel) =>
      jobs[toKey(leadId, channel)] ?? IDLE_JOB,
    [jobs],
  );

  const value = useMemo(
    () => ({
      enqueue,
      generateFromSnapshot,
      getJob,
      loadLatest,
      providerStatus,
      setBody,
    }),
    [
      enqueue,
      generateFromSnapshot,
      getJob,
      loadLatest,
      providerStatus,
      setBody,
    ],
  );

  return (
    <LeadPitchQueueContext.Provider value={value}>
      {children}
    </LeadPitchQueueContext.Provider>
  );
}

export function useLeadPitchQueue(): LeadPitchQueueValue {
  const value = useContext(LeadPitchQueueContext);

  if (!value) {
    throw new Error(
      "useLeadPitchQueue must be used inside LeadPitchQueueProvider",
    );
  }

  return value;
}
