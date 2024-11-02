import { create } from "domain"
import { ConceptGraph } from "../../../main/core/ConceptGraph"
import { ConceptGraphModel } from "../../../main/model/ConceptGraphModel"
import { RuleService } from "../../../main/service/RuleService"
import { LogLevel, glog } from "../../../main/util/Logger"

global.console = require('console')
glog().setLogLevel(LogLevel.INFO)

describe('Sequence Mechanics', () => {

    const ruleService: RuleService = new RuleService()

    // Sequence of letters in the word "sky"

    it('should traverse a sequence with 3 items', async () => {
        const data: ConceptGraph = ConceptGraph.fromModel({
            "word_sky": {
                '-has_part->': {
                    's_in_sky': {
                        '<-first-': 'word_sky',
                        '-instance_of->': {
                            'letter_s': {
                                '-is_a->': 'letter'
                            }
                        },
                        '-next->': 'k_in_sky'
                    },
                    'k_in_sky': {
                        '-instance_of->': {
                            'letter_k': {
                                '-is_a->': 'letter'
                            }
                        },
                        '-next->': 'y_in_sky'
                    },
                    'y_in_sky': {
                        '-instance_of->': {
                            'letter_y': {
                                '-is_a->': 'letter'
                            }
                        },
                        '<-last-': 'word_sky',
                    },
                }
            }
        })
        const getFirstItemInSequenceRule: ConceptGraph = ConceptGraph.fromModel({
            'get_first_sequence_item_rule': {
                '-has_hypothesis->': {
                    '?unknown_first_item': {},
                    '?unknown_collection': {
                        '-first->': '?unknown_first_item'
                    }
                },
                '-has_mapping->': {
                    'known_first_item': {},
                    '?unknown_first_item': {
                        '-becomes->': 'known_first_item'
                    }
                },
                '-has_conclusion->': {
                    'known_first_item': {}
                }
            }
        })
        const getNextItemInSequenceRule: ConceptGraph = ConceptGraph.fromModel({
            'create_next_sequence_item_rule': {
                '-has_hypothesis->': {
                    '?unknown_sequence_item': {}
                },
                '-has_mapping->': {
                    'known_sequence_item': {},
                    '?unknown_sequence_item': {
                        '-becomes->': 'known_sequence_item'
                    }
                },
                '-has_conclusion->': {
                    'known_sequence_item': {},
                    '?unknown_next_item': {},
                    'known_next_item': {},
                    'get_next_sequence_item_rule': {
                        '-has_hypothesis->': {
                            '?unknown_next_item': {},
                            'known_sequence_item': {
                                '-next->': '?unknown_next_item'
                            }
                        },
                        '-has_mapping->': {
                            'known_next_item': {},
                            '?unknown_next_item': {
                                '-becomes->': 'known_next_item'
                            }
                        },
                        '-has_conclusion->': {
                            'known_next_item': {}
                        }
                    }
                }
            }
        })

        const firstItem: ConceptGraph = await ruleService.applyRuleToFirstMatch(getFirstItemInSequenceRule, data)
        // glog().info('First Item', firstItem.toStringifiedModel())
        expect(firstItem.toModel()).toEqual({
            "s_in_sky": {}
        })

        const createdNextItemRule1: ConceptGraph = await ruleService.applyRuleToFirstMatch(getNextItemInSequenceRule, firstItem)
        const secondItem: ConceptGraph = await ruleService.applyRuleToFirstMatch(createdNextItemRule1, data)
        // glog().info('Second Item', secondItem.toStringifiedModel())
        expect(secondItem.toModel()).toEqual({
            "k_in_sky": {}
        })

        const createdNextItemRule2: ConceptGraph = await ruleService.applyRuleToFirstMatch(getNextItemInSequenceRule, secondItem)
        const thirdItem: ConceptGraph = await ruleService.applyRuleToFirstMatch(createdNextItemRule2, data)
        // glog().info('Third Item', thirdItem.toStringifiedModel())
        expect(thirdItem.toModel()).toEqual({
            "y_in_sky": {}
        })

        const createdNextItemRule3: ConceptGraph = await ruleService.applyRuleToFirstMatch(getNextItemInSequenceRule, thirdItem)
        const fourthItem: ConceptGraph = await ruleService.applyRuleToFirstMatch(createdNextItemRule3, data)
        // glog().info('Fourth Item', fourthItem.toStringifiedModel())
        expect(fourthItem.toModel()).toEqual({})

    })

})