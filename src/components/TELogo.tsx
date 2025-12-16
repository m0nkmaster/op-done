import { Box } from '@mui/material';
import { useThemeMode } from '../context/ThemeContext';
import { TE_COLORS } from '../theme';

export function TELogo({ size = 48 }: { size?: number }) {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const iconSize = size * 0.75;
  
  // Sine wave path - 2 cycles
  const sinePath = "M0,16 Q4,16 6,10 Q8,4 10,4 Q12,4 14,10 Q16,16 18,22 Q20,28 22,28 Q24,28 26,22 Q28,16 30,10 Q32,4 34,4 Q36,4 38,10 Q40,16 44,16";
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* Sine wave icon */}
      <Box sx={{ position: 'relative', width: iconSize, height: iconSize }}>
        <svg 
          width={iconSize} 
          height={iconSize} 
          viewBox="4 0 36 32" 
          fill="none"
        >
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={TE_COLORS.cyan} />
              <stop offset="100%" stopColor={TE_COLORS.orange} />
            </linearGradient>
          </defs>
          
          <path
            d={sinePath}
            stroke="url(#waveGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </Box>
      
      {/* Logo text */}
      <Box
        sx={{
          fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
          fontWeight: 700,
          fontSize: size * 0.6,
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'baseline',
          position: 'relative',
        }}
      >
        <Box 
          component="span" 
          sx={{ 
            background: `linear-gradient(135deg, ${TE_COLORS.cyan} 0%, ${TE_COLORS.cyanLight} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Synth
        </Box>
        <Box 
          component="span" 
          sx={{ 
            color: isDark ? TE_COLORS.cyan : TE_COLORS.orange,
            fontSize: '0.7em',
            mx: 0.3,
            opacity: 0.7,
          }}
        >
          .
        </Box>
        <Box 
          component="span" 
          sx={{ 
            background: `linear-gradient(135deg, ${TE_COLORS.orange} 0%, ${TE_COLORS.orangeLight} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Tools
        </Box>
      </Box>
    </Box>
  );
}
