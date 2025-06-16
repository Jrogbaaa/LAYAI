/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  			'space-grotesk': ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
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
  				50: 'rgb(var(--primary-50))',
  				100: 'rgb(var(--primary-100))',
  				500: 'rgb(var(--primary-500))',
  				600: 'rgb(var(--primary-600))',
  				700: 'rgb(var(--primary-700))',
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
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
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			glass: {
  				DEFAULT: 'var(--surface-glass)',
  				dark: 'var(--surface-glass-dark)',
  			},
  			glow: 'var(--shadow-glow)',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			"accordion-down": {
  				from: { height: "0" },
  				to: { height: "var(--radix-accordion-content-height)" },
  			},
  			"accordion-up": {
  				from: { height: "var(--radix-accordion-content-height)" },
  				to: { height: "0" },
  			},
  			float: {
  				"0%, 100%": { transform: "translateY(0px)" },
  				"50%": { transform: "translateY(-4px)" },
  			},
  			"pulse-glow": {
  				"0%, 100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.1)" },
  				"50%": { boxShadow: "0 0 30px rgba(59, 130, 246, 0.2)" },
  			},
  			"slide-up": {
  				from: {
  					opacity: "0",
  					transform: "translateY(10px)",
  				},
  				to: {
  					opacity: "1",
  					transform: "translateY(0)",
  				},
  			},
  			"scale-in": {
  				from: {
  					opacity: "0",
  					transform: "scale(0.95)",
  				},
  				to: {
  					opacity: "1",
  					transform: "scale(1)",
  				},
  			},
  			shimmer: {
  				"0%": { transform: "translateX(-100%)" },
  				"100%": { transform: "translateX(100%)" },
  			},
  		},
  		animation: {
  			"accordion-down": "accordion-down 0.2s ease-out",
  			"accordion-up": "accordion-up 0.2s ease-out",
  			float: "float 3s ease-in-out infinite",
  			"pulse-glow": "pulse-glow 2s ease-in-out infinite",
  			"slide-up": "slide-up 0.3s ease-out",
  			"scale-in": "scale-in 0.2s ease-out",
  			shimmer: "shimmer 2s linear infinite",
  		},
  		backdropBlur: {
  			xs: "2px",
  		},
  		boxShadow: {
  			'soft': 'var(--shadow-soft)',
  			'medium': 'var(--shadow-medium)',
  			'large': 'var(--shadow-large)',
  			'glow': 'var(--shadow-glow)',
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem',
  		},
  		transitionDuration: {
  			'400': '400ms',
  			'600': '600ms',
  		},
  		borderColor: {
  			'glass': 'var(--border-glass)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}; 