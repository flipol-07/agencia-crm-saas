import * as React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', hoverEffect = false, children, ...props }, ref) => {
        const baseStyles = 'glass rounded-xl border border-white/5 overflow-hidden'
        const hoverStyles = hoverEffect
            ? 'transition-all duration-300 hover:bg-white/[0.07] hover:border-white/10 hover:shadow-xl hover:shadow-black/20'
            : ''

        const classes = `${baseStyles} ${hoverStyles} ${className}`.trim()

        return (
            <div ref={ref} className={classes} {...props}>
                {children}
            </div>
        )
    }
)
Card.displayName = 'Card'
