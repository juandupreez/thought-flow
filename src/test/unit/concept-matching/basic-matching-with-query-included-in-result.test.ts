import { ConceptGraph } from "../../../main/core/ConceptGraph"
import { ConceptGraphModel } from "../../../main/model/ConceptGraphModel"
import { ConceptMatchService } from "../../../main/service/ConceptMatchService"
import { GlobalLogger, LogLevel, glog } from "../../../main/util/Logger"

global.console = require('console')

describe(ConceptMatchService.name + ' - return query with result', () => {
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
                '-matches->': 'sky'
            }
        })
    })

    it('should give "matches" relationship between single query unknown and matched data concept', () => {
        const data: ConceptGraph = ConceptGraph.fromModel({
            'sky': {}
        })
        const query: ConceptGraph = ConceptGraph.fromModel({
            '?unknown_sky': {}
        })

        const matches: ConceptGraphModel[] = matcher.getMatches(query, data, { shouldIncludeQueryInResult: true })
            .map((singleMatch) => { return singleMatch.toModel('unknown_sky') })

        expect(matches.length).toBe(1)
        expect(matches[0]).toEqual({
            '?unknown_sky': {
                '-matches->': 'sky'
            }
        })
    })

    it('should give "matches" relationship between several query unknowns and respective matched data concept', () => {
        const data: ConceptGraph = ConceptGraph.fromModel({
            'sky': {
                '-is->': {
                    'blue': {
                        '-is->': 'colour'
                    }
                }
            },
        })
        const query: ConceptGraph = ConceptGraph.fromModel({
            '?unknown_sky': {
                '-is->': {
                    '?unknown_blue': {
                        '-is->': '?unknown_colour'
                    }
                }
            }
        })

        const matches: ConceptGraphModel[] = matcher.getMatches(query, data, { shouldIncludeQueryInResult: true })
            .map((singleMatch) => { return singleMatch.toModel('unknown_sky') })

        expect(matches.length).toBe(1)
        expect(matches[0]).toEqual({
            '?unknown_sky': {
                '-matches->': {
                    'sky': {
                        '-is->': {
                            'blue': {
                                '<-matches-': '?unknown_blue',
                                '-is->': {
                                    'colour': {
                                        '<-matches-': '?unknown_colour'
                                    }
                                }
                            }
                        }

                    }
                }
            }
        })

    })

    it('should give "matches" relationship specific to separate matches', () => {
        const data: ConceptGraph = ConceptGraph.fromModel({
            'sky': {
                '-is->': {
                    'blue': {
                        '-is->': 'colour'
                    }
                }
            },
        })
        const query: ConceptGraph = ConceptGraph.fromModel({
            '?unknown_001': {
                '-is->': '?unknown_002'
            }
        })

        const matches: ConceptGraphModel[] = matcher.getMatches(query, data, { shouldIncludeQueryInResult: true })
            .map((singleMatch) => { return singleMatch.toModel('unknown_001') })

        expect(matches.length).toBe(2)
        expect(matches).toContainEqual({
            '?unknown_001': {
                '-matches->': {
                    'sky': {
                        '-is->': {
                            'blue': {
                                '<-matches-': '?unknown_002'
                            }
                        }
                    },
                }
            }
        })
        expect(matches).toContainEqual({
            '?unknown_001': {
                '-matches->': {
                    'blue': {
                        '-is->': {
                            'colour': {
                                '<-matches-': '?unknown_002'
                            }
                        }
                    },
                }
            }
        })
    })

})