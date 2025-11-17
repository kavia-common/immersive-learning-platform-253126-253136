import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './theme/global.css';
import './components/ui/ui.css';
import App from './App';
import { AuthProvider } from './state/AuthContext';
import { UIProvider } from './state/UIContext';
import { FeatureFlagProvider } from './state/FeatureFlagContext';
import { ErrorBoundary } from './lib/errorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <FeatureFlagProvider>
        <AuthProvider>
          <UIProvider>
            <App />
          </UIProvider>
        </AuthProvider>
      </FeatureFlagProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
