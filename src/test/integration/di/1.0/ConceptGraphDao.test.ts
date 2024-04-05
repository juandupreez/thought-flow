import { ConceptGraphModel } from "../../../../main/model/ConceptGraphModel"
import { ConceptGraphDao } from "../../../../main/dao/ConceptGraphDao"
import { Neo4JAdapter } from "../../../../main/neo4j/Neo4JAdapter"
import { LogLevel, glog } from "../../../../main/util/Logger"
import { connections } from "../../../_testconf/connections"

global.console = require('console')
glog().setLogLevel(LogLevel.DEBUG)

describe(ConceptGraphDao, () => {
    const dbConnectKey: string = 'di-1.0'
    const neo4JAdapter: Neo4JAdapter = new Neo4JAdapter(connections[dbConnectKey])
    let conceptGraphModelDao: ConceptGraphDao

    beforeAll(async () => {
        await neo4JAdapter.connect()
        conceptGraphModelDao = new ConceptGraphDao(neo4JAdapter)
    })

    afterAll(async () => {
        await neo4JAdapter.close()
    })

    describe('C - create', () => {
        it('should create a concept graph in DB from a concept graph model', async () => {

            const cgModel: ConceptGraphModel = {
                'sky': {
                    '-has attribute->': 'blue'
                },
                'car': {
                    '-has attribute->': {
                        'yellow': {
                            '-is subtype of->': 'colour'
                        }
                    }
                }
            }
            await conceptGraphModelDao.createConceptGraphModel(cgModel)



        })

        fit('should create a concept graph in DB from files', async () => {
            await conceptGraphModelDao.deleteAllData()
            const cgModels: ConceptGraphModel[] = [
                // require('../../../../../concept-graphs/di/1.0/sky_is_blue_car_is_yellow.json'),

                // Fundamentals
                require('../../../../../concept-graphs/di/1.0/_fundamentals/1_fundamental_concepts.json'),

                // Can Butterflies taste with their feet
                // require('../../../../../concept-graphs/di/1.0/can butterfiels taste with their feet/basics.json'),
                // require('../../../../../concept-graphs/di/1.0/can butterfiels taste with their feet/page1.json'),
                // require('../../../../../concept-graphs/di/1.0/can butterfiels taste with their feet/page2.json'),
                // require('../../../../../concept-graphs/di/1.0/can butterfiels taste with their feet/page3.json'),

                // Words
                require('../../../../../concept-graphs/di/1.0/words/1_letters.json'),
                require('../../../../../concept-graphs/di/1.0/words/2_basic_nouns.json'),
            ]
            for (const cgModel of cgModels) {
                await conceptGraphModelDao.createConceptGraphModel(cgModel)
            }



        }, 5 * 60 * 1000)
    })

})