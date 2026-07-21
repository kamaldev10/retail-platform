import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ProfileSettingsForm } from '../ProfileSettingsForm';

describe('ProfileSettingsForm', () => {
  it('renders all form input fields with accessible labels', () => {
    render(<ProfileSettingsForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/receive email notifications/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('displays validation error messages when submitted empty or invalid', async () => {
    render(<ProfileSettingsForm />);
    const submitBtn = screen.getByRole('button', { name: /save changes/i });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    });
  });

  it('binds aria-invalid and aria-describedby when field has error', async () => {
    render(<ProfileSettingsForm />);
    const nameInput = screen.getByLabelText(/full name/i);
    const submitBtn = screen.getByRole('button', { name: /save changes/i });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby', 'fullName-error');
    });
  });

  it('calls onSubmitHandler with validated values on valid submission', async () => {
    const handleSubmit = vi.fn();
    render(<ProfileSettingsForm onSubmitHandler={handleSubmit} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/full name/i), 'Alice Smith');
    await user.type(screen.getByLabelText(/email address/i), 'alice@example.com');
    await user.type(screen.getByLabelText(/bio/i), 'Software developer');
    await user.click(screen.getByLabelText(/receive email notifications/i));

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        fullName: 'Alice Smith',
        email: 'alice@example.com',
        bio: 'Software developer',
        notifications: true,
      });
    });

    expect(screen.getByRole('status')).toHaveTextContent(/profile settings updated successfully/i);
  });
});
