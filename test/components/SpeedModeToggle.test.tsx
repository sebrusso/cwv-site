import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpeedModeToggle } from '@/components/SpeedModeToggle';

describe('SpeedModeToggle', () => {
  it('renders both toggle options', () => {
    const mockOnToggle = jest.fn();
    render(<SpeedModeToggle isSpeedMode={false} onToggle={mockOnToggle} />);
    
    expect(screen.getByText('Regular')).toBeInTheDocument();
    expect(screen.getByText('Speed Mode')).toBeInTheDocument();
  });

  it('calls onToggle when clicking speed mode button', () => {
    const mockOnToggle = jest.fn();
    render(<SpeedModeToggle isSpeedMode={false} onToggle={mockOnToggle} />);
    
    fireEvent.click(screen.getByText('Speed Mode'));
    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it('calls onToggle when clicking regular mode button', () => {
    const mockOnToggle = jest.fn();
    render(<SpeedModeToggle isSpeedMode={true} onToggle={mockOnToggle} />);
    
    fireEvent.click(screen.getByText('Regular'));
    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });

  it('shows correct active state for speed mode', () => {
    const mockOnToggle = jest.fn();
    render(<SpeedModeToggle isSpeedMode={true} onToggle={mockOnToggle} />);
    
    const speedModeButton = screen.getByText('Speed Mode').closest('button');
    expect(speedModeButton).toHaveClass('bg-orange-500');
  });

  it('shows correct active state for regular mode', () => {
    const mockOnToggle = jest.fn();
    render(<SpeedModeToggle isSpeedMode={false} onToggle={mockOnToggle} />);
    
    const regularButton = screen.getByText('Regular').closest('button');
    expect(regularButton).toHaveClass('bg-white');
  });
}); 