/* eslint-disable prefer-destructuring */
import React from 'react';
import { withStyles } from '@material-ui/core';
import update from 'immutability-helper';
import uuid from 'uuid/v4';
import moment from 'moment';
import Typography from '@material-ui/core/Typography';
import InputAdornment from '@material-ui/core/InputAdornment';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import classnames from 'classnames';
import { compose } from 'recompose';
import { withRouter } from 'react-router-dom';
import { withApollo } from 'react-apollo';
import trialMutation from './utils/trialMutation';
import { styles } from './styles';
import ContentHeader from '../../ContentHeader';
import CustomInput from '../../CustomInput';
import Footer from '../../Footer';
import {
  TRIAL_SETS_DASH,
  TRIAL_SETS,
  TRIALS,
  TRIAL_MUTATION,
  TRIAL_SET_MUTATION,
} from '../../../constants/base';
import { PenIcon } from '../../../constants/icons';
import StatusBadge from '../../StatusBadge';
import StyledTabs from '../../StyledTabs';
import SimpleButton from '../../SimpleButton';
import trialSetsQuery from '../utils/trialSetQuery';
import trialsQuery from '../utils/trialQuery';
import { updateCache } from '../../../apolloGraphql';
import TrialEntities from './TrialEntities';
import CloneEntitiesDialog from '../../CloneEntitiesDialog';
import trialMutationUpdate from './utils/trialMutationUpdate';
import ConfirmDialog from '../../ConfirmDialog';

const COLORS_STATUSES = {
  design: { color: 'violet', level: 'main' },
  deploy: { color: 'orange', level: 'main' },
  execution: { color: 'orange', level: 'main' },
  complete: { color: 'gray', level: 'light' },
};

const TabPanel = ({ children, value, index, ...other }) => (
  <Typography
    component="div"
    role="tabpanel"
    hidden={value !== index}
    id={`trial-tabpanel-${index}`}
    aria-labelledby={`trial-tab-${index}`}
    style={{ marginBottom: '100px' }}
    {...other}
  >
    <Box>{children}</Box>
  </Typography>
);

class TrialForm extends React.Component {

  state = {
    trial: {
      key: this.props.trial ? this.props.trial.key : uuid(),
      trialSetKey: this.props.match.params.trialSetKey,
      experimentId: this.props.match.params.id,
      name: this.props.trial ? this.props.trial.name : '',
      status: this.props.trial && this.props.trial.status ? this.props.trial.status : 'design',
      numberOfEntities: this.props.trial ? this.props.trial.numberOfEntities : 0,
      properties: this.props.trial && this.props.trial.properties ? [...this.props.trial.properties] : [],
      entities: this.props.trial && this.props.trial.entities ? [...this.props.trial.entities.map(e => {return({...e, properties: [...e.properties]})})] : [],
      deployedEntities: this.props.trial && this.props.trial.deployedEntities ? [...this.props.trial.deployedEntities] : [],
    },
    trialSet: {},
    tabValue: this.props.tabValue || 0,
    showFooter: true,
    CloneEntitiesDialogOpen: false
  };

  componentDidMount() {
    const { client, match, trial } = this.props;
    client.query({ query: trialSetsQuery(match.params.id) }).then((data) => {
      const trialSet = data.data.trialSets.find(
        item => item.key === match.params.trialSetKey,
      );

      let properties;
      if (!trial) {
        properties = [];
        trialSet.properties.forEach(property => properties.push({ key: property.key, val: property.defaultValue }));
      } else {
        properties = [...trial.properties] || [];
      }

      this.setState(state => ({
        trial: {
          ...state.trial,
          properties,
        },
        trialSet,
      }));
    });
  }

  changeTab = (event, tabValue) => {
    this.setState({ tabValue });
  };

  onPropertyChange = (e, propertyKey) => {
    if (!e.target) return;
    let { value } = e.target;
    if (e.target.type === 'checkbox') value = e.target.checked.toString();
    let indexOfProperty = this.state.trial.properties.findIndex(
      property => property.key === propertyKey,
    );

    if (indexOfProperty === -1) {
      this.state.trial.properties.push({ val: value, key: propertyKey });
      indexOfProperty = this.state.trial.properties.length - 1;
    }
    this.setState(state => ({
      trial: {
        ...state.trial,
        properties: update(state.trial.properties, {
          [indexOfProperty]: { val: { $set: value }, key: { $set: propertyKey } },
        }),
      },
    }));
  };

