# PCDealFinder backend foundation — Phase 15A

This folder is intentionally a foundation layer. The live static catalogue is not changed by this phase.

## D1 schema

`../db/schema.sql` defines the tables for:

- users and sessions
- cloud watchlists
- price alerts
- canonical products and retailer offers
- real price-history snapshots
- alert events

## Activation plan

The next backend step is to bind a Cloudflare D1 database to the deployed Worker and expose a small `/api/*` surface. Authentication should be added before watchlist/alert endpoints are made public.

Do not put passwords or API keys in this repository. Passwords must be stored as strong password hashes and sessions should use secure, HTTP-only cookies.
