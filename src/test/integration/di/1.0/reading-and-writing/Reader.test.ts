import { ConceptGraph } from "../../../../../main/core/ConceptGraph"
import { Neo4JConceptGraphDao } from "../../../../../main/dao/neo4j/Neo4JConceptGraphDao"
import { Neo4JAdapter } from "../../../../../main/dao/neo4j/Neo4JAdapter"
import { Reader } from "../../../../../main/service/Reader"
import { connections } from "../../../../_testconf/connections"

global.console = require('console')

describe(Reader, () => {

    const dbConnectKey: string = 'di-1.0'
    const neo4JAdapter: Neo4JAdapter = new Neo4JAdapter(connections[dbConnectKey])
    let conceptGraphDao: Neo4JConceptGraphDao
    let reader: Reader

    beforeAll(async () => {
        await neo4JAdapter.connect()
        conceptGraphDao = new Neo4JConceptGraphDao(neo4JAdapter)
        reader = new Reader(conceptGraphDao)
    })

    afterAll(async () => {
        await neo4JAdapter.close()
    })

    it('should read single known word', async () => {
        const wordConcept: ConceptGraph = await reader.readSingleWord('sky')

        // console.log(wordConcept.toString())
        console.log(JSON.stringify(wordConcept.toJSON(), null, 2))
    })
})