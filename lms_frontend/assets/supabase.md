# Supabase Integration Notes

This project uses Supabase JS v2.

## Environment

Configure the following environment variables (see `.env.example`):

- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY (alias: REACT_APP_SUPABASE_KEY)
- REACT_APP_SITE_URL
- REACT_APP_APP_NAME (optional)

Do not commit `.env`. Ensure your deployment environment sets these variables.
Note: We do NOT use placeholders in code. You must provide real credentials via `.env`.

## Client Initialization

Client is created in `src/config/supabaseClient.js` with:
- `auth.flowType = 'pkce'`
- `auth.autoRefreshToken = true`
- `auth.persistSession = true`
- `auth.detectSessionInUrl = true`

If environment variables are missing, a non-crashing fallback client is returned for local UI development.
This fallback logs masked diagnostics and no-ops all network calls. Add proper `.env` to enable real connectivity.

The `REACT_APP_SITE_URL` should match your deployed frontend base URL for email magic links and OAuth.

## CORS

In Supabase Dashboard:
- Set `Auth > URL Configuration > Site URL` to match `REACT_APP_SITE_URL`.
- Add additional redirect URLs for preview/staging.
- For Edge Functions, configure allowed origins.

## Usage

```js
import { getSupabaseClient } from '../config/supabaseClient';

const supabase = getSupabaseClient();
const { data, error } = await supabase.from('courses').select('*').limit(1);
```

Diagnostics utilities:
- `src/utils/testSupabase.js` provides a self-test used by a lightweight banner in App.
- `src/utils/initSampleData.js` can seed categories for local development (no-ops if table missing).
