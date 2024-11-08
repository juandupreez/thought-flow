import { ConceptGraph } from "../../../main/core/ConceptGraph"
import { ConceptGraphModel } from "../../../main/model/ConceptGraphModel"
import { RuleService } from "../../../main/service/RuleService"
import { LogLevel, glog } from "../../../main/util/Logger"

global.console = require('console')
glog().setLogLevel(LogLevel.DEBUG)

describe('Basic Rules', () => {
    const ruleService: RuleService = new RuleService()

    it('should apply simple rule: everything that is light blue is also blue', async () => {
        // Rule: everything that is light blue is also blue
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "blue_rule": {
                '-instance_of->': 'rule',
                '-defined_by:to_all->': {
                    'blue_rule-hypothesis': {
                        '-instance_of->': 'hypothesis',
                        '<-has_hypothesis-': 'blue_rule',
                        '-defined_by:to_all->': {
                            '?unknown_001': {
                                '-attr->': "light_blue"
                            }
                        }
                    },
                    'blue_rule-mapping': {
                        '-instance_of->': 'mapping',
                        '<-has_mapping-': 'blue_rule',
                        '-defined_by:to_all->': {
                            '?unknown_001': {
                                '-becomes->': 'known_001'
                            }
                        }
                    },
                    'blue_rule-conclusion': {
                        '-instance_of->': 'conclusion',
                        '<-has_conclusion-': 'blue_rule',
                        '-defined_by:to_all->': {
                            'known_001': {
                                '-attr->': "blue"
                            }
                        }
                    }
                }
            }
        })
        // Argument: sky is blue
        const args: ConceptGraph = ConceptGraph.fromModel({ 'sky': { '-attr->': 'light_blue' } })

        const result: ConceptGraph = await ruleService.applyRuleToFirstMatch(rule, args)

        const expectedResultModel: ConceptGraphModel = { 'sky': { '-attr->': 'blue' } }
        expect(result.toModel('sky')).toEqual(expectedResultModel)


    })

    it('should apply rule where conclusing concept is: unknown-attr->known', async () => {
        // Rule: everything that is light blue is also blue
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "blue_rule": {
                '-instance_of->': 'rule',
                '-defined_by:to_all->': {
                    'blue_rule-hypothesis': {
                        '-instance_of->': 'hypothesis',
                        '<-has_hypothesis-': 'blue_rule',
                        '-defined_by:to_all->': {
                            '?unknown_001': {
                                '-attr->': "light_blue"
                            }
                        }
                    },
                    'blue_rule-mapping': {
                        '-instance_of->': 'mapping',
                        '<-has_mapping-': 'blue_rule',
                        '-defined_by:to_all->': {
                            '?unknown_001': {
                                '-becomes->': 'known_001'
                            }
                        }
                    },
                    'blue_rule-conclusion': {
                        '-instance_of->': 'conclusion',
                        '<-has_conclusion-': 'blue_rule',
                        '-defined_by:to_all->': {
                            'known_001': {
                                '-attr->': "blue"
                            }
                        }
                    }
                }
            }
        })
        // Argument: sky is blue
        const args: ConceptGraph = ConceptGraph.fromModel({ 'sky': { '-attr->': 'light_blue' } })

        const result: ConceptGraph = await ruleService.applyRuleToFirstMatch(rule, args)

        const expectedResultModel: ConceptGraphModel = { 'sky': { '-attr->': 'blue' } }
        expect(result.toModel('sky')).toEqual(expectedResultModel)


    })

    it('should apply rule where conclusing concept is: known-attr->unkown', async () => {
        // Rule: if sky has an attribute then a cloud has the same attribute
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "blue_rule": {
                '-instance_of->': 'rule',
                '-defined_by:to_all->': {
                    'blue_rule-hypothesis': {
                        '-instance_of->': 'hypothesis',
                        '<-has_hypothesis-': 'blue_rule',
                        '-defined_by:to_all->': {
                            'sky': {
                                '-attr->': "?attribute_001"
                            }
                        }
                    },
                    'blue_rule-mapping': {
                        '-instance_of->': 'mapping',
                        '<-has_mapping-': 'blue_rule',
                        '-defined_by:to_all->': {
                            '?attribute_001': {
                                '-becomes->': 'attribute_002'
                            }
                        }
                    },
                    'blue_rule-conclusion': {
                        '-instance_of->': 'conclusion',
                        '<-has_conclusion-': 'blue_rule',
                        '-defined_by:to_all->': {
                            'cloud': {
                                '-attr->': {
                                    "?attribute_002": {}
                                }
                            }
                        }
                    }
                }
            }
        })
        // Argument: sky is blue
        const args: ConceptGraph = ConceptGraph.fromModel({ 'sky': { '-attr->': 'blue' } })

        const result: ConceptGraph = await ruleService.applyRuleToFirstMatch(rule, args)

        expect(result.toModel('cloud')).toEqual({ 'cloud': { '-attr->': 'blue' } })


    })

    it('should apply rule where conclusing concept is: unknown-attr->unkown', async () => {
        // Rule: if anything has an attribute, anything is attribute
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "blue_rule": {
                '-instance_of->': 'rule',
                '-defined_by:to_all->': {
                    'blue_rule-hypothesis': {
                        '-instance_of->': 'hypothesis',
                        '<-has_hypothesis-': 'blue_rule',
                        '-defined_by:to_all->': {
                            '?unknown_001': {
                                '-attr->': "?unknown_attribute_001"
                            }
                        }
                    },
                    'blue_rule-mapping': {
                        '-instance_of->': 'mapping',
                        '<-has_mapping-': 'blue_rule',
                        '-defined_by:to_all->': {
                            '?unknown_001': {
                                "-becomes->": 'known_001'
                            },
                            '?unknown_attribute_001': {
                                "-becomes->": 'known_attribute_001'
                            }
                        }
                    },
                    'blue_rule-conclusion': {
                        '-instance_of->': 'conclusion',
                        '<-has_conclusion-': 'blue_rule',
                        '-defined_by:to_all->': {
                            'known_001': {
                                '-is->': "known_attribute_001"
                            }
                        }
                    }
                }
            }
        })
        // Argument: sky has attribute blue
        const args: ConceptGraph = ConceptGraph.fromModel({ 'sky': { '-attr->': 'blue' } })

        const result: ConceptGraph = await ruleService.applyRuleToFirstMatch(rule, args)

        const expectedResultModel: ConceptGraphModel = { 'sky': { '-is->': 'blue' } }
        expect(result.toModel('sky')).toEqual(expectedResultModel)


    })

    it('should apply rule to all matches merged if requested', async () => {
        // Rule: if anything has an attribute, anything is attribute
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "parts_rule": {
                '-instance_of->': 'rule',
                '-defined_by:to_all->': {
                    'parts_rule-hypothesis': {
                        '-instance_of->': 'hypothesis',
                        '<-has_hypothesis-': 'parts_rule',
                        '-defined_by:to_all->': {
                            '?unknown_collection': {
                                '-has_part->': "?unknown_collection_part"
                            }
                        }
                    },
                    'parts_rule-mapping': {
                        '-instance_of->': 'mapping',
                        '<-has_mapping-': 'parts_rule',
                        '-defined_by:to_all->': {
                            '?unknown_collection': {
                                '-becomes->': 'known_collection'
                            },
                            '?unknown_collection_part': {
                                '-becomes->': 'known_collection_part'
                            },
                        }
                    },
                    'parts_rule-conclusion': {
                        '-instance_of->': 'conclusion',
                        '<-has_conclusion-': 'parts_rule',
                        '-defined_by:to_all->': {
                            'known_collection_part': {
                                '-part_of->': 'known_collection'
                            }
                        }
                    }
                }
            }
        })
        // Argument: sky has attribute blue
        const args: ConceptGraph = ConceptGraph.fromModel({
            'face': {
                '-has_part->': {
                    'left_eye': {},
                    'right_eye': {},
                    'nose': {},
                    'mouth': {},
                }
            }
        })

        const result: ConceptGraph = await ruleService.applyRuleToAllMatches(rule, args)

        expect(result.toModel('face')).toEqual({
            'face': {
                '<-part_of-': {
                    'left_eye': {},
                    'right_eye': {},
                    'nose': {},
                    'mouth': {},
                }
            }
        })
    })

    it('should apply rule to first match only if requested', async () => {
        // Rule: if anything has an attribute, anything is attribute

        const rule: ConceptGraph = ConceptGraph.fromModel({
            "parts_rule": {
                '-instance_of->': 'rule',
                '-defined_by:to_all->': {
                    'parts_rule-hypothesis': {
                        '-instance_of->': 'hypothesis',
                        '<-has_hypothesis-': 'parts_rule',
                        '-defined_by:to_all->': {
                            '?unknown_collection': {
                                '-has_part->': "?unknown_collection_part"
                            }
                        }
                    },
                    'parts_rule-mapping': {
                        '-instance_of->': 'mapping',
                        '<-has_mapping-': 'parts_rule',
                        '-defined_by:to_all->': {
                            '?unknown_collection': {
                                '-becomes->': 'known_collection'
                            },
                            '?unknown_collection_part': {
                                '-becomes->': 'known_collection_part'
                            }
                        }
                    },
                    'parts_rule-conclusion': {
                        '-instance_of->': 'conclusion',
                        '<-has_conclusion-': 'parts_rule',
                        '-defined_by:to_all->': {
                            'known_collection_part': {
                                '-part_of->': 'known_collection'
                            }
                        }
                    }
                }
            }
        })
        // Argument: sky has attribute blue
        const args: ConceptGraph = ConceptGraph.fromModel({
            'face': {
                '-has_part->': {
                    'left_eye': {},
                    'right_eye': {},
                    'nose': {},
                    'mouth': {},
                }
            }
        })

        const result: ConceptGraph = await ruleService.applyRuleToFirstMatch(rule, args)

        expect(result.toModel('face')).toEqual({
            'face': {
                '<-part_of-': 'left_eye'
            }
        })
    })

})