  onEntityPropertyChange = (entityObj, e, propertyKey) => {
    const { trial } = this.state;
    const entitiesField = trial.status === 'deploy' ? 'deployedEntities' : 'entities';
    if (!e.target) return;
    let { value } = e.target;
    if (e.target.type === 'checkbox') value = e.target.checked.toString();
    const indexOfEntity = trial[entitiesField].findIndex(
      entity => entity.key === entityObj.key,
    );
    let indexOfProperty = trial[entitiesField][indexOfEntity].properties.findIndex(
      property => property.key === propertyKey,
    );

    if (indexOfProperty === -1) {
      trial[entitiesField][indexOfEntity].properties.push({ val: value, key: propertyKey });
      indexOfProperty = trial[entitiesField][indexOfEntity].properties.length - 1;
    } else {
      const property = {...trial[entitiesField][indexOfEntity].properties[indexOfProperty]};
      property.val = value;
      trial[entitiesField][indexOfEntity].properties[indexOfProperty] = {...property};
    }
    this.setState({ trial, changed: true });
  };

  onInputChange = (e, inputName) => {
    const { value } = e.target;

    if (inputName === 'status' && value !== this.state.trial.status) {
      this.setState({ anchorMenu: null, confirmStatusOpen: true, newStatus: value });
    } else {

      this.setState(state => ({
        editableStatus: false,
        anchorMenu: null,
        trial: {
          ...state.trial,
          [inputName]: value,
        },
      }));
    }
  };

  closeForm = (deleted) => {
    const { changed } = this.state;
    if (deleted !== true && changed) {
      this.setState({ confirmOpen: true });
      return;
    }
    const { match, history, returnFunc } = this.props;

    if (returnFunc) returnFunc(deleted);
    else {
      history.push(
        `/experiments/${match.params.id}/${TRIAL_SETS_DASH}/${match.params.trialSetKey}/${TRIALS}`,
      );
    }
  };

  updateAfterSubmit = (n, cache, trial) => {
    this.updateTrialSetNumberOfTrials(n, cache);
    trial.experimentId = this.props.match.params.id;
    this.setState({ trial });
  }

  updateTrialSetNumberOfTrials = (n, cache) => {
    const { match } = this.props;
    const { trialSet } = this.state;
    trialSet.numberOfTrials = n[trialSet.key];
    updateCache(
      cache,
      {data: { [TRIAL_SET_MUTATION]: trialSet } },
      trialSetsQuery(match.params.id),
      TRIAL_SETS,
      TRIAL_SET_MUTATION,
      true,
    );
  };

  submitTrial = async (newTrial, deleted, newStatus) => {
    const newEntity = newTrial;
    const { match, client, returnFunc } = this.props;
    const { trialSet } = this.state;
    if (deleted) newEntity.state = 'Deleted';
    if (newStatus) newEntity.status = newStatus;
    let property;
    let invalid;
    if (trialSet.properties) {
      trialSet.properties.forEach((p) => {
        property = newEntity.properties.find(ntp => ntp.key === p.key);
        if (!property) {
          property = {
            key: p.key,
            val: this.getValue(p.key, p.defaultValue)
          };
          newEntity.properties.push(property);
        }
        if (p.required && !property.val) {
          invalid = true;
          property.invalid = true;
        } else {
          delete property.invalid;
        }
      });
      if (invalid) {
        this.setState({ tabValue: 0 });
        return;
      }
    }
    await client.mutate({
      mutation: trialMutation(newEntity),
      update: (cache, mutationResult) => {
        updateCache(
          cache,
          mutationResult,
          trialsQuery(match.params.id, match.params.trialSetKey),
          TRIALS,
          TRIAL_MUTATION,
          returnFunc,
          'trialSetKey',
          this.updateAfterSubmit
        );
      },
    });

    this.setState({ changed: false, confirmStatusOpen: false });
    if (deleted) this.closeForm(deleted);
  };

  getValue = (key, defaultValue) => {
    const properties = this.state.trial.properties;
    const p = ((properties && properties.length) ? properties.findIndex(pr => pr.key === key) : -1);
    return (p !== -1 ? properties[p].val : defaultValue);
  }

  getInvalid = (key) => {
    const properties = this.state.trial.properties;
    const p = ((properties && properties.length) ? properties.findIndex(pr => pr.key === key) : -1);
    return (p !== -1 ? properties[p].invalid : false);
  }

