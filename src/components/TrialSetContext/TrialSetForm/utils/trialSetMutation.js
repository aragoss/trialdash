import gql from 'graphql-tag';
import { resultKeyNameFromField } from 'apollo-utilities';

export default (trialSet) => {
    console.log(trialSet.id);
    var id = trialSet.id ? trialSet.id : `${trialSet.experimentId}_${Date.now()}`;
    return gql`
  mutation {
    addUpdateTrialSet(
        uid: "${localStorage.getItem('uid')}",
        experimentId:"${trialSet.experimentId}"
        id: "${id}",
        name: "${trialSet.name}",
        type: "${trialSet.type}",
        properties: ${JSON.stringify(trialSet.properties).replace(/\"key\":/g, 'key:').replace(/\"val\":/g, 'val:')}
        ) {
            id
            name
            type
        }
    }
    `
}


//[{key: "heat degrees", val: "text"}]