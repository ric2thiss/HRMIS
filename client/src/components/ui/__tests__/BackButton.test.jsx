import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BackButton from '../BackButton/BackButton';

// Helper function to render with Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BackButton', () => {
  it('renders with default props', () => {
    renderWithRouter(<BackButton />);
    
    const link = screen.getByRole('link', { name: /back/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders with custom label', () => {
    renderWithRouter(<BackButton label="Go Back" />);
    
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('renders with custom route', () => {
    renderWithRouter(<BackButton to="/home" label="Back to Home" />);
    
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toHaveAttribute('href', '/home');
  });

  it('has correct CSS classes for styling', () => {
    renderWithRouter(<BackButton />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveClass('inline-flex', 'items-center', 'text-blue-600');
  });

  it('renders with SVG icon', () => {
    renderWithRouter(<BackButton />);
    
    const link = screen.getByRole('link');
    const svg = link.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

