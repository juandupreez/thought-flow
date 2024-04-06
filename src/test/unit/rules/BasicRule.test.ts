import { ConceptGraph } from "../../../main/concepts/ConceptGraph"
import { RuleService } from "../../../main/service/RuleService"
import { LogLevel, glog } from "../../../main/util/Logger"

global.console = require('console')
glog().setLogLevel(LogLevel.DEBUG)

describe('Basic Rules', () => {
    const ruleService: RuleService = new RuleService()

    it('should apply simple rule: everything that is light blue is also blue', async () => {
        // Rule: everything that is light blue is also blue
        const rule: ConceptGraph = ConceptGraph.fromModel({
            "blue_rule (blue_rule)": {
                '-has_hypothesis->': {
                    'unknown_001': {
                        '-attr->': {
                            "light_blue (light_blue)": {
                                "<-has_hypothesis-": "blue_rule (blue_rule)"
                            }
                        }
                    }
                },
                '-has_conclusion->': {
                    'unknown_001': {
                        '-attr->': {
                            "blue (blue)": {
                                "<-has_conclusion-": "blue_rule (blue_rule)"
                            }
                        }
                    }
                }

            }
        })
        // Argument: sky is blue
        const args: ConceptGraph = ConceptGraph.fromModel({
            'sky (sky)': {
                '-attr->': 'light_blue (light_blue)'
            }
        })

        const result: ConceptGraph = await ruleService.appyRule(rule, args)


        // console.log(JSON.stringify(result.toJSON(), null, 2))
        console.log('\n\nTest Result')
        console.log('\tTransformed From:')
        console.log('\t\t', args.nodes())
        console.log('\t\t', args.edges())
        console.log('\tTo:')
        console.log('\t\t', result.nodes())
        console.log('\t\t', result.edges())


    })

})