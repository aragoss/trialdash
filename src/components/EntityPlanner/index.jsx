import { LinearProgress, withStyles } from '@material-ui/core';
import React from 'react';
import { withApollo } from 'react-apollo';
import { withRouter } from 'react-router-dom';
import { compose } from 'recompose';
import { EntityEditor } from './EntityEditor';
import { changeEntityLocationWithProp, findEntitiesChanged, getEntityLocationProp, getTypeLocationProp } from './EntityUtils';
import { styles } from './styles';
import entitiesTrialQuery from './utils/entitiesTrialQuery';

const EntityPlanner = ({ client, trial, trialEntities, match, updateLocation, entitiesTypes, experimentDataMaps }) => {
    const [showOnlyAssigned, setShowOnlyAssigned] = React.useState(false);
    const [entities, setEntities] = React.useState([]);
    const [working, setWorking] = React.useState(false);
    const entityWithTrialLocation = (devitem, locationPropOnDevType) => {
        const entityEntityOnTrial = trialEntities.find(ent => ent.key === devitem.key);
        if (entityEntityOnTrial) {
            const locationOnTrial = entityEntityOnTrial.properties.find(entprop => entprop.key === locationPropOnDevType);
            if (locationOnTrial) {
                try {
                    const locparsed = JSON.parse(locationOnTrial.val);
                    changeEntityLocationWithProp(devitem, locationPropOnDevType, locparsed.coordinates, locparsed.name);
                } catch (e) {
                }
            }
        }
        return devitem;
    };

    React.useEffect(() => {
        const experimentId = match.params.id;
        const trialKey = showOnlyAssigned ? trial.key : undefined;
        const entityTypesAsList = Object.values(entitiesTypes).filter(dtlst => dtlst.length).flat();
        const newdevs = entityTypesAsList.filter(dt => dt.name && dt.key && getTypeLocationProp(dt));
        newdevs.sort((a, b) => (a.name + ";" + a.key).localeCompare(b.name + ";" + b.key));
        setWorking(0);
        let done = 0;
        newdevs.forEach(devtype => {
            const locationProp = getTypeLocationProp(devtype);
            client.query({ query: entitiesTrialQuery(experimentId, devtype.key, undefined) })
                .then(dataDev => {
                    done += 1
                    setWorking(done / newdevs.length * 100);
                    devtype.items = dataDev.data.entities.map(devitem => entityWithTrialLocation(devitem, locationProp));
                    devtype.items.sort((a, b) => (a.name + ";" + a.key).localeCompare(b.name + ";" + b.key));
                    if (done === newdevs.length) {
                        setEntities(newdevs);
                    }
                    setTimeout(() => setWorking(false), 500);
                })
        })
    }, [showOnlyAssigned, trial, trialEntities]);

    const handleChangeEntities = (newEntities) => {
        setWorking(true);
        const changedEntities = findEntitiesChanged(entities, newEntities);
        const changedDetails = changedEntities.map(changed => {
            const { dev: newDev, type: newDevType } = changed;
            const locationProp = getEntityLocationProp(newDev, newDevType);
            const changeProps = [{ key: locationProp.key, val: JSON.stringify(locationProp.val) }];
            return { key: newDev.key, type: "entity", entitiesTypeKey: newDevType.key, properties: changeProps };
        });

        // Calling updateLocation one change at a time, otherwise it crushes.
        const uploc = () => {
            if (changedDetails.length) {
                setWorking((1 - changedDetails.length / changedEntities.length) * 100);
                const ch = changedDetails.pop();
                console.log('change', ch);
                updateLocation(ch)
                    .then(uploc);
            } else {
                setWorking(100);
                setTimeout(() => setWorking(false), 500);
            }
        }
        uploc();
        setEntities(newEntities);
    };

    return (
        <>
            {
                (entities.length === 0 || working) &&
                (working === !!working ?
                    <LinearProgress /> :
                    <LinearProgress variant="determinate" value={working} />)
            }
            {
                <EntityEditor
                    entities={entities}
                    setEntities={handleChangeEntities}
                    showOnlyAssigned={showOnlyAssigned}
                    setShowOnlyAssigned={setShowOnlyAssigned}
                    experimentDataMaps={experimentDataMaps}
                />
            }
        </>
    );
}

export default compose(
    withRouter,
    withApollo,
    withStyles(styles),
)(EntityPlanner);
