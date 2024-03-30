import { Neo4JConnectionConfig } from "../../main/neo4j/Neo4JConnectionConfig"

export const connections: { [key: string]: Neo4JConnectionConfig } = {
    'di-1.0': {
        uri: 'bolt://kubernetes.docker.internal:11003',
        username: 'neo4j',
        password: 'admin',
        databaseName: 'concepts'
    }
}