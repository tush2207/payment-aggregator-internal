import {
  Box,
  Checkbox,
  FormControl,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Typography
} from '@mui/material';
import TextFieldLabel from '../Label';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const MultiSelectCheckbox = ({
  label,
  options = [],
  value = [],
  onChange,
  width = '100%',
  required,
  error,
  helpertext
}) => {
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;

    onChange(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <FormControl sx={{ width }}>
      <TextFieldLabel label={label} required={required} />
      <Select
        error={error}
        size='small'
        multiple
        value={value}
        onChange={handleChange}
        displayEmpty
        renderValue={(selected) => {
          if (selected.length === 0) {
            return <>Select {label}</>;
          }

          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((val) => (
                <>{val}
                </>
              ))}
            </Box>
          );
        }}
        MenuProps={MenuProps}
        input={<OutlinedInput placeholder={`Select ${label}`} />}
      >
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            <Checkbox checked={value.includes(opt)} />
            <ListItemText primary={opt} />
          </MenuItem>
        ))}
      </Select>
      <Typography fontSize={'0.75rem'} margin='4px 14px 0px' color='error'>
        {helpertext}
      </Typography>
    </FormControl>
  );
};

export default MultiSelectCheckbox;
