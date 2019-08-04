import gql from 'graphql-tag'

const trials = experimentId => {
  return gql`
  {
      trials(experimentId:"${experimentId}"){
        id
        name
        notes
        begin
        end
        trialSet {
          id
          type
          name
          properties {
              key
              val
           }
        }
        properties {
          key
          val
       }
        devices {
          entity {
            id
            name
            type
          }
          properties {
              key
              val
          }
          type
      }
      assets {
        entity {
          id
          name
          type
        }
        properties {
            key
            val
        }
        type
      }
    }
  }`
}

export default trials;