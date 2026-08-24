import React from "react";
import { Autocomplete, TextField, Checkbox, Chip, Box, Typography, createFilterOptions } from "@mui/material";
import { CheckBox, CheckBoxOutlineBlank, AddCircleOutline } from "@mui/icons-material";
import TextFieldLabel from "../Label";

const icon = <CheckBoxOutlineBlank fontSize="small" />;
const checkedIcon = <CheckBox fontSize="small" />;
const defaultFilter = createFilterOptions();

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
  creatable = true,
  onNewOptionCreated,
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
      filterOptions={(opts, params) => {
        const filtered = defaultFilter(opts, params);
        const { inputValue } = params;
        const trimmed = inputValue.trim();

        const isExisting = opts.some((option) => {
          const optStr = typeof option === "string" ? option : option.label || "";
          return optStr.toLowerCase() === trimmed.toLowerCase();
        });

        if (creatable && trimmed !== "" && !isExisting) {
          filtered.push(`+ Add "${trimmed}"`);
        }

        return filtered;
      }}
      onChange={(event, newValue) => {
        if (multiple && Array.isArray(newValue)) {
          const cleanedValues = newValue.map((item) => {
            if (typeof item === "string" && item.startsWith('+ Add "') && item.endsWith('"')) {
              const raw = item.slice(7, -1);
              if (onNewOptionCreated) onNewOptionCreated(raw);
              return raw;
            }
            return item;
          });
          setFieldValue(name, cleanedValues);
        } else {
          let finalVal = newValue;
          if (typeof newValue === "string" && newValue.startsWith('+ Add "') && newValue.endsWith('"')) {
            finalVal = newValue.slice(7, -1);
            if (onNewOptionCreated) onNewOptionCreated(finalVal);
          }
          setFieldValue(name, finalVal);
        }
      }}
      onBlur={handleBlur}
      renderTags={
        multiple
          ? (tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  size="small"
                  label={option}
                  sx={{
                    bgcolor: "#e0f2fe",
                    color: "#0369a1",
                    fontWeight: 700,
                    fontSize: "11.5px",
                    m: "2px",
                    border: "1px solid #bae6fd",
                    "& .MuiChip-deleteIcon": {
                      color: "#0284c7",
                      fontSize: "14px",
                      "&:hover": { color: "#0369a1" },
                    },
                  }}
                />
              ))
          : undefined
      }
      renderOption={
        multiple
          ? (props, option, { selected }) => {
              const isCreateOption = typeof option === "string" && option.startsWith('+ Add "');
              if (isCreateOption) {
                return (
                  <li {...props} style={{ color: "#176FC1", fontWeight: 700, backgroundColor: "#f0f9ff" }}>
                    <AddCircleOutline fontSize="small" sx={{ mr: 1, color: "#176FC1" }} />
                    {option}
                  </li>
                );
              }

              return (
                <li {...props}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option}
                </li>
              );
            }
          : undefined
      }
      renderInput={(params) => (
        <>
          {label ? <TextFieldLabel label={label} required={required} /> : null}
          <TextField
            fullWidth
            {...params}
            name={name}
            placeholder={label ? `Select or type ${label}` : "Select or type to add..."}
            error={touched?.[name] && Boolean(errors?.[name])}
            helperText={touched?.[name] && errors?.[name]}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "#ffffff",
              },
            }}
          />
        </>
      )}
      sx={sx}
      {...rest}
    />
  );
};

export default AutocompleteDropdown;
