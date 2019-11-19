import React from 'react';
import { withStyles } from '@material-ui/core';
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import Grid from '@material-ui/core/Grid';
import MomentUtils from '@date-io/moment';
import InputAdornment from '@material-ui/core/InputAdornment';
import moment from 'moment';
import { Map, Marker, TileLayer } from 'react-leaflet';
import { compose } from 'recompose';
import { withApollo } from 'react-apollo';
import { withRouter } from 'react-router-dom';
import experimentMutation from './utils/experimentMutation';
import ContentHeader from '../../ContentHeader';
import Footer from '../../Footer';
import { styles } from './styles';
import CustomInput from '../../CustomInput';
import CustomTooltip from '../../CustomTooltip';
import { DateIcon } from '../../../constants/icons';
import config from '../../../config';
import experimentsQuery from '../utils/experimentsQuery';
import { EXPERIMENT_MUTATION, EXPERIMENTS_WITH_DATA } from '../../../constants/base';
import { updateCache } from '../../../apolloGraphql';

class ExperimentForm extends React.Component {
  state = {
    experiment: {},
    isStartDatePickerOpen: false,
    isEndDatePickerOpen: false,
    isLoading: true,
  };

  startDatePickerRef = React.createRef();

  endDatePickerRef = React.createRef();

  async componentDidMount() {
    const { editMode } = this.props;
    let experiment = {
      name: '',
      description: '',
      begin: new Date().toISOString(),
      end: new Date().toISOString(),
      location: '0,0',
      numberOfTrials: 0,
    };

    if (editMode) {
      const { client, match } = this.props;
      let experiments = [];

      try {
        experiments = client.readQuery({ query: experimentsQuery }).experimentsWithData;
      } catch {
        const { data: { experimentsWithData } } = await client.query({ query: experimentsQuery });

        experiments = experimentsWithData;
      }

      const fetchedExperiment = experiments.find(
        experimentWithData => experimentWithData.project.id === match.params.id,
      );

      experiment = {
        name: fetchedExperiment.project.name,
        description: fetchedExperiment.project.description,
        begin: fetchedExperiment.begin,
        end: fetchedExperiment.end,
        location: fetchedExperiment.location,
        numberOfTrials: fetchedExperiment.numberOfTrials,
      };
    }

    this.setState({
      isLoading: false,
      experiment,
    });
  }


  submitExperiment = async (experiment) => {
    const { client, history } = this.props;

    await client.mutate({
      mutation: experimentMutation(experiment),
      update: (cache, mutationResult) => {
        updateCache(
          cache,
          mutationResult,
          experimentsQuery,
          EXPERIMENTS_WITH_DATA,
          EXPERIMENT_MUTATION,
        );
      },
    });

    history.push('/experiments');
  };

  changeExperiment = (event, field) => {
    let value;

    switch (field) {
      case 'begin':
        value = moment.utc(event).format();

        // if the end date is earlier than the start date set end date is equal to the start date
        if (event.isAfter(this.state.experiment.end, 'day')) {
          this.setState(state => ({
            experiment: {
              ...state.experiment,
              end: value,
            },
          }));
        }

        break;
      case 'end':
        value = moment.utc(event).format();
        break;
      case 'location':
        if (event.target.value) {
          // regexp to check coordinates string
          const areCoordinatesValid = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(
            event.target.value,
          );

          if (areCoordinatesValid) ({ value } = event.target);
          else return;
        } else value = `${event.latlng.lat},${event.latlng.lng}`;
        break;
      default:
        ({ value } = event.target);
    }

    this.setState(state => ({
      experiment: {
        ...state.experiment,
        [field]: value,
      },
    }));
  };

  setIsDatePickerOpen = (field, isOpen) => {
    this.setState({ [field]: isOpen });
  };

  render() {
    const { history, classes, editMode = false } = this.props;
    const {
      experiment,
      isStartDatePickerOpen,
      isEndDatePickerOpen,
      isLoading,
    } = this.state;

    return isLoading ? <p>Loading...</p> : (
      <MuiPickersUtilsProvider utils={MomentUtils}>
        <ContentHeader
          className={classes.header}
          title={editMode ? 'Edit experiment' : 'Add experiment'}
        />
        <form>
          <Grid container>
            <Grid item xs={4}>
              <CustomInput
                onChange={e => this.changeExperiment(e, 'name')}
                id="experiment-name"
                label="Name"
                bottomDescription="a short description about the name"
                className={classes.input}
                value={experiment.name}
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={7}>
              <CustomInput
                onChange={e => this.changeExperiment(e, 'description')}
                id="experiment-description"
                label="Description"
                bottomDescription="a short description about the description"
                className={classes.input}
                value={experiment.description}
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={5}>
              <Grid container spacing={2} className={classes.dates}>
                <Grid item xs={5} ref={this.startDatePickerRef}>
                  <DatePicker
                    onClose={() => this.setIsDatePickerOpen('isStartDatePickerOpen', false)}
                    disableToolbar
                    variant="inline"
                    format="D/M/YYYY"
                    id="start-date-picker"
                    label="Start date"
                    value={experiment.begin}
                    onChange={date => this.changeExperiment(date, 'begin')}
                    open={isStartDatePickerOpen}
                    PopoverProps={{
                      anchorEl: this.startDatePickerRef.current,
                    }}
                    TextFieldComponent={props => (
                      <CustomInput
                        {...props}
                        inputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <CustomTooltip
                                className={classes.dateTooltip}
                                title="Select date"
                                ariaLabel="select date"
                                onClick={() => this.setIsDatePickerOpen(
                                  'isStartDatePickerOpen',
                                  true,
                                )}
                              >
                                <DateIcon />
                              </CustomTooltip>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={5} ref={this.endDatePickerRef}>
                  <DatePicker
                    onClose={() => this.setIsDatePickerOpen('isEndDatePickerOpen', false)}
                    minDate={experiment.begin} // the end date can't be earlier than the start date
                    disableToolbar
                    variant="inline"
                    format="D/M/YYYY"
                    id="end-date-picker"
                    label="End date"
                    value={experiment.end}
                    onChange={date => this.changeExperiment(date, 'end')}
                    open={isEndDatePickerOpen}
                    PopoverProps={{
                      anchorEl: this.endDatePickerRef.current,
                    }}
                    TextFieldComponent={props => (
                      <CustomInput
                        {...props}
                        inputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <CustomTooltip
                                className={classes.dateTooltip}
                                title="Select date"
                                ariaLabel="select date"
                                onClick={() => this.setIsDatePickerOpen(
                                  'isEndDatePickerOpen',
                                  true,
                                )
                                }
                              >
                                <DateIcon />
                              </CustomTooltip>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={4}>
              <CustomInput
                value={experiment.location}
                className={classes.locationInput}
                onChange={e => this.changeExperiment(e, 'location')}
                id="location-input"
                label="Location"
              />
              <Map
                center={experiment.location.split(',')}
                zoom={13}
                className={classes.map}
                onClick={e => this.changeExperiment(e, 'location')}
                attributionControl={false}
              >
                <TileLayer
                  url={`https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=${config.mapboxAccessToken}`}
                  id="mapbox.streets"
                />
                <Marker position={experiment.location.split(',')} />
              </Map>
            </Grid>
          </Grid>
        </form>
        <Footer
          cancelButtonHandler={() => history.push('/experiments')}
          saveButtonHandler={() => this.submitExperiment(experiment)}
        />
      </MuiPickersUtilsProvider>
    );
  }
}

export default compose(
  withApollo,
  withRouter,
  withStyles(styles),
)(ExperimentForm);
