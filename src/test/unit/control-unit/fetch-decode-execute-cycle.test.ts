import { ConceptGraph } from "../../../main/core/ConceptGraph";
import { InMemoryConceptGraphDao } from "../../../main/dao/in-memory/InMemoryConceptGraphDao";
import { ControlUnit } from "../../../main/service/ControlUnit";
import { LogLevel, glog } from "../../../main/util/Logger";

global.console = require('console')
glog().setLogLevel(LogLevel.DEBUG)

describe(ControlUnit, () => {

    const inMemoryConceptGraphDao: InMemoryConceptGraphDao = new InMemoryConceptGraphDao()
    const controlUnit: ControlUnit = new ControlUnit(inMemoryConceptGraphDao)

    it('should process single cycle', async () => {
        const workingMemory: ConceptGraph = ConceptGraph.fromModel({
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

        const conclusion: ConceptGraph = await controlUnit.run(getFirstItemInSequenceRule, workingMemory)
    })

})