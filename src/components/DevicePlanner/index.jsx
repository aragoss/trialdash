import { CircularProgress, withStyles } from '@material-ui/core';
import React from 'react';
import { withApollo } from 'react-apollo';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import deviceTypesQuery from '../DeviceContext/utils/deviceTypeQuery';
import { DeviceEditor } from './DeviceEditor/DeviceEditor';
import { styles } from './styles';
// import devicesQuery from '../TrialContext/TrialForm/utils/devicesTrialQuery';
import { getTypeLocationProp, getDeviceLocationProp, sortDevices, findDevicesChanged } from './DeviceEditor/DeviceUtils';

const DevicePlanner = ({ client, trial, match, updateLocation, getDevicesByTrial }) => {
    const [devices, setDevices] = React.useState([]);

    console.log('props', client, trial, match);

    React.useEffect(() => {
        const experimentId = match.params.id;
        const newdevs = [];
        client.query({ query: deviceTypesQuery(experimentId) })
            .then((dataType) => {
                const deviceTypes = dataType.data.deviceTypes.filter(devtype => devtype.name && getTypeLocationProp(devtype));
                console.log('deviceTypes', deviceTypes);
                deviceTypes.forEach(devtype => {
                    getDevicesByTrial(experimentId, devtype.key)
                        .then(dataDev => {
                            devtype.items = dataDev.data.devices;
                            console.log('devices', devtype.items);
                            newdevs.push(devtype);
                            if (newdevs.length === deviceTypes.length) {
                                sortDevices(newdevs);
                                console.log('setDevices: ', newdevs);
                                setDevices(newdevs);
                            }
                        })
                })
            })
    }, []);

    return (
        devices.length === 0 ?
            <CircularProgress style={{ marginLeft: '50%', marginTop: '40vh' }} /> :
            <DeviceEditor
                devices={devices}
                setDevices={(newDevices) => {
                    findDevicesChanged(devices, newDevices).forEach(changed => {
                        const { dev: newDev, type: newDevType } = changed;
                        console.log('change', newDev);
                        const locationProp = getDeviceLocationProp(newDev, newDevType);
                        const changeProps = [{ key: locationProp.key, val: JSON.stringify(locationProp.val) }];
                        updateLocation({ key: newDev.key, type: "device", typeKey: newDevType.key, properties: changeProps });
                    });
                    setDevices(newDevices);
                }}
            />
    );
}

export default compose(
    withRouter,
    withApollo,
    withStyles(styles),
)(DevicePlanner);
