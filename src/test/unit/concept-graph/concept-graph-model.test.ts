import { ConceptGraph } from "../../../main/core/ConceptGraph"
import { ConceptGraphModel } from "../../../main/model/ConceptGraphModel"

describe(ConceptGraph, () => {

    describe('toModel', () => {
        it('should convert empty graph to empty model', () => {
            const cg: ConceptGraph = new ConceptGraph()

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual({})
        })

        it('should convert graph with single node and no relations', () => {
            const originalModel: ConceptGraphModel = {
                'single_concept': {}
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })

        it('should convert graph with two nodes and single relation', () => {
            const originalModel: ConceptGraphModel = {
                'sky': {
                    '-attr->': 'blue'
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })

        it('should convert graph with two nodes and single relation in other direction', () => {
            const originalModel: ConceptGraphModel = {
                'sky': {
                    '<-attr-': 'blue'
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })

        it('should convert graph with two relations of the same type', () => {
            const originalModel: ConceptGraphModel = {
                'sky': {
                    '-attr->': {
                        'blue': {},
                        'light_blue': {}
                    }
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })

        it('should convert graph with five relations of the same type', () => {
            const originalModel: ConceptGraphModel = {
                'sky': {
                    '-attr->': {
                        'blue': {},
                        'light_blue': {},
                        'red': {},
                        'orange': {},
                        'purple': {}
                    }
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })

        it('should convert graph with deep relations', () => {
            const originalModel: ConceptGraphModel = {
                'sky': {
                    '-attr->': {
                        'light_blue': {
                            '<-subtype_of-': {
                                'blue': {
                                    '-instance_of->': 'colour'
                                }
                            }
                        },
                    }
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })

        it('should convert graph with two separate non-intersection graph parts', () => {
            const originalModel: ConceptGraphModel = {
                'sky': {
                    '-attr->': {
                        'light_blue': {
                            '<-subtype_of-': {
                                'blue': {
                                    '-instance_of->': 'colour'
                                }
                            }
                        },
                    }
                },
                'car': {
                    '-is->': {
                        'fun': {
                            '<-is-': {
                                'way': {
                                    '-of->': 'life'
                                }
                            }
                        }
                    }
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })

        xit('should convert graph with cyclic relations', () => {
            const originalModel: ConceptGraphModel = {
                'sky': {
                    '-attr->': {
                        'light_blue': {
                            '-part_of->': 'sky'
                        }
                    }
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })

        it('should convert graph with leading node', () => {
            const originalModel: ConceptGraphModel = {
                'blue': {
                    '<-attr-': 'sky'
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel('sky')

            expect(model).toEqual({
                'sky': {
                    '-attr->': 'blue'
                }
            })
        })

        it.each([
            [{ 'sky': { '-attr->': '?colour__001' } }],
            [{ '?unknown_object': { '-attr->': 'blue' } }],
            [{ '?unknown_object': { '-attr->': '?colour__001' } }],
            [{ '?unknown_object': { '-attr->': { 'blue': { '-subtype_of->': '?unknown_colour' } } } }],
        ])('should convert unknown concepts to have question mark', (originalModel: ConceptGraphModel) => {
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel()

            expect(model).toEqual(originalModel)
        })
    })

})