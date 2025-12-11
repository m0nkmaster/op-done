import { Alert, Stack, Typography } from '@mui/material';
import type { ValidationError } from '../utils/validation';

interface ValidationDisplayProps {
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function ValidationDisplay({ errors, warnings }: ValidationDisplayProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {errors.map((error, index) => (
        <Alert key={`error-${index}`} severity="error" sx={{ py: 0.5 }}>
          <Typography variant="body2">
            <strong>{error.type === 'syntax' ? 'Syntax Error' : 'Schema Error'}:</strong> {error.message}
            {error.path && <> (at {error.path})</>}
          </Typography>
        </Alert>
      ))}
      
      {warnings.map((warning, index) => (
        <Alert key={`warning-${index}`} severity="warning" sx={{ py: 0.5 }}>
          <Typography variant="body2">
            <strong>Range Warning:</strong> {warning.message}
            {warning.value !== undefined && <> (value: {String(warning.value)})</>}
          </Typography>
        </Alert>
      ))}
    </Stack>
  );
}
