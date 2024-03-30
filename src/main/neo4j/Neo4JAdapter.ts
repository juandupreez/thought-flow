import { Query } from "neo4j-driver-core/types/types"
import { glog } from "../util/Logger"
import { Neo4JConnectionConfig } from "./Neo4JConnectionConfig"
import neo4j, { Driver, EagerResult } from 'neo4j-driver'

export class Neo4JAdapter {
    private readonly conf: Neo4JConnectionConfig
    private driver: Driver | undefined

    constructor (conf: Neo4JConnectionConfig) {
        this.conf = conf
    }

    async connect () {
        // URI examples: 'neo4j://localhost', 'neo4j+s://xxx.databases.neo4j.io'
        const URI = this.conf.uri
        const USER = this.conf.username
        const PASSWORD = this.conf.password

        this.driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
        const serverInfo = await this.driver.getServerInfo()
        glog().info('Connection established')
        glog().info(serverInfo)
    }

    async close () {
        if (this.driver !== undefined) {
            glog().info('Disconnecting')
            await this.driver.close()
            glog().info('Disconnected')
        }
    }

    async execute (query: Query, params?: any): Promise<EagerResult> {
        glog().trace('Executing Query: \n' + query)
        glog().trace('With Params: ', params)
        if (this.driver === undefined) {
            throw new Error('No Neo4J connection found. Please connect before querying')
        }
        return await this.driver.executeQuery(
            query,
            params,
            { database: this.conf.databaseName }
        )
    }
}