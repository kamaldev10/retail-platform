import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  profileSettingsSchema,
  ProfileSettingsValues,
} from '@/lib/schemas/profile-settings-schema';
import { FormField } from './FormField';

interface ProfileSettingsFormProps {
  initialValues?: Partial<ProfileSettingsValues>;
  onSubmitHandler?: (values: ProfileSettingsValues) => Promise<void> | void;
}

export function ProfileSettingsForm({
  initialValues,
  onSubmitHandler,
}: ProfileSettingsFormProps) {
  const [serverStatus, setServerStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: initialValues?.fullName || '',
      email: initialValues?.email || '',
      bio: initialValues?.bio || '',
      notifications: initialValues?.notifications || false,
    },
  });

  const bioValue = watch('bio') || '';

  const onFormSubmit = async (values: ProfileSettingsValues) => {
    setServerStatus(null);
    try {
      if (onSubmitHandler) {
        await onSubmitHandler(values);
      } else {
        // Simulate network latency for demo/testing
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setServerStatus({
        type: 'success',
        message: 'Profile settings updated successfully.',
      });
    } catch (err) {
      setServerStatus({
        type: 'error',
        message: 'Failed to update settings. Please try again.',
      });
    }
  };

  return (
    <div className="w-full max-w-lg p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Account Profile</h2>
      <p className="text-sm text-gray-600 mb-6">
        Update your personal details and communication preferences.
      </p>

      {serverStatus && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2 p-3 mb-5 rounded-md text-sm ${
            serverStatus.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {serverStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{serverStatus.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
        <FormField
          id="fullName"
          label="Full Name"
          error={errors.fullName?.message}
        >
          <input
            id="fullName"
            type="text"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Jane Doe"
            {...register('fullName')}
          />
        </FormField>

        <FormField
          id="email"
          label="Email Address"
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="jane@example.com"
            {...register('email')}
          />
        </FormField>

        <FormField
          id="bio"
          label="Bio"
          error={errors.bio?.message}
          hint={`${bioValue.length}/200 characters`}
        >
          <textarea
            id="bio"
            rows={3}
            aria-invalid={!!errors.bio}
            aria-describedby={
              errors.bio ? 'bio-error bio-hint' : 'bio-hint'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Short description about yourself..."
            {...register('bio')}
          />
        </FormField>

        <div className="flex items-center gap-2 mb-6">
          <input
            id="notifications"
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            {...register('notifications')}
          />
          <label
            htmlFor="notifications"
            className="text-sm font-medium text-gray-700 select-none"
          >
            Receive email notifications for order updates
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
