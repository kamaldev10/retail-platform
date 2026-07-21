import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  error,
  children,
  hint,
}) => {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1 mb-4">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {hint && (
        <span id={hintId} className="text-xs text-gray-500">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-xs font-semibold text-red-600">
          {error}
        </span>
      )}
    </div>
  );
};
