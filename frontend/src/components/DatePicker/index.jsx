import { MobileDatePicker, MobileDateTimePicker } from '@mui/x-date-pickers';
import TextFieldLabel from '../Label';
import dayjs from 'dayjs';
import { Box } from '@mui/material';
import { Stack } from '@mui/system';

export default function DatePicker({
  name,
  label,
  required = false,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disablePast,
  disabled,
  type = 'date', // 'date' or 'datetime'
  dateFormat,//'YYYY-MM-DD',
  fullWidth,
  disableFuture,
  style
}) {
  const PickerComponent = type === 'date' ? MobileDatePicker : MobileDateTimePicker;

  return (
    <Stack direction='column'>
      <TextFieldLabel label={label} required={required} />
      <PickerComponent
        closeOnSelect
        disabled={disabled}
        value={value ? dayjs(value) : null}
        onChange={(val) => {
          if (val && val.isValid()) {
            const formatted = val.toDate().toISOString(); // <-- This is what you want
            onChange?.(formatted);
          } else {
            onChange?.('');
          }
          onBlur?.();
        }}
        onError={(reason, value) => {
          if (reason) {
            console.warn('DatePicker error:', reason, value);
          }
        }}
        disablePast={disablePast}
        disableFuture={disableFuture}
        format="DD/MM/YYYY" // display format for users only
        slotProps={{
          textField: {
            name,
            fullWidth: fullWidth,
            size: 'small',
            required,
            error: !!error,
            helperText,
            onBlur,
          },
        }}
      />
    </Stack>
  );
}
