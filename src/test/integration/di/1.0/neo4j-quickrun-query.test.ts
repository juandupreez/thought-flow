import { Neo4JAdapter } from "../../../../main/neo4j/Neo4JAdapter"
import { glog } from "../../../../main/util/Logger"
import { connections } from "../../../_testconf/connections"

global.console = require('console')

describe('Di 1.0 - quickrun', () => {
    const dbConnectKey: string = 'di-1.0'
    const neo4JAdapter: Neo4JAdapter = new Neo4JAdapter(connections[dbConnectKey])

    beforeAll(async () => {
        await neo4JAdapter.connect()
    })

    afterAll(async () => {
        await neo4JAdapter.close()
    })

    it('quickrun', async () => {
        const result = await neo4JAdapter.execute(`
            MATCH (n:Person) RETURN n LIMIT 25
        `)
        glog().info('result', JSON.stringify(result.records, null, 2))
    })

})