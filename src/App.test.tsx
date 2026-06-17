import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ride planner navigation', () => {
  render(<App />);
  expect(screen.getByText(/Ride Planner/i)).toBeTruthy();
});
