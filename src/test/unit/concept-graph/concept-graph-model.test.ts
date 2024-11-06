import { ConceptGraph } from "../../../main/core/ConceptGraph"
import { ConceptGraphModel } from "../../../main/model/ConceptGraphModel"
import { glog } from "../../../main/util/Logger"

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

        it('should convert graph with cyclic relations', () => {
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

        it('should parse ":to_all" relations to point to all recursive sub concepts', () => {
            const originalModel: ConceptGraphModel = {
                'sky': {
                    '-defined_by:to_all->': {
                        'word_sky': {
                            "-has_part:to_all->": {
                                "s_in_sky": {
                                    "-instance_of->": 'letter_s'
                                },
                                "k_in_sky": {
                                    "-instance_of->": 'letter_k'
                                },
                                "y_in_sky": {
                                    "-instance_of->": 'letter_y'
                                }
                            }
                        }
                    }
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            const model: ConceptGraphModel = cg.toModel('sky')
            expect(model).toEqual({
                "sky": {
                    "-defined_by->": {
                        "letter_y": {
                            "<-instance_of-": {
                                "y_in_sky": {
                                    "<-has_part-": {
                                        "word_sky": {
                                            "-has_part->": {
                                                "letter_y": {},
                                                "letter_k": {
                                                    "<-instance_of-": {
                                                        "k_in_sky": {
                                                            "<-has_part-": {
                                                                "word_sky": {
                                                                    "-has_part->": {
                                                                        "letter_s": {
                                                                            "<-instance_of-": {
                                                                                "s_in_sky": {
                                                                                    "<-has_part-": {
                                                                                        "word_sky": {
                                                                                            "<-defined_by-": {
                                                                                                "sky": {
                                                                                                    "-defined_by->": {
                                                                                                        "y_in_sky": {},
                                                                                                        "letter_k": {},
                                                                                                        "k_in_sky": {},
                                                                                                        "letter_s": {},
                                                                                                        "s_in_sky": {}
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

        })

        it('should parse ":to_all" and unknown concept ids', () => {
            const originalModel: ConceptGraphModel = {
                "rule_get_first_sequence_item": {
                    "-instance_of->": "rule",
                    "-has_hypothesis:to_all->": {
                        "?unknown_collection": {
                            "-first->": "?unknown_sequence_item"
                        }
                    },
                    "-has_mapping:to_all->": {
                        "?unknown_sequence_item": {
                            "-becomes->": "?first_item"
                        }
                    },
                    "-has_conclusion:to_all->": {
                        "?first_item": {}
                    }
                }
            }
            const cg: ConceptGraph = ConceptGraph.fromModel(originalModel)

            glog().info(cg.toStringifiedModel('rule_get_first_sequence_item'))

            const model: ConceptGraphModel = cg.toModel('rule_get_first_sequence_item')
            expect(model).toEqual({
                "rule_get_first_sequence_item": {
                    "-has_mapping->": {
                        "?first_item": {
                            "<-becomes-": {
                                "?unknown_sequence_item": {
                                    "<-first-": {
                                        "?unknown_collection": {
                                            "<-has_hypothesis-": {
                                                "rule_get_first_sequence_item": {
                                                    "-has_conclusion->": "?first_item",
                                                    "-has_hypothesis->": {
                                                        "?unknown_sequence_item": {
                                                            "<-has_mapping-": {
                                                                "rule_get_first_sequence_item": {
                                                                    "-instance_of->": "rule"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })

        })
    })

})