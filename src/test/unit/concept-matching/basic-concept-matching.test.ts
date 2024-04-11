import { ConceptGraph } from "../../../main/core/ConceptGraph"
import { ConceptGraphModel } from "../../../main/model/ConceptGraphModel"
import { ConceptMatchService } from "../../../main/service/ConceptMatchService"
import { GlobalLogger, LogLevel } from "../../../main/util/Logger"

global.console = require('console')

describe(ConceptMatchService, () => {
    const matcher: ConceptMatchService = new ConceptMatchService()

    beforeAll(() => {
        GlobalLogger.getInstance().setLogLevel(LogLevel.ALL)
    })

    describe('The Empty Query', () => {
        it('should not match anything if query and data are empty', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({})
            const query: ConceptGraph = ConceptGraph.fromModel({})

            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            expect(matches).toEqual([])
        })

        it('should not match anything if query is empty but there is data', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': { '-is->': 'blue' }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({})

            const matches: ConceptGraph[] = matcher.getMatches(query, data)

            expect(matches).toEqual([])
        })
    })

    describe('Query Without Relations', () => {

        it('should match single concept if query concept is exact match', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {}
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                'sky': {}
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': {}
            })
        })

        it('should match all concept if query has no unknowns exact match', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                'blue': {},
                'yellow': {}
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                'blue': {},
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': {},
                'blue': {},
            })
        })

        it('should match single concept if query concept is unknown', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {}
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': {}
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': {}
            })
        })

        it('should match two unrelated concept separately if there is only one unknown in the query', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                'blue': {}
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': {}
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(2)
            expect(matches).toContainEqual({ 'sky': {} })
            expect(matches).toContainEqual({ 'blue': {} })
        })

        it('should match two unrelated concept together if there are two separate unknowns in the query', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                'blue': {}
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': {},
                '?unknown_002': {}
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(2)
            expect(matches).toEqual([{ "blue": {}, "sky": {} }, { "blue": {}, "sky": {} }])
        })

        it('should not match anything if there are more unknowns than possible data concepts', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {}
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': {},
                '?unknown_002': {},
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches).toEqual([])
        })

        it('should not match anything if there are more unknowns than possible non-exact data concepts', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                'blue': {}
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                '?unknown_001': {},
                '?unknown_002': {},
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches).toEqual([])
        })

        it('should not match anything if even one of the known query concepts does not exist in the data', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {}
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                'blue': {}
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches).toEqual([])
        })

        it('should match exact concepts even if data has relations', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': { '-is->': 'blue' }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                'blue': {}
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': {},
                'blue': {}
            })
        })

        it('should match unknown concepts even if data has relations', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': { '-is->': 'blue' }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                'sky': {},
                '?unknown_001': {}
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': {},
                'blue': {}
            })
        })
    })

    describe('Query With Single Relation', () => {

        it('should match exact relation if it exists in the data', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': { '-is->': 'blue' }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                'sky': { '-is->': 'blue' },
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': { '-is->': 'blue' },
            })
        })

        it('should match relation with single unknown variable in query', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': { '-is->': 'blue' }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': { '-is->': 'blue' },
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': { '-is->': 'blue' },
            })
        })

        it('should match relation with only unknown variables in query', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': { '-is->': 'blue' }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': { '-is->': '?unknown_002' },
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': { '-is->': 'blue' },
            })
        })

        it('should give all possible matches', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {
                    '-is->': {
                        'blue': {
                            '-is->': 'colour'
                        }
                    }
                },
                'yellow': {
                    '-is->': 'colour'
                }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': { '-is->': '?unknown_002' },
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(3)
            expect(matches).toContainEqual({ 'sky': { '-is->': 'blue' } })
            expect(matches).toContainEqual({ 'blue': { '-is->': 'colour' } })
            expect(matches).toContainEqual({ 'yellow': { '-is->': 'colour' } })
        })

        it('should match several disjointed graphs', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': { '-is->': 'blue' },
                'yellow': { '-is->': 'colour' },
                'car': { '-is->': { 'vehicle': { '-made_of->': 'metal' } } },
                'tree': { '-is->': 'plant' },
                'human': { '-made_of->': 'love' }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': { '-is->': '?unknown_002' },
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(4)
            expect(matches).toContainEqual({ 'sky': { '-is->': 'blue' } })
            expect(matches).toContainEqual({ 'yellow': { '-is->': 'colour' } })
            expect(matches).toContainEqual({ 'car': { '-is->': 'vehicle' } })
            expect(matches).toContainEqual({ 'tree': { '-is->': 'plant' } })
        })

        xit('should match single concept with several outgoing relations to other concepts', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {
                    '-is->': {
                        'blue': {
                            '-is->': 'colour'
                        },
                        'beautiful': {}
                    },
                    '-position->': 'above',
                },
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': {
                    '-is->': {
                        'blue': {},
                        'beautiful': {}
                    },
                    '-position->': 'above'
                },
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches).toContainEqual({
                'sky': {
                    '-is->': {
                        'blue': {},
                        'beautiful': {}
                    },
                    '-position->': 'above'
                },
            })
        })

        xit('should match single concept to concept relationship even if there is a cyclic relationship', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {
                    '-is->': {
                        'blue': {
                            '-is->': 'sky'
                        },
                        'yellow': {}
                    }
                }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': { '-is->': 'blue' },
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': { '-is->': 'blue' },
            })
        })

        xit('should match full cyclic relationship', () => {
            const data: ConceptGraph = ConceptGraph.fromModel({
                'sky': {
                    '-is->': {
                        'blue': {
                            '-is->': 'sky'
                        },
                        'yellow': {}
                    }
                }
            })
            const query: ConceptGraph = ConceptGraph.fromModel({
                '?unknown_001': {
                    '-is->': {
                        'blue': {
                            '-is->': '?unknown_001'
                        }
                    }
                },
            })

            const matches: ConceptGraphModel[] = matcher.getMatches(query, data)
                .map((singleMatch) => { return singleMatch.toModel() })

            expect(matches.length).toEqual(1)
            expect(matches[0]).toEqual({
                'sky': {
                    '-is->': {
                        'blue': {
                            '-is->': 'sky'
                        }
                    }
                },
            })
        })

        xit('should match single concept to concept relationship in other direction as well', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode(1, { description: 'sky' })
            data.addNode(2, { description: 'blue' })
            data.addNode(3, { description: 'yellow' })
            data.addEdgeWithKey(1, 1, 2, { type: 'some_relation' })
            data.addEdgeWithKey(2, 2, 1, { type: 'some_relation' })
            data.addEdgeWithKey(3, 1, 3, { type: 'some_relation' })

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

        xit('should match multiple concepts', () => {
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

    xdescribe('deep matches', () => {

        it('should match two levels deep concept', () => {
            const data: ConceptGraph = new ConceptGraph()
            data.addNode('sky', { description: 'sky' })
            data.addNode('blue', { description: 'blue' })
            data.addNode('colour', { description: 'colour' })
            data.addEdgeWithKey(1, 'sky', 'blue', { type: 'some_relation' })
            data.addEdgeWithKey(2, 'blue', 'colour', { type: 'some_relation' })

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