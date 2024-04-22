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
        // const getFirstItemInSequenceRule: ConceptGraph = ConceptGraph.fromModel({
        //     'get_first_sequence_item_rule': {
        //         '-has_hypothesis->': {
        //             '?unknown_hyp_collection': {
        //                 '-first->': '?unknown_hyp_first_item'
        //             },
        //             '?unknown_hyp_first_item': {}
        //         },
        //         '-has_conclusion->': {
        //             'known_conc_first_item': {
        //                 '<-becomes-': '?unknown_hyp_first_item',
        //                 '-next->': '?unknown_conc_second_item'
        //             },
        //             '?unknown_conc_second_item': {}
        //         }
        //     }
        // })
        // const getNextItemInSequenceRule: ConceptGraph = ConceptGraph.fromModel({
        //     'get_next_sequence_item_rule': {
        //         '-has_hypothesis->': {
        //             '?unknown_hyp_cur_item': {
        //                 '-next->': '?unknown_hyp_next_item'
        //             },
        //             '?unknown_hyp_next_item': {}
        //         },
        //         '-has_conclusion->': {
        //             'known_conc_next_item': {
        //                 '<-becomes-': '?unknown_hyp_next_item',
        //                 '-next->': '?unknown_conc_next_next_item'
        //             },
        //             '?unknown_conc_next_next_item': {}
        //         }
        //     }
        // })
        const getFirstItemInSequenceRule: ConceptGraph = ConceptGraph.fromModel({
            'get_first_sequence_item_rule': {
                '-has_hypothesis->': {
                    '?unknown_hyp_collection': {
                        '-first->': '?unknown_hyp_first_item'
                    },
                    '?unknown_hyp_first_item': {}
                },
                '-has_conclusion->': {
                    'known_conc_first_item': {
                        '<-becomes-': '?unknown_hyp_first_item'
                    }
                }
            }
        })
        const getNextItemInSequenceRule: ConceptGraph = ConceptGraph.fromModel({
            'create_next_sequence_item_rule': {
                '-has_hypothesis->': {
                    '?unknown_hyp_item_in_sequence': {}
                },
                '-has_conclusion->': {
                    '?unknown_hyp_item_in_sequence': { '-becomes->': 'known_conc_item_in_sequence' },
                    'known_conc_item_in_sequence': {},
                    '?unknown_hyp_next_item': {},
                    'known_conc_next_item': {},
                    'get_next_sequence_item_rule': {
                        '-has_hypothesis_1->': {
                            'known_conc_item_in_sequence': {
                                '-next->': '?unknown_hyp_next_item'
                            },
                            '?unknown_hyp_next_item': {}
                        },
                        '-has_conclusion_1->': {
                            'known_conc_next_item': {
                                '<-becomes_1-': '?unknown_hyp_next_item'
                            }
                        }
                    }
                }
            }
        })

        const firstItem: ConceptGraph = await ruleService.applyRuleToFirstMatch(getFirstItemInSequenceRule, data)
        glog().info('First Item', firstItem.toStringifiedModel())

        const createdNextItemRule1: ConceptGraph = await ruleService.applyRuleToFirstMatch(getNextItemInSequenceRule, firstItem)
        createdNextItemRule1.replaceRelationTypes('has_hypothesis_1', 'has_hypothesis')
        createdNextItemRule1.replaceRelationTypes('has_conclusion_1', 'has_conclusion')
        createdNextItemRule1.replaceRelationTypes('becomes_1', 'becomes')
        const secondItem: ConceptGraph = await ruleService.applyRuleToFirstMatch(createdNextItemRule1, data)
        glog().info('Second Item', secondItem.toStringifiedModel())

        const createdNextItemRule2: ConceptGraph = await ruleService.applyRuleToFirstMatch(getNextItemInSequenceRule, secondItem)
        createdNextItemRule2.replaceRelationTypes('has_hypothesis_1', 'has_hypothesis')
        createdNextItemRule2.replaceRelationTypes('has_conclusion_1', 'has_conclusion')
        createdNextItemRule2.replaceRelationTypes('becomes_1', 'becomes')
        const thirdItem: ConceptGraph = await ruleService.applyRuleToFirstMatch(createdNextItemRule2, data)
        glog().info('Third Item', thirdItem.toStringifiedModel())

        const createdNextItemRule3: ConceptGraph = await ruleService.applyRuleToFirstMatch(getNextItemInSequenceRule, thirdItem)
        createdNextItemRule3.replaceRelationTypes('has_hypothesis_1', 'has_hypothesis')
        createdNextItemRule3.replaceRelationTypes('has_conclusion_1', 'has_conclusion')
        createdNextItemRule3.replaceRelationTypes('becomes_1', 'becomes')
        const fourthItem: ConceptGraph = await ruleService.applyRuleToFirstMatch(createdNextItemRule3, data)
        glog().info('Fourth Item', fourthItem.toStringifiedModel())


        // const fourthItem: ConceptGraph = await ruleService.applyRuleGetFirstResult(getNextItemInSequenceRule, thirdItem)
        // glog().info('Fourth Item',fourthItem.toStringifiedModel())


    })

})