import { useSyncExternalStore } from 'react';
import { VideoObservationDraft } from '../../services/geminiService';

type ObservationSnapshot = {
  observationText: string;
  videoDraft: VideoObservationDraft | null;
};

type ObservationStore = ObservationSnapshot & {
  setObservationText: (value: string | ((prev: string) => string)) => void;
  setVideoDraft: (draft: VideoObservationDraft | null) => void;
  reset: () => void;
};

let state: ObservationSnapshot = {
  observationText: '',
  videoDraft: null,
};

const listeners = new Set<() => void>();

const setState = (
  updater:
    | Partial<ObservationSnapshot>
    | ((prev: ObservationSnapshot) => Partial<ObservationSnapshot>)
) => {
  const next = typeof updater === 'function' ? updater(state) : updater;
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): ObservationSnapshot => state;

const store = {
  setObservationText: (value: string | ((prev: string) => string)) =>
    setState((prev) => ({
      observationText: typeof value === 'function' ? value(prev.observationText) : value,
    })),
  setVideoDraft: (draft: VideoObservationDraft | null) => setState({ videoDraft: draft }),
  reset: () => setState({ observationText: '', videoDraft: null }),
};

export const useObservationStore = (): ObservationStore => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return { ...snapshot, ...store };
};
