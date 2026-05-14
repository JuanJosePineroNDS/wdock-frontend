import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { InvalidTokenState } from '@/components/states/InvalidTokenState';

describe('signing app smoke', () => {
  it('renders the invalid token placeholder on unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <Routes>
          <Route path="*" element={<InvalidTokenState />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/invalid token/i)).toBeInTheDocument();
  });
});