  addEntityToTrial = (entity, selectedEntitiesType, properties) => {
    const { trial } = this.state;
    const entitiesField = trial.status === 'deploy' ? 'deployedEntities' : 'entities';
    //check hireracy of contains entity.
    this.state.trial[entitiesField] = this.state.trial[entitiesField] || [];
    this.state.trial[entitiesField].push({
      key: entity.key,
      entitiesTypeKey:selectedEntitiesType,
      properties,
    });
    this.setState({ changed: true });
  }

  removeEntity = (key) => {
    const { trial } = this.state;
    const entitiesField = trial.status === 'deploy' ? 'deployedEntities' : 'entities';
    this.state.trial[entitiesField].splice(this.state.trial[entitiesField].findIndex(e => e.key === key), 1);
    this.setState({ changed: true });
  }

  updateLocation = async (entity) => {
    const newEntity = {};
    const { match, client } = this.props;
    const { trial } = this.state;
    newEntity.key = trial.key;
    newEntity.experimentId = trial.experimentId;
    newEntity.trialSetKey = trial.trialSetKey;
    newEntity[!trial.status || trial.status === 'design' ? 'entities' : 'deployedEntities'] = [entity];

    await client.mutate({
      mutation: trialMutationUpdate(newEntity),
      update: (cache, mutationResult) => {
        updateCache(
          cache,
          mutationResult,
          trialsQuery(match.params.id, match.params.trialSetKey),
          TRIALS,
          TRIAL_MUTATION,
          true,
        );
      },
    });

    let isNew = true;
    let entitiesField = (!trial.status || trial.status === 'design') ? 'entities' : 'deployedEntities'
    trial[entitiesField].forEach((item, i) => {
      if (item.key === entity.key) {
        trial[entitiesField][i].properties.forEach((property, j) => {
          if (property.key === entity.properties[0].key) {
            trial[entitiesField][i].properties[j] = entity.properties[0];
          }
        });
        isNew = false;
      }
    });
    if (isNew) trial[entitiesField].push(entity);
    this.setState({ trial });
  };

  showFooter = (showFooter) => {
    this.setState({ showFooter });
  }

  setEditableStatus = (editableStatus) => {
    this.setState({ editableStatus });
  }

  handleMenuClick = (event) => {
    this.setState({
      anchorMenu: event.currentTarget,
    });
  };

