import { ConceptGraph } from "../../../main/core/ConceptGraph";
import { ConceptGraphDao } from "../../../main/dao/ConceptGraphDao";
import { InMemoryConceptGraphDao } from "../../../main/dao/in-memory/InMemoryConceptGraphDao";
import { ConceptGraphModel } from "../../../main/model/ConceptGraphModel";
import { ControlUnit } from "../../../main/service/ControlUnit";
import { LogLevel, glog } from "../../../main/util/Logger";
import fs from 'fs'

global.console = require('console')
glog().setLogLevel(LogLevel.INFO)

describe(ControlUnit, () => {


    it('should print all letters in "sky"', async () => {

        const inMemoryConceptGraphDao: ConceptGraphDao = new InMemoryConceptGraphDao()
        inMemoryConceptGraphDao.createConceptGraphModel(require('./_mocks/rules.json'))
        inMemoryConceptGraphDao.createConceptGraphModel(require('./_mocks/template_rules.json'))
        inMemoryConceptGraphDao.createConceptGraphModel(require('./_mocks/word_sky.json'))

        const controlUnit: ControlUnit = new ControlUnit(inMemoryConceptGraphDao)

        const printLettersInWordSkyProcedure: ConceptGraph = ConceptGraph.fromModel({
            "print_all_letters_in_word_sky": {
                "-is_a->": "procedure",
                "-has_part->": {
                    "op_fetch_word_sky_from_kb": {
                        "<-first-": "print_all_letters_in_word_sky",
                        "-instance_of->": {
                            "FetchOp": {
                                "-is_a->": "operation"
                            }
                        },
                        "-has_args:to_all->": {
                            "query": {
                                "-defined_by:to_all->": {
                                    "word_sky": {
                                        "-instance_of->": "word",
                                        "-has_part->": {
                                            "?unknown_letter": {
                                                "-instance_of->": "letter"
                                            }
                                        }
                                    }
                                }
                            },
                            "working_memory_slot": {
                                "-defined_by->": "slot_000"
                            }
                        },
                        "-next->": "op_get_letter_s"
                    },
                    "op_get_letter_s": {
                        "-instance_of->": {
                            "ApplyRuleOp": {
                                "-is_a->": "operation"
                            }
                        },
                        "-has_args->": {
                            "apply_rule_op_arg-rule": {
                                "-defined_by->": "rule_get_first_item"
                            },
                            "apply_rule_op_arg-source_slot": {
                                "-defined_by->": "slot_000"
                            },
                            "apply_rule_op_arg-result_slot": {
                                "-defined_by->": "slot_001"
                            }
                        },
                        "-next->": "op_print_letter_s"
                    },
                    "op_print_letter_s": {
                        "-instance_of->": {
                            "PrintConceptsOp": {
                                "-is_a->": "operation"
                            }
                        },
                        "-has_args->": {
                            "print_concepts_op_arg-slot_to_print": {
                                "-defined_by->": "slot_001"
                            }
                        },
                        "-next->": "op_halt_print_word_sky"
                    },
                    // "op_get_letter_k": {
                    //     "-instance_of->": {
                    //         "ApplyRuleOp": {
                    //             "-is_a->": "operation"
                    //         }
                    //     },
                    //     "-has_args->": "rule_get_next_item",
                    //     "-next->": "op_print_letter_k"
                    // },
                    // "op_print_letter_k": {
                    //     "-instance_of->": {
                    //         "PrintConceptsOp": {
                    //             "-is_a->": "operation"
                    //         }
                    //     },
                    //     "-has_args->": {
                    //         "?unknown_letter": {
                    //             "-instance_of->": "letter"
                    //         }
                    //     },
                    //     "-next->": "op_get_letter_y"
                    // },
                    // "op_get_letter_y": {
                    //     "-instance_of->": {
                    //         "ApplyRuleOp": {
                    //             "-is_a->": "operation"
                    //         }
                    //     },
                    //     "-has_args->": "rule_get_next_item",
                    //     "-next->": "op_print_letter_y"
                    // },
                    // "op_print_letter_y": {
                    //     "-instance_of->": {
                    //         "PrintConceptsOp": {
                    //             "-is_a->": "operation"
                    //         }
                    //     },
                    //     "-has_args->": {
                    //         "?unknown_letter": {
                    //             "-instance_of->": "letter"
                    //         }
                    //     },
                    //     "-next->": "op_halt_print_word_sky"
                    // },
                    "op_halt_print_word_sky": {
                        "-instance_of->": {
                            "HaltOp": {
                                "-is_a->": "operation"
                            }
                        }
                    }
                }
            }
        })

        await controlUnit.run(printLettersInWordSkyProcedure)
    })

})


