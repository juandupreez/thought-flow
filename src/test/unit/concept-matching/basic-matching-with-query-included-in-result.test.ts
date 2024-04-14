import { ConceptGraph } from "../../../main/core/ConceptGraph"
import { ConceptGraphModel } from "../../../main/model/ConceptGraphModel"
import { ConceptMatchService } from "../../../main/service/ConceptMatchService"
import { GlobalLogger, LogLevel, glog } from "../../../main/util/Logger"

global.console = require('console')

describe(ConceptMatchService + ' - return query with result', () => {
    const matcher: ConceptMatchService = new ConceptMatchService()

    beforeAll(() => {
        GlobalLogger.getInstance().setLogLevel(LogLevel.TRACE)
    })

    it('should match an exact match to itself', () => {
        const data: ConceptGraph = ConceptGraph.fromModel({
            'sky': {}
        })
        const query: ConceptGraph = ConceptGraph.fromModel({
            'sky': {}
        })

        const matches: ConceptGraphModel[] = matcher.getMatches(query, data, { shouldIncludeQueryInResult: true })
            .map((singleMatch) => { return singleMatch.toModel() })

        expect(matches.length).toBe(1)
        expect(matches[0]).toEqual({
            'sky': {
                '-mtaches->': 'sky'
            }
        })
    })

})