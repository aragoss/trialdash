import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import { styles } from './styles';
import ContentHeader from '../ContentHeader';
import CustomInput from '../CustomInput';
import CustomHeadline from '../CustomHeadline';
import AttributeItem from '../AttributeItem';
import FieldTypesPanel from '../FieldTypesPanel';
import Footer from '../Footer';

const AddSetForm = ({
  classes,
  theme,
  headerTitle,
  headerDescription,
  cancelFormHandler,
  commonInputs,
  descriptionInput,
}) => (
  <>
    <ContentHeader
      title={headerTitle}
      bottomDescription={headerDescription}
    />
    <FieldTypesPanel />
    <form className={classes.form}>
      <Grid container spacing={4}>
        {commonInputs.map(input => (
          <Grid item xs={3} key={input.key}>
            <CustomInput
              className={classes.mainInput}
              id={input.id}
              label={input.label}
              bottomDescription={input.description}
            />
          </Grid>
        ))}
      </Grid>
      {descriptionInput ? (
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <CustomInput
              className={classes.mainInput}
              id={descriptionInput.id}
              label={descriptionInput.label}
              bottomDescription={descriptionInput.description}
            />
          </Grid>
        </Grid>
      ) : null}
      <CustomHeadline
        className={classes.attributesHeadline}
        title="Attributes"
        description="Drag fields from the right bar"
        titleFontSize={18}
        descriptionFontSize={16}
        titleColor={theme.palette.black.main}
        descriptionColor={theme.palette.gray.dark}
      />
      <AttributeItem
        type="text"
        title="Release type"
        inputId="trial-set-attribute-description"
        placeholder="enter sku here"
        bottomDescription="a short description of the field"
      />
    </form>
    <Footer cancelButtonHandler={cancelFormHandler} />
  </>
);

export default withStyles(styles, { withTheme: true })(AddSetForm);
