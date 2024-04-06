import { ConceptGraph } from "../../../main/concepts/ConceptGraph"
import { ConceptMatchService } from "../../../main/service/ConceptMatchService"
import { GlobalLogger, LogLevel } from "../../../main/util/Logger"

global.console = require('console')

describe(ConceptMatchService, () => {

    beforeAll(() => {
        GlobalLogger.getInstance().setLogLevel(LogLevel.DEBUG)
    })

    describe('simple matches', () => {
        it('should not match anything is query is empty', () => {
            const data: ConceptGraph = new ConceptGraph()
            const matcher: ConceptMatchService = new ConceptMatchService()

            const query: ConceptGraph = new ConceptGraph()
            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            expect(matches).toEqual([])
        })

        it('should match all concepts if asking for everything', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { description: 'sky' })
            data.addNode(2, { description: 'blue' })
            data.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            const matcher: ConceptMatchService = new ConceptMatchService()

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { description: 'unknown', isUnknown: true })
            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode(1, { description: 'sky' })
            expectedAnswer.addNode(2, { description: 'blue' })
            expectedAnswer.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            expect(matches).toEqual([expectedAnswer])
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })

        it('should match single concept to concept relationship', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { description: 'sky' })
            data.addNode(2, { description: 'blue' })
            data.addNode(3, { description: 'yellow' })
            data.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            data.addEdgeWithKey(2, 1, 3, { type: 'some_relation' })
            const matcher: ConceptMatchService = new ConceptMatchService()

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { description: 'unknown', isUnknown: true })
            query.addNode(2, { description: 'blue' })
            query.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode(1, { description: 'sky' })
            expectedAnswer.addNode(2, { description: 'blue' })
            expectedAnswer.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })

        it('should match single concept to concept relationship even if there is a reflexive relationship directionally', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { description: 'sky' })
            data.addNode(2, { description: 'blue' })
            data.addNode(3, { description: 'yellow' })
            data.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            data.addEdgeWithKey(2, 2, 1, { type: 'some_relation' })
            data.addEdgeWithKey(3, 1, 3, { type: 'some_relation' })
            const matcher: ConceptMatchService = new ConceptMatchService()

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { description: 'unknown', isUnknown: true })
            query.addNode(2, { description: 'blue' })
            query.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode(1, { description: 'sky' })
            expectedAnswer.addNode(2, { description: 'blue' })
            expectedAnswer.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })

        it('should match single concept to concept relationship in other direction as well', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { description: 'sky' })
            data.addNode(2, { description: 'blue' })
            data.addNode(3, { description: 'yellow' })
            data.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            data.addEdgeWithKey(2, 2, 1, { type: 'some_relation' })
            data.addEdgeWithKey(3, 1, 3, { type: 'some_relation' })
            const matcher: ConceptMatchService = new ConceptMatchService()

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { description: 'unknown', isUnknown: true })
            query.addNode(2, { description: 'blue' })
            query.addEdgeWithKey(1, 2, 1, { type: 'some_relation' })
            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode(2, { description: 'blue' })
            expectedAnswer.addNode(1, { description: 'sky' })
            expectedAnswer.addEdgeWithKey(2, 2, 1, { type: 'some_relation' })
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })

        it('should match multiple concepts', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { description: 'sky' })
            data.addNode(2, { description: 'blue' })
            data.addNode(3, { description: 'yellow' })
            data.addNode(4, { description: 'car' })
            data.addNode(5, { description: 'sea' })
            data.addEdgeWithKey(1, 1, 2, { type: 'some_relation' }) // sky is blue
            data.addEdgeWithKey(2, 1, 3, { type: 'some_relation' }) // sky is yellow
            data.addEdgeWithKey(3, 4, 3, { type: 'some_relation' }) // car is yellow
            data.addEdgeWithKey(4, 5, 2, { type: 'some_relation' }) // sea is blue
            const matcher: ConceptMatchService = new ConceptMatchService()

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { description: 'unknown', isUnknown: true })
            query.addNode(2, { description: 'blue' })
            query.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            expect(matches.length).toBe(2)

            const expectedAnswer1: ConceptGraph = new ConceptGraph()
            expectedAnswer1.addNode(1, { description: 'sky' })
            expectedAnswer1.addNode(2, { description: 'blue' })
            expectedAnswer1.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            expect(matches[0].toJSON()).toEqual(expectedAnswer1.toJSON())

            const expectedAnswer2: ConceptGraph = new ConceptGraph()
            expectedAnswer2.addNode(5, { description: 'sea' })
            expectedAnswer2.addNode(2, { description: 'blue' })
            expectedAnswer2.addEdgeWithKey(4, 5, 2, { type: 'some_relation' })
            expect(matches[1].toJSON()).toEqual(expectedAnswer2.toJSON())
        })

    })

    describe('deep matches', () => {

        it('should match two levels deep concept', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode('sky', { description: 'sky' })
            data.addNode('blue', { description: 'blue' })
            data.addNode('colour', { description: 'colour' })
            data.addEdgeWithKey(1, 'sky', 'blue', { type: 'some_relation' })
            data.addEdgeWithKey(2, 'blue', 'colour', { type: 'some_relation' })
            const matcher: ConceptMatchService = new ConceptMatchService()

            const query: ConceptGraph = new ConceptGraph()
            query.addNode('unknown_001', { description: 'unknown', isUnknown: true })
            query.addNode('blue', { description: 'blue' })
            query.addNode('colour', { description: 'colour' })
            query.addEdgeWithKey(1, 'unknown_001', 'blue', { type: 'some_relation' }) // unknown is blue
            query.addEdgeWithKey(2, 'blue', 'colour', { type: 'some_relation' }) // blue is a colour
            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode('sky', { description: 'sky' })
            expectedAnswer.addNode('blue', { description: 'blue' })
            expectedAnswer.addNode('colour', { description: 'colour' })
            expectedAnswer.addEdgeWithKey(1, 'sky', 'blue', { type: 'some_relation' })
            expectedAnswer.addEdgeWithKey(2, 'blue', 'colour', { type: 'some_relation' })
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })
    })
})