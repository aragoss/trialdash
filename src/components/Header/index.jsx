import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core';
import classnames from 'classnames';
import Divider from '@material-ui/core/Divider';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Avatar from '@material-ui/core/Avatar';
import MenuIcon from '@material-ui/icons/Menu';
import Box from '@material-ui/core/Box';
import uuid from 'uuid/v4';
import { compose } from 'recompose';
import { styles } from './styles';
import StyledTabs from '../StyledTabs';

class Header extends React.Component {
  state = {
    anchorExperimentsMenu: null,
    anchorProfileMenu: null,
    // isExperimentHovering: false,
  };

  handleProfileMenuClick = (event) => {
    this.setState({
      anchorProfileMenu: event.currentTarget,
    });
  };

  handleExperimentsMenuClick = (event) => {
    this.setState({
      anchorExperimentsMenu: event.currentTarget,
      // isExperimentHovering: false,
    });
  };

  handleMenuClose = (anchor) => {
    this.setState({ [anchor]: null });
  };

  handleTabChange = (event, newValue) => {
    this.props.handleTabChange(newValue);
  };

  handleLogoClick = (event) => {
    this.handleTabChange(event, 3); // 3 is the Experiments
    this.props.selectActiveExperiment({}); // reset selected experiment
  };

  selectExperiment = (experiment) => {
    const { selectActiveExperiment } = this.props;
    selectActiveExperiment(experiment);
    this.handleMenuClose('anchorExperimentsMenu');
  };

  /*  handleExperimentMouseEnter = () => {
    this.setState({ isExperimentHovering: true });
  }; */

  /*  handleExperimentMouseLeave = () => {
    this.setState({ isExperimentHovering: false });
  }; */

  /*  renderCurrentExperimentName = (currentExperiment, isExperimentHovering) => {
    if (
      currentExperiment.project.name
      && currentExperiment.project.id
      && isExperimentHovering
    ) {
      return `${currentExperiment.project.name} (ID: ${currentExperiment.project.id})`;
    }

    if (currentExperiment.project.name && !isExperimentHovering) {
      return `${currentExperiment.project.name}`;
    }

    return 'Select an Experiment';
  }; */

    logout = () => {
      localStorage.clear();
      this.props.history.push('/login');
    };

    render() {
      const {
        classes,
        // currentExperiment,
        experiments,
        tabValue,
        withExperiments,
        user,
      } = this.props;
      const { anchorExperimentsMenu, anchorProfileMenu/* , isExperimentHovering */ } = this.state;

      return (
        <Grid
          container
          className={
          withExperiments
            ? classes.root
            : classnames(classes.root, classes.rootWithoutExperiments)
        }
        >
          <Grid item container xs={4} alignItems="flex-start">
            <Box
              display="flex"
              alignItems="center"
              className={classes.logoWrapper}
            >
              <MenuIcon className={classes.menuIcon} />
              <Link
                to="/"
                onClick={this.handleLogoClick}
                className={classes.logo}
              >
              Argos
              </Link>
            </Box>
            <Divider
              orientation="vertical"
              className={classnames(classes.divider, classes.leftDivider)}
            />
            {withExperiments ? (
              <>
                <Button
                  aria-controls="experiments-menu"
                  aria-haspopup="true"
                  onClick={this.handleExperimentsMenuClick}
                  disableRipple
                  className={classnames(
                    classes.expandButton,
                    classes.expandExperimentButton,
                  )}
                  // onMouseEnter={this.handleExperimentMouseEnter}
                  // onMouseLeave={this.handleExperimentMouseLeave}
                >
                  {/* {this.renderCurrentExperimentName( */}
                  {/*  currentExperiment, */}
                  {/*  isExperimentHovering, */}
                  {/* )} */}
                  <ExpandMoreIcon />
                </Button>
                <Menu
                  id="experiments-menu"
                  open={Boolean(anchorExperimentsMenu)}
                  onClose={() => this.handleMenuClose('anchorExperimentsMenu')}
                  anchorEl={anchorExperimentsMenu}
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
                  {experiments.map(experiment => (
                    <MenuItem
                      key={experiment.project.id}
                      onClick={() => this.selectExperiment(experiment)}
                    >
                      {experiment.project.name}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : null}
          </Grid>
          <Grid item container xs={8} justify="flex-end">
            {withExperiments ? (
              <>
                <StyledTabs
                  tabs={[
                    { key: uuid(),
                      label: 'Trials',
                      id: 'header-tab-0' },
                    { key: uuid(),
                      label: 'Assets',
                      id: 'header-tab-1' },
                    { key: uuid(),
                      label: 'Devices',
                      id: 'header-tab-2' },
                  ]}
                  value={tabValue}
                  onChange={this.handleTabChange}
                  ariaLabel="header tabs"
                />
                <Divider
                  orientation="vertical"
                  className={classnames(classes.divider, classes.rightDivider)}
                />
              </>
            ) : null}
            <div className={classes.profileWrapper}>
              <Avatar src={user.avatar} alt="user avatar" className={classes.avatar} />
              <Button
                aria-controls="user-menu"
                aria-haspopup="true"
                onClick={this.handleProfileMenuClick}
                disableRipple
                className={classnames(
                  classes.expandButton,
                  classes.expandProfileButton,
                )}
              >
                {user.name}
                <ExpandMoreIcon />
              </Button>
              <Menu
                id="profile-menu"
                open={Boolean(anchorProfileMenu)}
                onClose={() => this.handleMenuClose('anchorProfileMenu')}
                anchorEl={anchorProfileMenu}
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
                <MenuItem
                  onClick={() => this.logout()}
                >
                  Log out
                </MenuItem>
              </Menu>
            </div>
          </Grid>
        </Grid>
      );
    }
}

export default compose(withRouter, withStyles(styles))(Header);
