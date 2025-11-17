# Lightweight React Template for KAVIA

This project provides a minimal React template with a clean, modern UI and minimal dependencies.

## Features

- **Lightweight**: No heavy UI frameworks - uses only vanilla CSS and React
- **Modern UI**: Clean, responsive design with KAVIA brand styling
- **Fast**: Minimal dependencies for quick loading times
- **Simple**: Easy to understand and modify

## Getting Started

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Customization

### Colors

The main brand colors are defined as CSS variables in `src/App.css`:

```css
:root {
  --kavia-orange: #E87A41;
  --kavia-dark: #1A1A1A;
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-color: rgba(255, 255, 255, 0.1);
}
```

### Components

This template uses pure HTML/CSS components instead of a UI framework. You can find component styles in `src/App.css`. 

Common components include:
- Buttons (`.btn`, `.btn-large`)
- Container (`.container`)
- Navigation (`.navbar`)
- Typography (`.title`, `.subtitle`, `.description`)

## Logging

Structured logger is available at `src/lib/logger.js`.

- Configure log level via environment variable `REACT_APP_LOG_LEVEL`:
  - Allowed values: `debug`, `info`, `warn`, `error`
  - Default: `info`
- Sensitive data masking:
  - Email addresses are masked.
  - Long secrets/tokens (24+ chars) and values of sensitive keys are redacted.
  - Sensitive keys include: `password`, `token`, `access_token`, `refresh_token`, `authorization`, `apikey`, `api_key`, `secret`, `key`, `auth`, `pass`, `pwd`.
- Usage:
  ```js
  import { logger } from './src/lib/logger';
  logger.info('App started', { version: '1.0.0' });
  logger.error('Operation failed', { reason: 'Network timeout', requestId: 'req-123' });
  ```
- Output is structured: `{ timestamp, level, message, meta }`.

## Validation Utilities

Reusable validators reside in `src/lib/validation.js`.

- Import:
  ```js
  import { Validators, assertValid } from './src/lib/validation';
  ```
- Examples:
  ```js
  const email = assertValid(Validators.email(form.email));
  const pwd = assertValid(Validators.password(form.password));
  const url = assertValid(Validators.url(form.website));
  const name = assertValid(Validators.string(form.name, { min: 2, max: 60 }));
  const payload = assertValid(
    Validators.object(form, {
      email: Validators.email,
      password: (v) => Validators.password(v, { min: 10 }),
    })
  );
  ```
- Helpers:
  - `string(value, {min, max, trim})`
  - `email(value)`
  - `password(value, {min, requireNumber, requireLetter})`
  - `uuid(value)`
  - `url(value, {protocols})`
  - `integer(value, {min, max})`
  - `sanitizeText(value)` — removes `<`, `>`, and control characters
  - `object(obj, schema)` — schema-based object validation
  - `assertValid(result, prefix?)` — throws on invalid with a message

## Environment Variables

Create a `.env` file (see `.env.example`) and set at minimum:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY` (or legacy `REACT_APP_SUPABASE_KEY`)
- `REACT_APP_SITE_URL` (used for auth email redirects, e.g., http://localhost:3000)
- `REACT_APP_APP_NAME` (optional, display/telemetry header)

Other optional vars:
- `REACT_APP_API_BASE`
- `REACT_APP_BACKEND_URL`
- `REACT_APP_FRONTEND_URL`
- `REACT_APP_WS_URL`
- `REACT_APP_NODE_ENV`
- `REACT_APP_NEXT_TELEMETRY_DISABLED`
- `REACT_APP_ENABLE_SOURCE_MAPS`
- `REACT_APP_PORT`
- `REACT_APP_TRUST_PROXY`
- `REACT_APP_LOG_LEVEL`
- `REACT_APP_HEALTHCHECK_PATH`
- `REACT_APP_FEATURE_FLAGS`
- `REACT_APP_EXPERIMENTS_ENABLED`

### Supabase Client

The client is initialized in `src/config/supabaseClient.js` with:
- PKCE auth flow, auto-refresh, and session persistence enabled
- Strict env validation (missing required values will throw on init)
- Safe logging and no secret exposure

Legacy imports from `src/lib/supabaseClient` are preserved and re-export the new client.

### CORS and Production Notes

- In Supabase Dashboard:
  - Set Auth > URL Configuration > Site URL to your `REACT_APP_SITE_URL`.
  - Add additional redirect URLs for staging/preview environments as needed.
- For local dev, ensure your browser hits http://localhost:3000.
- Edge Functions / REST must allow your frontend origin in CORS settings.
- Never commit `.env`. Use environment variables in your deployment platform.

For email sign-in or OAuth, the PKCE flow will handle callbacks automatically when your app is served from the configured `REACT_APP_SITE_URL`.

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Analytics (Lightweight)

A reusable analytics hook is available at `src/hooks/useAnalytics.js`. It emits structured events to console and optionally to a stub endpoint.

- Supported events: `page_view`, `course_enroll`, `lesson_complete`
- Optional network endpoint: set `REACT_APP_API_BASE` to enable POST requests to `${REACT_APP_API_BASE}/analytics/events`

Integrated pages:
- CourseCatalog: page_view
- CourseDetails: page_view, course_enroll
- LearnDashboard: page_view
- CoursePlayer: page_view, demo lesson_complete
- LessonViewer: page_view

Admin view:
- Analytics Dashboard at `/admin/analytics` (admin role) displays CSS-only charts for a zero-dependency visualization demo.
