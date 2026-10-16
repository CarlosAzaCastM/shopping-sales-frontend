import { useEffect, useState } from "react";

import Logo from "./components/Logo";
import SalesView from "./components/SalesView";
import ShoppingListView from "./components/ShoppingListView";
import TabNav, { tabFromHash, type TabId } from "./components/TabNav";
import { useSales } from "./hooks/useSales";
import { useShoppingList } from "./hooks/useShoppingList";
import { API_BASE_URL, api } from "./lib/api";
import { CURRENCY_SYMBOL } from "./lib/format";

type DbStatus = "checking" | "online" | "offline";

export default function App() {
  const shopping = useShoppingList();
  const sales = useSales();

  const [tab, setTab] = useState<TabId>(() => tabFromHash());
  const [dbStatus, setDbStatus] = useState<DbStatus>("checking");
  const [dbVersion, setDbVersion] = useState<string | null>(null);

  // Keep the URL hash and the selected tab in sync, both ways.
  useEffect(() => {
    const syncFromHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const selectTab = (next: TabId) => {
    setTab(next);
    window.location.hash = `#/${next}`;
  };

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((health) => {
        if (cancelled) return;
        setDbStatus(health.database === "ok" ? "online" : "offline");
        setDbVersion(health.server_version ?? null);
      })
      .catch(() => {
        if (!cancelled) setDbStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel =
    dbStatus === "online"
      ? "BD conectada"
      : dbStatus === "offline"
        ? "BD sin conexión"
        : "Conectando…";

  return (
    <div className="app-backdrop min-h-dvh">
      {/* Cinta superior con el degradado de la marca. */}
      <div className="brand-rule h-1 w-full" />

      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Hueco cuadrado para tu logo: public/logo.png */}
              <Logo size={58} label="C" />
              <div>
                <p className="mb-0.5 text-[11px] font-semibold tracking-[0.18em] text-brand-400 uppercase">
                  Mi negocio
                  <span className="ml-1.5 rounded bg-brand-500/15 px-1.5 py-0.5 text-brand-300">
                    {CURRENCY_SYMBOL} MXN
                  </span>
                </p>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  <span className="brand-text">Compras</span>
                  <span className="text-slate-500"> &amp; </span>
                  <span className="brand-text">Ventas</span>
                </h1>
              </div>
            </div>

            <span
              title={dbVersion ? `PostgreSQL ${dbVersion}` : statusLabel}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                dbStatus === "online"
                  ? "border-accent-400/30 bg-accent-500/10 text-accent-300"
                  : dbStatus === "offline"
                    ? "border-danger-400/30 bg-danger-500/10 text-danger-300"
                    : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  dbStatus === "online"
                    ? "bg-accent-400"
                    : dbStatus === "offline"
                      ? "bg-danger-400"
                      : "animate-pulse bg-slate-400"
                }`}
              />
              {statusLabel}
            </span>
          </div>
        </header>

        <TabNav
          active={tab}
          onChange={selectTab}
          pendingCount={shopping.pendingCount}
          salesCount={sales.totals.salesCount}
          profit={sales.totals.profit}
        />

        <main className="mt-6">
          {tab === "lista" ? (
            <ShoppingListView shopping={shopping} />
          ) : (
            <SalesView sales={sales} stockAtCost={shopping.totals.totalCost} />
          )}
        </main>

        <p className="mt-8 text-center text-xs text-slate-600">
          API:{" "}
          <code className="text-slate-500">
            {API_BASE_URL || "mismo origen (/api)"}
          </code>
        </p>
      </div>
    </div>
  );
}
