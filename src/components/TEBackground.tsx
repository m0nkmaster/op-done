import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { TE_COLORS } from '../theme';

interface TEBackgroundProps {
  isDark?: boolean;
}

export function TEBackground({ isDark = true }: TEBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Color palettes
    const darkColors = [TE_COLORS.orange, TE_COLORS.cyan, TE_COLORS.yellow, TE_COLORS.pink, TE_COLORS.green];
    const lightColors = ['#ff6b35', '#00d9ff', '#ffbe0b', '#8338ec', '#06ffa5'];
    const colors = isDark ? darkColors : lightColors;

    let frame = 0;

    const draw = () => {
      // Background gradient
      if (isDark) {
        const gradient = ctx.createRadialGradient(
          canvas.width * 0.2, canvas.height * 0.8, 0,
          canvas.width * 0.5, canvas.height * 0.5, canvas.width
        );
        gradient.addColorStop(0, '#0d0d10');
        gradient.addColorStop(0.5, '#0a0a0c');
        gradient.addColorStop(1, '#080809');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#e8e8e8';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const spacing = isDark ? 100 : 80;
      const time = frame * 0.008;

      // Subtle grid pattern for dark mode
      if (isDark) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.3;
        ctx.globalAlpha = 0.03;
        
        // Horizontal lines
        for (let y = 0; y < canvas.height; y += spacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
        // Vertical lines
        for (let x = 0; x < canvas.width; x += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
      }

      // Animated shapes
      for (let x = 0; x < canvas.width + spacing; x += spacing) {
        for (let y = 0; y < canvas.height + spacing; y += spacing) {
          const idx = Math.floor((x + y) / spacing) % colors.length;
          ctx.strokeStyle = colors[idx];
          ctx.lineWidth = isDark ? 1 : 0.5;
          ctx.globalAlpha = isDark ? 0.08 : 0.15;

          const offset = Math.sin(time + x * 0.008 + y * 0.008) * (isDark ? 15 : 10);
          const scale = 1 + Math.sin(time * 0.5 + x * 0.005) * 0.1;

          if ((x + y) % (spacing * 3) < spacing) {
            // Lines
            ctx.beginPath();
            ctx.moveTo(x, y + offset);
            ctx.lineTo(x + 40 * scale, y + 20 + offset);
            ctx.stroke();
          } else if ((x + y) % (spacing * 3) < spacing * 2) {
            // Circles
            ctx.beginPath();
            ctx.arc(x + 20, y + 20 + offset, 4 * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner dot in dark mode
            if (isDark) {
              ctx.fillStyle = colors[idx];
              ctx.globalAlpha = 0.04;
              ctx.beginPath();
              ctx.arc(x + 20, y + 20 + offset, 2 * scale, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Squares
            const size = 20 * scale;
            ctx.strokeRect(x + 10, y + 10 + offset, size, size);
          }
        }
      }

      // Floating particles in dark mode
      if (isDark) {
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 30; i++) {
          const px = (canvas.width * (i * 0.033 + Math.sin(time + i) * 0.1) + frame * 0.1) % canvas.width;
          const py = (canvas.height * (i * 0.037 + Math.cos(time + i * 0.7) * 0.1)) % canvas.height;
          const size = 1 + Math.sin(time + i * 0.5) * 0.5;
          
          ctx.fillStyle = colors[i % colors.length];
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frame++;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [isDark]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </Box>
  );
}
