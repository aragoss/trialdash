import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { styles } from './styles';

const CustomInput = ({
  label,
  bottomDescription,
  id,
  classes,
  withBorder,
  placeholder,
  className,
  onChange,
}) => (
  <TextField
    onChange={onChange}
    className={className}
    label={label}
    helperText={bottomDescription}
    id={id}
    fullWidth
    FormHelperTextProps={{ classes: { root: classes.bottomDescription } }}
    placeholder={placeholder}
    InputLabelProps={{
      shrink: true,
      focused: false,
      classes: { formControl: classes.label },
    }}
    InputProps={{
      disableUnderline: true,
      classes: {
        root: withBorder ? classes.inputWithBorder : classes.input,
        formControl: classes.formControl,
      },
    }}
  />
);

export default withStyles(styles)(CustomInput);
