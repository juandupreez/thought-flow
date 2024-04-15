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
                '-has_hypothesis->': {
                    '?unknown_001': {
                        '-attr->': {
                            "light_blue": {
                                "<-has_hypothesis-": "blue_rule"
                            }
                        }
                    }
                },
                '-has_conclusion->': {
                    '?unknown_002': {
                        '<-becomes-': '?unknown_001',
                        '-attr->': {
                            "blue": {
                                "<-has_conclusion-": "blue_rule"
                            }
                        }
                    }
                }

            }
        })
        // Argument: sky is blue
        const args: ConceptGraph = ConceptGraph.fromModel({ 'sky': { '-attr->': 'light_blue' } })

        const result: ConceptGraph = await ruleService.applyRuleGetFirstResult(rule, args)

        const expectedResultModel: ConceptGraphModel = { 'sky': { '-attr->': 'blue' } }
        expect(result.toModel('sky')).toEqual(expectedResultModel)


    })

    it('should apply rule where conclusing concept is: unknown-attr->known', async () => {
        // Rule: everything that is light blue is also blue
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "blue_rule": {
                '-has_hypothesis->': {
                    '?unknown_001': {
                        '-attr->': {
                            "light_blue": {
                                "<-has_hypothesis-": "blue_rule"
                            }
                        }
                    }
                },
                '-has_conclusion->': {
                    '?unknown_002': {
                        '<-becomes-': '?unknown_001',
                        '-attr->': {
                            "blue": {
                                "<-has_conclusion-": "blue_rule"
                            }
                        }
                    }
                }

            }
        })
        // Argument: sky is blue
        const args: ConceptGraph = ConceptGraph.fromModel({ 'sky': { '-attr->': 'light_blue' } })

        const result: ConceptGraph = await ruleService.applyRuleGetFirstResult(rule, args)

        const expectedResultModel: ConceptGraphModel = { 'sky': { '-attr->': 'blue' } }
        expect(result.toModel('sky')).toEqual(expectedResultModel)


    })

    it('should apply rule where conclusing concept is: known-attr->unkown', async () => {
        // Rule: if sky has an attribute then a cloud has the same attribute
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "blue_rule": {
                '-has_hypothesis->': {
                    'sky': {
                        '-attr->': {
                            "?attribute_001": {
                                "<-has_hypothesis-": "blue_rule"
                            }
                        }
                    }
                },
                '-has_conclusion->': {
                    'cloud': {
                        '-attr->': {
                            "?attribute_002": {
                                '<-becomes-': '?attribute_001',
                                "<-has_conclusion-": "blue_rule"
                            }
                        }
                    }
                }

            }
        })
        // Argument: sky is blue
        const args: ConceptGraph = ConceptGraph.fromModel({ 'sky': { '-attr->': 'blue' } })

        const result: ConceptGraph = await ruleService.applyRuleGetFirstResult(rule, args)

        expect(result.toModel('cloud')).toEqual({ 'cloud': { '-attr->': 'blue' } })


    })

    it('should apply rule where conclusing concept is: unknown-attr->unkown', async () => {
        // Rule: if anything has an attribute, anything is attribute
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "blue_rule": {
                '-has_hypothesis->': {
                    '?unknown_001': {
                        '-attr->': {
                            "?attribute_001": {
                                "<-has_hypothesis-": "blue_rule"
                            }
                        }
                    }
                },
                '-has_conclusion->': {
                    '?unknown_002': {
                        '<-becomes-': '?unknown_001',
                        '-is->': {
                            "?attribute_002": {
                                '<-becomes-': '?attribute_001',
                                "<-has_conclusion-": "blue_rule"
                            }
                        }
                    }
                }

            }
        })
        // Argument: sky has attribute blue
        const args: ConceptGraph = ConceptGraph.fromModel({ 'sky': { '-attr->': 'blue' } })

        const result: ConceptGraph = await ruleService.applyRuleGetFirstResult(rule, args)

        const expectedResultModel: ConceptGraphModel = { 'sky': { '-is->': 'blue' } }
        expect(result.toModel('sky')).toEqual(expectedResultModel)


    })

    it('should apply rule to all matches merged if requested', async () => {
        // Rule: if anything has an attribute, anything is attribute
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "parts_rule": {
                '-has_hypothesis->': {
                    '?unknown_hyp_collection': {
                        '-has_part->': {
                            "?unknown_hyp_collection_part": {
                                "<-has_hypothesis-": "parts_rule"
                            }
                        }
                    }
                },
                '-has_conclusion->': {
                    '?unknown_conc_collection_part': {
                        '<-becomes-': '?unknown_hyp_collection_part',
                        '-part_of->': {
                            "?unknown_conc_collection": {
                                '<-becomes-': '?unknown_hyp_collection',
                                "<-has_conclusion-": "parts_rule"
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
                '-has_hypothesis->': {
                    '?unknown_hyp_collection': {
                        '-has_part->': {
                            "?unknown_hyp_collection_part": {
                                "<-has_hypothesis-": "parts_rule"
                            }
                        }
                    }
                },
                '-has_conclusion->': {
                    '?unknown_conc_collection_part': {
                        '<-becomes-': '?unknown_hyp_collection_part',
                        '-part_of->': {
                            "?unknown_conc_collection": {
                                '<-becomes-': '?unknown_hyp_collection',
                                "<-has_conclusion-": "parts_rule"
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

        const result: ConceptGraph = await ruleService.applyRuleGetFirstResult(rule, args)

        expect(result.toModel('face')).toEqual({
            'face': {
                '<-part_of-': 'left_eye'
            }
        })
    })

})