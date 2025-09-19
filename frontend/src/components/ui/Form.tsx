import { ReactNode } from 'react'
import Button from './Button'

interface FormProps {
  onSubmit: (e: React.FormEvent) => void
  children: ReactNode
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  isSubmitting?: boolean
  submitDisabled?: boolean
}

export function Form({
  onSubmit,
  children,
  submitLabel = '送信',
  cancelLabel = 'キャンセル',
  onCancel,
  isSubmitting = false,
  submitDisabled = false
}: FormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || submitDisabled}
        >
          {isSubmitting ? '処理中...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

interface FormFieldProps {
  label: string
  required?: boolean
  children: ReactNode
  error?: string
}

export function FormField({ label, required, children, error }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

interface FormSectionProps {
  title?: string
  children: ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      )}
      {children}
    </div>
  )
}