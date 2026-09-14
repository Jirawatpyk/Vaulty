import { useCallback, useEffect, useState } from "react";
import { eraseMyData, getConsent, putConsent } from "./consent-fn";
import { readLocalConsent, writeLocalConsent } from "./consent.ts";
import {
  emptyConsent,
  grantConsent,
  isConsentLive,
  withdrawConsent,
  type ConsentPurpose,
  type ConsentRecord,
} from "./legal.ts";

export function useConsent() {
  const [record, setRecord] = useState<ConsentRecord>(emptyConsent);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const local = readLocalConsent();
    setRecord(local);
    void getConsent()
      .then(async (remote) => {
        if (isConsentLive(local, "account") && !isConsentLive(remote, "account")) {
          try {
            const saved = await putConsent({ data: grantConsent(local, local) });
            writeLocalConsent(saved);
            setRecord(saved);
            return;
          } catch {
            writeLocalConsent(local);
            setRecord(local);
            return;
          }
        }
        const useRemote = Boolean(remote.at && remote.version);
        const next = useRemote ? remote : local;
        writeLocalConsent(next);
        setRecord(next);
      })
      .catch(() => {
        /* signed out */
      })
      .finally(() => setReady(true));
  }, []);

  const live = useCallback((purpose: ConsentPurpose) => isConsentLive(record, purpose), [record]);

  const grant = useCallback(
    async (flags: Partial<Pick<ConsentRecord, "account" | "cloud" | "notify" | "terms" | "privacy">>) => {
      const next = grantConsent(record, flags);
      writeLocalConsent(next);
      setRecord(next);
      try {
        const saved = await putConsent({ data: next });
        writeLocalConsent(saved);
        setRecord(saved);
        return saved;
      } catch {
        return next;
      }
    },
    [record],
  );

  const withdraw = useCallback(async () => {
    const next = withdrawConsent(record);
    writeLocalConsent(next);
    setRecord(next);
    try {
      const saved = await eraseMyData();
      writeLocalConsent(saved);
      setRecord(saved);
      return saved;
    } catch {
      return next;
    }
  }, [record]);

  return { record, ready, live, grant, withdraw };
}
