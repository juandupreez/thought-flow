import { ConceptGraph } from "../../../main/core/ConceptGraph"
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
                    '?unknown_001': {
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
        const args: ConceptGraph = ConceptGraph.fromModel({
            'sky': {
                '-attr->': 'light_blue'
            }
        })

        const result: ConceptGraph = await ruleService.appyRule(rule, args)


        // console.log(JSON.stringify(result.toJSON(), null, 2))
        console.log('\n\nTest Result')
        console.log('\tTransformed From:')
        console.log('\t\t', args.toModel('sky'))
        console.log('\tTo:')
        console.log('\t\t', result.toModel('sky'))


    })

})