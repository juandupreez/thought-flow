import { ConceptGraph } from "../../main/concepts/ConceptGraph"
import { RelationType } from "../../main/concepts/RelationType"
import { ConceptMatcher } from "../../main/util/ConceptMatcher"
import { GlobalLogger, LogLevel } from "../../main/util/Logger"

global.console = require('console')

describe(ConceptMatcher, () => {

    beforeAll(() => {
        GlobalLogger.getInstance().setLogLevel(LogLevel.DEBUG)
    })

    describe('simple matches', () => {
        it('should not match anything is query is empty', () => {
            const data: ConceptGraph = new ConceptGraph()
            const matcher: ConceptMatcher = new ConceptMatcher(data)

            const query: ConceptGraph = new ConceptGraph()
            const matches: ConceptGraph[] = matcher.getMatches(query)

            expect(matches).toEqual([])
        })

        it('should match all concepts if asking for everything', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { label: 'sky' })
            data.addNode(2, { label: 'blue' })
            data.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            const matcher: ConceptMatcher = new ConceptMatcher(data)

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { label: 'unknown' })
            const matches: ConceptGraph[] = matcher.getMatches(query)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode(1, { label: 'sky', refId: '1' })
            expectedAnswer.addNode(2, { label: 'blue', refId: '2' })
            expectedAnswer.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            expect(matches).toEqual([expectedAnswer])
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })

        it('should match single concept to concept relationship', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { label: 'sky' })
            data.addNode(2, { label: 'blue' })
            data.addNode(3, { label: 'yellow' })
            data.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            data.addEdgeWithKey(2, 1, 3, { type: RelationType.GENERAL })
            const matcher: ConceptMatcher = new ConceptMatcher(data)

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { label: 'unknown' })
            query.addNode(2, { label: 'blue', refId: '2' })
            query.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            const matches: ConceptGraph[] = matcher.getMatches(query)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode(1, { label: 'sky', refId: '1' })
            expectedAnswer.addNode(2, { label: 'blue', refId: '2' })
            expectedAnswer.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })

        it('should match single concept to concept relationship even if there is a reflexive relationship directionally', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { label: 'sky' })
            data.addNode(2, { label: 'blue' })
            data.addNode(3, { label: 'yellow' })
            data.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            data.addEdgeWithKey(2, 2, 1, { type: RelationType.GENERAL })
            data.addEdgeWithKey(3, 1, 3, { type: RelationType.GENERAL })
            const matcher: ConceptMatcher = new ConceptMatcher(data)

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { label: 'unknown' })
            query.addNode(2, { label: 'blue', refId: '2' })
            query.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            const matches: ConceptGraph[] = matcher.getMatches(query)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode(1, { label: 'sky', refId: '1' })
            expectedAnswer.addNode(2, { label: 'blue', refId: '2' })
            expectedAnswer.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })

        it('should match single concept to concept relationship in other direction as well', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { label: 'sky' })
            data.addNode(2, { label: 'blue' })
            data.addNode(3, { label: 'yellow' })
            data.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            data.addEdgeWithKey(2, 2, 1, { type: RelationType.GENERAL })
            data.addEdgeWithKey(3, 1, 3, { type: RelationType.GENERAL })
            const matcher: ConceptMatcher = new ConceptMatcher(data)

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { label: 'unknown' })
            query.addNode(2, { label: 'blue', refId: '2' })
            query.addEdgeWithKey(1, 2, 1, { type: RelationType.GENERAL })
            const matches: ConceptGraph[] = matcher.getMatches(query)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode(2, { label: 'blue', refId: '2' })
            expectedAnswer.addNode(1, { label: 'sky', refId: '1' })
            expectedAnswer.addEdgeWithKey(2, 2, 1, { type: RelationType.GENERAL })
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })

        it('should match multiple concepts', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { label: 'sky' })
            data.addNode(2, { label: 'blue' })
            data.addNode(3, { label: 'yellow' })
            data.addNode(4, { label: 'car' })
            data.addNode(5, { label: 'sea' })
            data.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL }) // sky is blue
            data.addEdgeWithKey(2, 1, 3, { type: RelationType.GENERAL }) // sky is yellow
            data.addEdgeWithKey(3, 4, 3, { type: RelationType.GENERAL }) // car is yellow
            data.addEdgeWithKey(4, 5, 2, { type: RelationType.GENERAL }) // sea is blue
            const matcher: ConceptMatcher = new ConceptMatcher(data)

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { label: 'unknown' })
            query.addNode(2, { label: 'blue', refId: '2' })
            query.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            const matches: ConceptGraph[] = matcher.getMatches(query)

            expect(matches.length).toBe(2)

            const expectedAnswer1: ConceptGraph = new ConceptGraph()
            expectedAnswer1.addNode(1, { label: 'sky', refId: '1' })
            expectedAnswer1.addNode(2, { label: 'blue', refId: '2' })
            expectedAnswer1.addEdgeWithKey(1, 1, 2, { type: RelationType.GENERAL })
            expect(matches[0].toJSON()).toEqual(expectedAnswer1.toJSON())

            const expectedAnswer2: ConceptGraph = new ConceptGraph()
            expectedAnswer2.addNode(5, { label: 'sea', refId: '5' })
            expectedAnswer2.addNode(2, { label: 'blue', refId: '2' })
            expectedAnswer2.addEdgeWithKey(4, 5, 2, { type: RelationType.GENERAL })
            expect(matches[1].toJSON()).toEqual(expectedAnswer2.toJSON())
        })

    })

    describe('deep matches', () => {

        it('should match two levels deep concept', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode('sky', { label: 'sky' })
            data.addNode('blue', { label: 'blue' })
            data.addNode('colour', { label: 'colour' })
            data.addEdgeWithKey(1, 'sky', 'blue', { type: RelationType.ATTR })
            data.addEdgeWithKey(2, 'blue', 'colour', { type: RelationType.IS_A })
            const matcher: ConceptMatcher = new ConceptMatcher(data)

            const query: ConceptGraph = new ConceptGraph()
            query.addNode(1, { label: 'unknown' })
            query.addNode(2, { label: 'blue', refId: 'blue' })
            query.addNode(3, { label: 'colour', refId: 'colour' })
            query.addEdgeWithKey(1, 1, 2, { type: RelationType.ATTR }) // unknown is blue
            query.addEdgeWithKey(2, 2, 3, { type: RelationType.IS_A }) // blue is a colour
            const matches: ConceptGraph[] = matcher.getMatches(query)

            const expectedAnswer: ConceptGraph = new ConceptGraph()
            expectedAnswer.addNode('sky', { label: 'sky', refId: 'sky' })
            expectedAnswer.addNode('blue', { label: 'blue', refId: 'blue' })
            expectedAnswer.addNode('colour', { label: 'colour', refId: 'colour' })
            expectedAnswer.addEdgeWithKey(1, 'sky', 'blue', { type: RelationType.ATTR })
            expectedAnswer.addEdgeWithKey(2, 'blue', 'colour', { type: RelationType.IS_A })
            expect(matches[0].toJSON()).toEqual(expectedAnswer.toJSON())
        })
    })
})