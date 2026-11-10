-- Tabella per la configurazione del routing dinamico tra domini Vercel (failover al 75% usage)
CREATE TABLE IF NOT EXISTS system_domain_routing (
    id TEXT PRIMARY KEY DEFAULT 'production',
    primary_domain TEXT NOT NULL DEFAULT 'the-fplace.vercel.app',
    secondary_domain TEXT NOT NULL DEFAULT 'the-hustle-place.vercel.app',
    active_domain TEXT NOT NULL DEFAULT 'the-fplace.vercel.app',
    fplace_usage_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    auto_failover_enabled BOOLEAN NOT NULL DEFAULT true,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_domain_routing (id, primary_domain, secondary_domain, active_domain)
VALUES ('production', 'the-fplace.vercel.app', 'the-hustle-place.vercel.app', 'the-fplace.vercel.app')
ON CONFLICT (id) DO NOTHING;
