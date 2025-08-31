import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}", // Ensure feature modules are included
  ],
  theme: {
  	extend: {
        // Material Design 3 Typography Scale
        fontSize: {
            'display-large': ['3.5625rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }], // 57px
            'display-medium': ['2.8125rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 45px
            'display-small': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }], // 36px

            'headline-large': ['2rem', { lineHeight: '1.3', letterSpacing: '0' }], // 32px
            'headline-medium': ['1.75rem', { lineHeight: '1.35', letterSpacing: '0' }], // 28px
            'headline-small': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0' }], // 24px

            'title-large': ['1.375rem', { lineHeight: '1.45', letterSpacing: '0' }], // 22px
            'title-medium': ['1rem', { lineHeight: '1.5', letterSpacing: '0.01em' }], // 16px
            'title-small': ['0.875rem', { lineHeight: '1.55', letterSpacing: '0.01em' }], // 14px

            'body-large': ['1rem', { lineHeight: '1.5', letterSpacing: '0.01em' }], // 16px
            'body-medium': ['0.875rem', { lineHeight: '1.55', letterSpacing: '0.02em' }], // 14px
            'body-small': ['0.75rem', { lineHeight: '1.6', letterSpacing: '0.03em' }], // 12px

            'label-large': ['0.875rem', { lineHeight: '1.45', letterSpacing: '0.01em' }], // 14px
            'label-medium': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }], // 12px
            'label-small': ['0.6875rem', { lineHeight: '1.55', letterSpacing: '0.03em' }], // 11px
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
  				foreground: 'hsl(var(--on-primary))', // Corrected to use on-primary
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
                foreground: 'hsl(var(--on-tertiary))', // Corrected to on-tertiary
                container: 'hsl(var(--tertiary-container))',
                'on-container': 'hsl(var(--on-tertiary-container))'
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
  			},
            // New M3-inspired colors for phase types
            phase: {
                form: {
                    DEFAULT: 'hsl(var(--phase-form))',
                    foreground: 'hsl(var(--on-phase-form))',
                    container: 'hsl(var(--phase-form-container))',
                    'on-container': 'hsl(var(--on-phase-form-container))',
                },
                review: {
                    DEFAULT: 'hsl(var(--phase-review))',
                    foreground: 'hsl(var(--on-phase-review))',
                    container: 'hsl(var(--phase-review-container))',
                    'on-container': 'hsl(var(--on-phase-review-container))',
                },
                email: {
                    DEFAULT: 'hsl(var(--phase-email))',
                    foreground: 'hsl(var(--on-phase-email))',
                    container: 'hsl(var(--phase-email-container))',
                    'on-container': 'hsl(var(--on-phase-email-container))',
                },
                scheduling: {
                    DEFAULT: 'hsl(var(--phase-scheduling))',
                    foreground: 'hsl(var(--on-phase-scheduling))',
                    container: 'hsl(var(--phase-scheduling-container))',
                    'on-container': 'hsl(var(--on-phase-scheduling-container))',
                },
                decision: {
                    DEFAULT: 'hsl(var(--phase-decision))',
                    foreground: 'hsl(var(--on-phase-decision))',
                    container: 'hsl(var(--phase-decision-container))',
                    'on-container': 'hsl(var(--on-phase-decision-container))',
                },
                recommendation: {
                    DEFAULT: 'hsl(var(--phase-recommendation))',
                    foreground: 'hsl(var(--on-phase-recommendation))',
                    container: 'hsl(var(--phase-recommendation-container))',
                    'on-container': 'hsl(var(--on-phase-recommendation-container))',
                },
                screening: { // New screening phase colors
                    DEFAULT: 'hsl(var(--phase-screening))',
                    foreground: 'hsl(var(--on-phase-screening))',
                    container: 'hsl(var(--phase-screening-container))',
                    'on-container': 'hsl(var(--on-phase-screening-container))',
                },
            }
  		},
  		borderRadius: {
            'none': '0',
            'sm': '4px', // M3 small
            'md': '8px', // M3 medium (default for many components)
  			lg: '12px', // M3 large
            'xl': '16px', // M3 extra large
            '2xl': '24px', // M3 extra extra large
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