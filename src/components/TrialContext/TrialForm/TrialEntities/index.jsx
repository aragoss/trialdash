/* eslint-disable prefer-destructuring */
import React from 'react';
import { withStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import EditLocationIcon from '@material-ui/icons/EditLocation';
import classnames from 'classnames';
import { compose } from 'recompose';
import { withRouter } from 'react-router-dom';
import { withApollo } from 'react-apollo';
import { groupBy } from 'lodash';
import entitiesTypesQuery from '../../../EntityContext/utils/entityTypeQuery';
import entitiesQuery from '../../../EntityContext/Entities/utils/entityQuery';
import { styles } from '../styles';
import AddEntityPanel from '../../../AddEntityPanel';
import EntitiesGrid from './entitiesGrid';
import SimpleButton from '../../../SimpleButton';
import { GridIcon, ListIcon, TreeIcon } from '../../../../constants/icons';
import EntityPlanner from '../../../EntityPlanner';
import experimentsQuery from '../../../ExperimentContext/utils/experimentsQuery';

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

class TrialEntities extends React.Component {
  state = {
    selectedViewIndex: 3,
    trialEntities: {},
    entities: {},
    entitiesTypes: {},
    isLoading: true,
    parentEntity: {}
  };

  componentWillMount() {
    const { client, match } = this.props;
    client.query({ query: entitiesTypesQuery(match.params.id) }).then((data) => {
      const entitiesTypes = groupBy(data.data.entitiesTypes, 'key');
      let entities = [];
      client.query({ query: entitiesQuery(match.params.id) }).then((entitiesData) => {
        entities =  entitiesData.data.entities;
        this.setState({
          entities: groupBy(entities, 'key'),
        });
      });
      this.setState({
        entitiesTypes,
      });
    });
  }

  componentDidMount() {
    const { client, showFooter } = this.props;
    this.orderEntities();
    client
      .query({ query: experimentsQuery })
      .then(() => this.setState({ isLoading: false }));
    showFooter(false);
  }

  componentDidUpdate(prevProps) {
    const { trial } = this.props;
    const entitiesField = trial.status === 'deploy' ? 'deployedEntities' : 'entities';
    if (prevProps.trial[entitiesField].length !== this.state.length || prevProps.trial.status !== trial.status || this.state.entitiesField !== entitiesField) {
      this.orderEntities();
    }
  }

  orderEntities = () => {
    const { trial } = this.props;
    const entitiesField = trial.status === 'deploy' ? 'deployedEntities' : 'entities';
    this.setState({ update: true, length: trial[entitiesField].length, trialEntities: groupBy(trial[entitiesField], 'entitiesTypeKey'), entitiesField });
  }

  changeView = (selectedViewIndex) => {
    this.setState({ selectedViewIndex });
    this.props.showFooter(selectedViewIndex !== 3);
  };

  openAddEntitiesPanel = (parentEntity) => {
    this.setState({ isEntitiesPanelOpen: true,parentEntity });
  }

  closeAddEntitiesPanel = () => {
    this.setState({ isEntitiesPanelOpen: false });
  }

  setUpdated = () => {
    this.setState({ update: false });
  }

  render() {
    const {
      classes,
      theme,
      match,
      trial,
      addEntityToTrial,
      removeEntity,
      onEntityPropertyChange,
      updateLocation,
      client,
    } = this.props;
    const {
      selectedViewIndex,
      trialEntities,
      entities,
      entitiesTypes,
      update,
      isLoading,
      parentEntity
    } = this.state;
    const experiments = !isLoading
      ? client.readQuery({ query: experimentsQuery }).experimentsWithData
      : [];
    const currentExperiment = experiments.find(experiment => experiment.project.id === trial.experimentId);
    return (
      <>
        <Grid
          container
          justify="space-between"
          className={classes.entitiesPanelHeader}
        >
          <Grid item>
            {/* <IconButton
                disableRipple
                className={
                  selectedViewIndex === 0
                    ? classnames(classes.viewButton, classes.viewButtonSelected)
                    : classes.viewButton
                }
                onClick={() => this.changeView(0)}
              >
                <TreeIcon />
              </IconButton> */}
            {/* <IconButton
                disableRipple
                className={
                  selectedViewIndex === 1
                    ? classnames(classes.viewButton, classes.viewButtonSelected)
                    : classes.viewButton
                }
                onClick={() => this.changeView(1)}
              >
                <ListIcon />
              </IconButton> */}
            <IconButton
              disableRipple
              className={
                selectedViewIndex === 2
                  ? classnames(classes.viewButton, classes.viewButtonSelected)
                  : classes.viewButton
              }
              onClick={() => this.changeView(2)}
            >
              <GridIcon />
            </IconButton>
            <IconButton
              disableRipple
              className={
                selectedViewIndex === 3
                  ? classnames(classes.viewButton, classes.viewButtonSelected)
                  : classes.viewButton
              }
              onClick={() => this.changeView(3)}
            >
              <EditLocationIcon className={classes.locationIcon} />
            </IconButton>
          </Grid>
          {selectedViewIndex !== 3 && <Grid item>
            <SimpleButton
              text="Add"
              colorVariant="primary"
              onClick={this.openAddEntitiesPanel}
            />
          </Grid>}
        </Grid>
        {selectedViewIndex !== 3 && <AddEntityPanel
          isPanelOpen={this.state.isEntitiesPanelOpen}
          onClose={this.closeAddEntitiesPanel}
          match={match}
          theme={theme}
          addEntityToTrial={addEntityToTrial}
          parentEntity ={parentEntity}
          entities={trial[trial.status === 'deploy' ? 'deployedEntities' : 'entities'].map(e => e.key)}
        />}
        <TabPanel value={selectedViewIndex} index={2}>
          {selectedViewIndex === 2 &&
            <EntitiesGrid
              {...this.props}
              trial={trial}
              removeEntity={removeEntity}
              onEntityPropertyChange={onEntityPropertyChange}
              trialEntities={trialEntities}
              entities={entities}
              entitiesTypes={entitiesTypes}
              update={update}
              setUpdated={this.setUpdated}
              openAddEntitiesPanel ={this.openAddEntitiesPanel}
            />
          }
        </TabPanel>
        <TabPanel value={selectedViewIndex} index={3}>
          {
            (selectedViewIndex === 3 && Object.keys(entitiesTypes).length) ?
              <EntityPlanner
                updateLocation={updateLocation}
                trial={trial}
                trialEntities={trial[trial.status === 'deploy' ? 'deployedEntities' : 'entities']}
                entitiesTypes={entitiesTypes}
                experimentDataMaps={currentExperiment ? currentExperiment.maps : []}
              />
              : null
          }
        </TabPanel>
      </>
    );
  }
}

export default compose(
  withRouter,
  withApollo,
  withStyles(styles, { withTheme: true }),
)(TrialEntities);
