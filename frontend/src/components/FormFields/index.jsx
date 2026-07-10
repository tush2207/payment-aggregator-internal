import { Add, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import TextFieldLabel from '../Label';
import { numberInputWithoutArrowsSX } from '&src/utils';
import { Box } from '@mui/system';

// ========== FormField ==========
export function FormField({
  label,
  name,
  value,
  onChange,
  onBlur,
  helperText,
  type = 'text',
  disabled,
  size = 'small',
  required,
  placeholder,
  view = false
}) {
  return (
    <>
      <TextFieldLabel label={label} required={required} />
      {view ?
        <TextFieldLabel label={value} />
        :
        <>
          <TextField
            name={name}
            value={value}
            onBlur={onBlur}
            onChange={onChange}
            type={type}
            error={!!helperText}
            helperText={helperText}
            fullWidth
            disabled={disabled}
            size={size}
            placeholder={placeholder || `Enter ${label}`}
          />
        </>}
    </>

  );
}

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  helperText: PropTypes.string,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.string,
  required: PropTypes.bool,
};

// ========== TextAreaField ==========
export function TextAreaField({
  label,
  name,
  value,
  onChange,
  onBlur,
  helperText,
  size = 'small',
  required,
  rows = 2,
  disabled,
  placeholder
}) {
  return (
    <>
      <TextFieldLabel label={label} required={required} />
      <TextField
        autoComplete='new-text'
        disabled={disabled}
        name={name}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        type="text"
        error={!!helperText}
        helperText={helperText}
        fullWidth
        multiline
        rows={rows}
        size={size}

        placeholder={placeholder || `Enter ${label}`}
      />
    </>
  );
}

TextAreaField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  helperText: PropTypes.string,
  size: PropTypes.string,
  required: PropTypes.bool,
};

// ========== DateField ==========
export function DateField({
  label,
  name,
  value,
  onChange,
  onBlur,
  helperText,
  size = 'small',
  required,
}) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <TextFieldLabel label={label} required={required} />
      <TextField
        name={name}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        type="date"
        error={!!helperText}
        helperText={helperText}
        fullWidth
        size={size}
        inputProps={{ max: today }}
      />
    </>
  );
}

DateField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  helperText: PropTypes.string,
  size: PropTypes.string,
  required: PropTypes.bool,
};

// ========== EmailField ==========
export function EmailField({
  label = 'Email',
  name,
  value,
  onChange,
  onBlur,
  helperText,
  required,
  size = 'small',
  disabled
}) {
  return (
    <>
      <TextFieldLabel label={label} required={required} />
      <TextField
        disabled={disabled}
        name={name}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        type="email"
        error={!!helperText}
        helperText={helperText}
        fullWidth
        size={size}
        placeholder={`Enter ${label}`}
      />
    </>
  );
}

EmailField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  size: PropTypes.string,
};

// ========== NumberField ==========
export function NumberField({
  label,
  name,
  value,
  onChange,
  onBlur,
  helperText,
  size = 'small',
  required,
  placeholder,
  InputProps,
  disabled
}) {
  return (
    <>
      <TextFieldLabel label={label} required={required} />
      <TextField
        name={name}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        type="number"
        error={!!helperText}
        helperText={helperText}
        fullWidth
        disabled={disabled}
        size={size}
        placeholder={placeholder || `Enter ${label}`}
        inputProps={{
          min: 0,
        }}
        InputProps={{
          sx: numberInputWithoutArrowsSX,
          ...InputProps
        }}
      />
    </>
  );
}

NumberField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  helperText: PropTypes.string,
  size: PropTypes.string,
  required: PropTypes.bool,
};

// ========== MobileNoField ==========
export function MobileNoField(props) {
  return (
    <NumberField {...props} />
  );
}

MobileNoField.propTypes = NumberField.propTypes;

// ========== Pass Field ==========
export function PasswordField({
  label = 'Password',
  name,
  value,
  onChange,
  onBlur,
  helperText,
  defaultValue,
  size = 'small',
  required,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword(prev => !prev);

  return (
    <>
      <TextFieldLabel label={label} required={required} />
      <TextField
        name={name}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        type={showPassword ? 'text' : 'password'}
        error={!!helperText}
        helperText={helperText}
        defaultValue={defaultValue}
        fullWidth
        size={size}
        placeholder={`Enter ${label}`}
        inputProps={{ autoComplete: 'new-password' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={togglePasswordVisibility} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </>
  );
}

PasswordField.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  helperText: PropTypes.string,
  defaultValue: PropTypes.any,
  size: PropTypes.string,
  required: PropTypes.bool,
};

// ========== SelectField ==========
export function SelectField({
  label,
  name,
  value,
  onChange,
  onBlur,
  helperText,
  children,
  required,
  size = 'small',
}) {
  return (
    <>
      <TextFieldLabel label={label} required={required} />
      <Select
        name={name}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        error={!!helperText}
        fullWidth
        size={size}
        displayEmpty
      >
        {children}
      </Select>
    </>
  );
}

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  helperText: PropTypes.string,
  children: PropTypes.node.isRequired,
  required: PropTypes.bool,
  size: PropTypes.string,
};


export const ChipInput = ({ label = "Add Service", value = [], placeholder = "Enter service", onChange }) => {
  const [inputValue, setInputValue] = useState("");
  const [chips, setChips] = useState(value || []);
  const [services, setServices] = useState(value || []);

  // Sync state if `value` changes (important for edit mode)
  useEffect(() => {
    setChips(value || []);
    setServices(value || []);
  }, [value]);

  const handleAdd = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !chips.includes(trimmedValue)) {
      const newChips = [...chips, trimmedValue];
      setChips(newChips);
      setServices(newChips);
      setInputValue("");
    }
  };

  const handleDelete = (chipToDelete) => {
    const newChips = chips.filter((chip) => chip !== chipToDelete);
    setChips(newChips);
    setServices(newChips);
    onChange?.(newChips);
  };

  // Notify parent of changes
  useEffect(() => {
    onChange?.(services);
  }, [services]);

  return (
    <Box>
      <TextFieldLabel label={label} />
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAdd}
          startIcon={<Add />}
        >
          Add
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
        {chips.map((chip, index) => (
          <Chip
            key={index}
            label={chip}
            onDelete={() => handleDelete(chip)}
            color="primary"
            variant="outlined"
          />
        ))}
      </Stack>
    </Box>
  );
};