  handleMenuClose = (anchor) => {
    this.setState({ [anchor]: null });
    this.setEditableStatus(false)
  };
  SetCloneEntitiesDialogOpen = (open) => {
    this.setState({ CloneEntitiesDialogOpen: open });
  }
  setCurrent = (property) => {
    if (property.type === 'time') this.onPropertyChange({ target: { value: moment().format('HH:mm') } }, property.key)
    if (property.type === 'date') this.onPropertyChange({ target: { value: moment().format('YYYY-MM-DD') } }, property.key)
    if (property.type === 'datetime-local') this.onPropertyChange({ target: { value: moment().format('YYYY-MM-DDTHH:mm') } }, property.key)
  }
  setConfirmOpen = (open) => {
    this.setState({ confirmOpen: open });
  }
  cancelChangeStatus = () => {
    this.setState({ confirmStatusOpen: false });
  }
  render() {
    const { classes, theme, match, client } = this.props;
    const {
      tabValue,
      trialSet,
      trial,
      editableStatus,
      anchorMenu,
      showFooter,
      CloneEntitiesDialogOpen,
      confirmOpen,
      confirmStatusOpen,
      newStatus,
    } = this.state;
    return (
      <>
        <div>
          <ContentHeader
            backButtonHandler={this.closeForm}
            topDescription={trialSet.name}
            withBackButton
            rightDescription={(
            trial.status && <StatusBadge
                onClick={this.handleMenuClick}
                onMouseEnter={() => this.setEditableStatus(true)}
                onMouseLeave={() => this.setEditableStatus(false)}
                className={classes.statusBadge}
                title={
                  <Grid
                    container
                    wrap="nowrap"
                    justify="space-between"
                    alignItems="center"
                    alignContent="space-between"
                  >
                    <span>{trial.status}</span>
                    {editableStatus && <PenIcon className={classes.penIcon} />}
                  </Grid>
                }
                color={theme.palette[COLORS_STATUSES[trial.status].color][COLORS_STATUSES[trial.status].level]}
              />
            )}
            middleDescription={
              <React.Fragment>
             <SimpleButton text={"Clone entities"} onClick={() => this.SetCloneEntitiesDialogOpen(!CloneEntitiesDialogOpen)}></SimpleButton>
              {CloneEntitiesDialogOpen&&<CloneEntitiesDialog
                  title={"Select trial to clone from"}
                  open={CloneEntitiesDialogOpen}
                  setOpen={this.SetCloneEntitiesDialogOpen}
                  onConfirm={(updateTrial) => this.submitTrial(updateTrial)}
                  currentTrial = {trial}
                  client ={client}
                  match ={match}
                >
               </CloneEntitiesDialog>}
             </React.Fragment>
             
            }
            title={trial.name || 'trial name goes here'}
            className={classes.header}
            rightComponent={(
              <StyledTabs
                tabs={[
                  { key: trial.key + '_G', label: 'General', id: 'trial-tab-0' },
                  { key: trial.key + '_D', label: 'Entities', id: 'trial-tab-1' },
                ]}
                value={tabValue}
                onChange={this.changeTab}
                ariaLabel="trial tabs"
              />
              )}
          />
          <Menu
            onMouseEnter={() => this.setEditableStatus(true)}
            onMouseLeave={() => this.setEditableStatus(false)}
            id="statuses-menu"
            classes={{ paper: classes.menu}}
            open={Boolean(anchorMenu)}
            onClose={() => this.handleMenuClose('anchorMenu')}
            anchorEl={anchorMenu}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            {['design', 'deploy', 'execution', 'complete'].map((i)=><MenuItem
              key={uuid()}
              classes={{ root: classes.menuItem }}
              onClick={e => this.onInputChange({ target: { value: i } }, 'status')}
            >
              <Grid
                container
                wrap="nowrap"
                alignItems="center"
              >
                <div className={(classnames(classes.rect, classes[i]))}></div>
                {i}
              </Grid>
            </MenuItem>)}
          </Menu>
        </div>
        <TabPanel value={tabValue} index={0}>
          <CustomInput
            id="trial-name"
            className={classes.property}
            onChange={e => this.onInputChange(e, 'name')}
            label="Name"
            bottomDescription="a short description"
            value={trial.name}
          />
          {trialSet.properties
            ? trialSet.properties.map(property => (
              <CustomInput
                id={`trial-property-${property.key}`}
                className={classes.property}
                key={property.key}
                onChange={e => this.onPropertyChange(e, property.key)}
                label={property.label}
                bottomDescription={property.description}
                value={this.getValue(property.key, property.defaultValue)}
                values={property.value}
                multiple={property.multipleValues}
                type={property.type}
                invalid={this.getInvalid(property.key)}
                endAdornment={(['date', 'time', 'datetime-local'].indexOf(property.type) !== -1) ?
                  <InputAdornment position="end">
                    <Button onClick={()=>this.setCurrent(property)}>
                      Fill current
                    </Button>
                  </InputAdornment> :
                  null
                }
              />
            ))
            : null}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TrialEntities
            trial={trial}
            addEntityToTrial={this.addEntityToTrial}
            removeEntity={this.removeEntity}
            updateLocation={this.updateLocation}
            onEntityPropertyChange={this.onEntityPropertyChange}
            showFooter={this.showFooter}
          />
        </TabPanel>
        {(tabValue === 0 || showFooter) && <Footer
          cancelButtonHandler={this.closeForm}
          saveButtonHandler={() => this.submitTrial(trial)}
          withDeleteButton={this.props.trial}
          deleteButtonHandler={() => this.submitTrial(trial, true)}
        />}
        <ConfirmDialog
          title={'Are you sure you want to leave the page?'}
          open={confirmOpen}
          setOpen={() => this.setConfirmOpen(false)}
          confirmText="Yes, I want to leave"
          onConfirm={() => {
            this.setState({ changed: false }, () => {
              this.closeForm()
            });
          }}
          cancelText="No, I want to stay"
          onCancel={() => this.setState({ confirmOpen: false })}
          cancelColor="#474747"
        >
          Information won't be saved
        </ConfirmDialog>
        <ConfirmDialog
          title={'You are going to change trial status'}
          open={confirmStatusOpen}
          confirmText="Save changes and change status"
          onConfirm={() => {
            this.setState({ changed: false }, () => {
              this.submitTrial(trial, false , newStatus);
            });
          }}
          cancelText="I don't want to change status"
          onCancel={this.cancelChangeStatus}
          cancelColor="#474747"
        >
          You have to save your changes before
        </ConfirmDialog>
      </>
    );
  }
}

export default compose(
  withRouter,
  withApollo,
  withStyles(styles, { withTheme: true }),
)(TrialForm);
