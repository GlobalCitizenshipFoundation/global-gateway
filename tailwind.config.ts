import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
        // Material Design 3 Typography Scale (1.25 ratio)
        fontSize: {
            'xs': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em' }], // 12px
            'sm': ['0.9375rem', { lineHeight: '1.4', letterSpacing: '0' }], // 15px
            'base': ['1.125rem', { lineHeight: '1.5', letterSpacing: '0' }], // 18px
            'lg': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 24px
            'xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 30px
            '2xl': ['2.3125rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 37px
            '3xl': ['2.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 46px
            '4xl': ['3.6rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // ~58px (for hero titles)
            '5xl': ['4.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // ~72px (for hero titles)
        },
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))',
                container: 'hsl(var(--primary-container))',
                'on-container': 'hsl(var(--on-primary-container))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))',
                container: 'hsl(var(--secondary-container))',
                'on-container': 'hsl(var(--on-secondary-container))'
  			},
            tertiary: {
                DEFAULT: 'hsl(var(--tertiary))',
                foreground: 'hsl(var(--tertiary-foreground))'
            },
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
                container: 'hsl(var(--destructive-container))',
                'on-container': 'hsl(var(--on-destructive-container))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
            'none': '0',
            'sm': '2px', // 2px
            'md': '4px', // 4px
  			lg: 'var(--radius)', // 8px (default)
            'xl': '12px', // 12px
            '2xl': '16px', // 16px
            'full': '9999px',
  		},
        spacing: {
            '0': '0px',
            '1': '4px',
            '2': '8px',
            '3': '12px',
            '4': '16px',
            '5': '20px',
            '6': '24px',
            '7': '28px',
            '8': '32px',
            '9': '36px',
            '10': '40px',
            '11': '44px',
            '12': '48px',
            '14': '56px',
            '16': '64px',
            '20': '80px',
            '24': '96px',
            '32': '128px',
            '40': '160px',
            '48': '192px',
            '56': '224px',
            '64': '256px',
            '72': '288px',
            '80': '320px',
            '96': '384px',
        },
        lineHeight: {
            'heading': '1.2', // For h1, h2, h3, h4, h5, h6
            'body': '1.5',   // For p, body text
            'ui': '1.4',     // For UI elements like buttons, labels
        },
        letterSpacing: {
            'tight-lg': '-0.02em', // For large headings
            'normal': '0',        // For body text and most UI
            'small-caps': '0.05em', // For small caps or labels
        },
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;