import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import { setAuthTokenGetter } from '@workspace/api-client-react';
import { getAccessToken } from '@/lib/supabase';
import { ApiError } from '@/lib/api';

import './index.css';

setAuthTokenGetter(getAccessToken);

// Failures already explained to the person in a notification need no further noise.
window.addEventListener('unhandledrejection', event => {
  if (event.reason instanceof ApiError && event.reason.notified) event.preventDefault();
});

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
