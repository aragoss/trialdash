import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { styles } from './styles';
import Devices from './Devices';
import {
  DEVICE_TYPE_FORM_CONTENT_TYPE,
  DEVICE_TYPES_CONTENT_TYPE,
  DEVICES_CONTENT_TYPE,
} from '../../constants/base';
import DeviceTypes from './DeviceTypes';
import DeviceTypeForm from './DeviceTypeForm';

class DeviceMainView extends React.PureComponent {
    state = {
      currentContentType: DEVICE_TYPES_CONTENT_TYPE,
    };

    switchCurrentContentType = (contentType) => {
      this.setState({ currentContentType: contentType });
    };

    renderContent = (contentType) => {
      const { experimentId, entityType } = this.props;

      switch (contentType) {
        case DEVICE_TYPES_CONTENT_TYPE:
          return (
            <DeviceTypes
              experimentId={experimentId}
              entityType={entityType}
              changeContentType={this.switchCurrentContentType}
            />
          );
        case DEVICES_CONTENT_TYPE:
          return (
            <Devices
              experimentId={experimentId}
              entityType={entityType}
              backToDeviceTypes={this.switchCurrentContentType}
            />
          );
        case DEVICE_TYPE_FORM_CONTENT_TYPE:
          return (
            <DeviceTypeForm
              changeContentType={this.switchCurrentContentType}
            />
          );
        default:
          return (
            <DeviceTypes
              experimentId={experimentId}
              entityType={entityType}
              changeContentType={this.switchCurrentContentType}
            />
          );
      }
    };

    render() {
      return <>{this.renderContent(this.state.currentContentType)}</>;
    }
}

export default withStyles(styles)(DeviceMainView);
