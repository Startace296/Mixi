import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true };

/** Shows where the app navigated to, plus any router state, so tests can assert on it. */
function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location" data-state={JSON.stringify(location.state ?? null)}>
      {location.pathname}
    </div>
  );
}

/**
 * Renders `element` at `path` inside a MemoryRouter. Any other route renders the
 * LocationProbe, so a navigation shows up as `screen.getByTestId('location')`.
 */
export function renderAtRoute(element, { path = '/', state } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]} future={ROUTER_FUTURE}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** The <input> that belongs to a floating label (labels here aren't linked with htmlFor). */
export function inputByLabel(screen, label) {
  return screen.getByText(label, { selector: 'label' }).parentElement.querySelector('input');
}
