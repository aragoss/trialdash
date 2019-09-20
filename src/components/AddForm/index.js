import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import { styles } from './styles';
import ContentHeader from '../ContentHeader';
import CustomInput from '../CustomInput';
import CustomHeadline from '../CustomHeadline';
import AttributeItem from '../AttributeItem';
import Footer from '../Footer';
import {
  ATTRIBUTE_ITEM_CHECKBOX_TYPE,
  ATTRIBUTE_ITEM_INPUT_TYPE,
  ATTRIBUTE_ITEM_RADIO_TYPE,
} from '../../constants/attributes';

const AddForm = ({
  classes,
  theme,
  headerTitle,
  headerDescription,
  cancelFormHandler,
  commonInputs,
  descriptionInput,
  rightPanel,
  withFooter,
}) => (
  <>
    <ContentHeader
      title={headerTitle}
      bottomDescription={headerDescription}
    />
    {rightPanel}
    <form className={classes.form}>
      <Grid container spacing={4}>
        {commonInputs.map(input => (
          <Grid item xs={3} key={input.key}>
            <CustomInput
              className={classes.mainInput}
              id={input.id}
              label={input.label}
              bottomDescription={input.description}
              placeholder={input.placeholder}
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
              placeholder={descriptionInput.placeholder}
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
        fieldType="text"
        contentType={ATTRIBUTE_ITEM_INPUT_TYPE}
        title="Release type"
        inputId="attribute-item-1"
        placeholder="enter sku here"
        description="a short description of the field"
      />
      <AttributeItem
        fieldType="selectList"
        contentType={ATTRIBUTE_ITEM_CHECKBOX_TYPE}
        title="Type"
        inputId="attribute-item-2"
        description="a short description of the field"
      />
      <AttributeItem
        fieldType="selectList"
        contentType={ATTRIBUTE_ITEM_RADIO_TYPE}
        title="Type"
        inputId="attribute-item-3"
        description="a short description of the field"
      />
    </form>
    {withFooter ? <Footer cancelButtonHandler={cancelFormHandler} /> : null}
  </>
);

export default withStyles(styles, { withTheme: true })(AddForm);