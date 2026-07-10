import React from "react";
import { Autocomplete, TextField, Checkbox } from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import TextFieldLabel from "../Label";

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;

const AutocompleteDropdown = ({
  name,
  label,
  options = [],
  multiple = false,
  value,
  setFieldValue,
  handleBlur,
  touched,
  errors,
  required,
  sx = {},
  ...rest
}) => {
  return (
    <Autocomplete
      fullWidth
      multiple={multiple}
      disablePortal
      size="small"
      disableCloseOnSelect={multiple}
      options={options}
      value={value || (multiple ? [] : null)}
      onChange={(event, newValue) => {
        setFieldValue(name, newValue);
      }}
      onBlur={handleBlur}
      renderOption={
        multiple
          ? (props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option}
            </li>
          )
          : undefined
      }
      renderInput={(params) => (
        <>
          <TextFieldLabel label={label} required={required} />
          <TextField
            fullWidth
            {...params}
            name={name}
            placeholder={`Select ${label}`}
            error={touched?.[name] && Boolean(errors?.[name])}
            helperText={touched?.[name] && errors?.[name]}
          />
        </>
      )}

      {...rest}
    />
  );
};

export default AutocompleteDropdown;
