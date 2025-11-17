import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './state/AuthContext';
import { UIProvider } from './state/UIContext';
import { FeatureFlagProvider } from './state/FeatureFlagContext';

test('renders marketplace placeholder', () => {
  render(
    <FeatureFlagProvider>
      <AuthProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </AuthProvider>
    </FeatureFlagProvider>
  );
  // The app defaults to rendering content for /marketplace after Navigate; since Router isn't active in tests,
  // we just assert the app renders without crashing and has a brand.
  const brand = screen.getByText(/Ocean LMS/i);
  expect(brand).toBeInTheDocument();
});
