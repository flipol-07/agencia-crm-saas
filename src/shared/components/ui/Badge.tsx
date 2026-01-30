import * as React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'outline' | 'success' | 'warning' | 'error' | 'brand'
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-white/10 text-white hover:bg-white/20',
            outline: 'border border-white/20 text-text-secondary',
            success: 'bg-lime-500/10 text-lime-400 border border-lime-500/20',
            warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
            error: 'bg-red-500/10 text-red-400 border border-red-500/20',
            brand: 'bg-brand/10 text-brand border border-brand/20',
        }

        const classes = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`

        return (
            <span ref={ref} className={classes} {...props} />
        )
    }
)
Badge.displayName = 'Badge'
