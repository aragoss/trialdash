import gql from 'graphql-tag';

const assets = (experimentId, entityType) => {
  return gql`
 	{
     assets(experimentId:"${experimentId}", entityType:"${entityType}"){
       id
       name
       notes
       type
       number
       properties{
           key
           val
           type
        }
     }
  }`
}

export default assets;