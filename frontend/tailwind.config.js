/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  	extend: {
  		colors: {
  			rich_black: {
  				'100': '#030609',
  				'200': '#050b11',
  				'300': '#08111a',
  				'400': '#0b1622',
  				'500': '#0d1b2a',
  				'600': '#234870',
  				'700': '#3875b6',
  				'800': '#74a3d4',
  				'900': '#bad1ea',
  				DEFAULT: '#0d1b2a'
  			},
  			oxford_blue: {
  				'100': '#05080c',
  				'200': '#0b0f18',
  				'300': '#101724',
  				'400': '#161f30',
  				'500': '#1b263b',
  				'600': '#364c75',
  				'700': '#5172af',
  				'800': '#8ba1ca',
  				'900': '#c5d0e4',
  				DEFAULT: '#1b263b'
  			},
  			yinmn_blue: {
  				'100': '#0d1218',
  				'200': '#1a242f',
  				'300': '#273647',
  				'400': '#34485f',
  				'500': '#415a77',
  				'600': '#587aa1',
  				'700': '#819bb9',
  				'800': '#abbcd1',
  				'900': '#d5dee8',
  				DEFAULT: '#415a77'
  			},
  			silver_lake_blue: {
  				'100': '#161c23',
  				'200': '#2c3746',
  				'300': '#425369',
  				'400': '#586f8d',
  				'500': '#778da9',
  				'600': '#91a2ba',
  				'700': '#acbacb',
  				'800': '#c8d1dc',
  				'900': '#e3e8ee',
  				DEFAULT: '#778da9'
  			},
  			platinum: {
  				'100': '#2e2f2a',
  				'200': '#5b5e53',
  				'300': '#898c7e',
  				'400': '#b4b6ad',
  				'500': '#e0e1dd',
  				'600': '#e5e6e3',
  				'700': '#ececea',
  				'800': '#f2f3f1',
  				'900': '#f9f9f8',
  				DEFAULT: '#e0e1dd'
  			},
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
  				foreground: 'hsl(var(--primary-foreground))'
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
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'pulse-soft': 'pulseSoft 2s infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			pulseSoft: {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.8'
  				}
  			}
  		},
  		backdropBlur: {
  			xs: '2px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};