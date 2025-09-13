import { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
}

const Badge = ({ 
  className = '', 
  variant = 'default', 
  size = 'sm',
  children, 
  ...props 
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }
  
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  ].join(' ')

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

export default Badge