# AtomPay — Two-Phase Commit (2PC) Atomic Checkout Engine for PayPal

**AtomPay** eliminates the **multi-vendor partial-failure trap** in online PayPal checkouts. Instead of letting Seller A capture your funds while Seller B runs out of stock or spikes in price, AtomPay compiles an **AI Dependency Graph** (`CRITICAL` vs `OPTIONAL` items), locks a single **PayPal Orders v2 `AUTHORIZE` hold**, concurrently probes every seller, runs optional **Gemini compatible-substitute recovery**, and settles atomically via **multi-tranche `Partial CAPTURE`** or **1-second atomic `VOID`**.

## Quick Start

1. Copy `.env.example` to `.env` and fill in your keys:
   - `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET` from `https://developer.paypal.com` (**Apps & Credentials -> Sandbox**)
   - `GEMINI_API_KEY` from Google AI Studio
2. Install all dependencies:
   ```bash
   npm run install:all
   ```
3. Run backend + frontend concurrently:
   ```bash
   npm run dev
   ```
   - Backend API: `http://localhost:4000`
   - Web Control Plane: `http://localhost:5173`

## Project Structure

- `backend/src/services/paypal.ts` — PayPal Sandbox REST v2 client (`oauth2/token`, `orders` with `intent=AUTHORIZE`, `authorizations/capture` with `final_capture`, `authorizations/void`, `invoicing/invoices`)
- `backend/src/services/gemini.ts` — Gemini AI dependency compiler & substitute recovery engine
- `backend/src/services/vendors.ts` — Multi-seller catalog presets & live fault simulator
- `backend/src/services/orchestrator.ts` — 2PC state machine & audit ledger recorder
- `frontend/src/components/` — Modular React UI (`ScenarioBuilder`, `DagVisualizer`, `WireInspector`, `LedgerGrid` via AG Grid)

