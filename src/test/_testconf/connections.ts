import { Neo4JConnectionConfig } from "../../main/dao/neo4j/Neo4JConnectionConfig"

export const connections: { [key: string]: Neo4JConnectionConfig } = {
    'di-1.0': {
        uri: 'bolt://127.0.0.1:7687',
        username: 'neo4j',
        // password: 'admin',
        password: 'adminadmin',
        databaseName: 'concepts'
    }
}