import gql from 'graphql-tag';

export default (device) => {   
    return gql`
  mutation {
    addUpdateDevice(
        uid: "${localStorage.getItem('uid')}",
        experimentId:"${device.experimentId}"
        id: "${device.id}",
        name: "${device.name}",
        type: "${device.type}",
        number: "${device.number}",
        properties: ${JSON.stringify(device.properties).replace(/\"key\":/g, 'key:').replace(/\"val\":/g, 'val:')}
        ) {
            id
            name
            type
            number
            properties{
                key
                val
             }
        }
    }
    `
}
