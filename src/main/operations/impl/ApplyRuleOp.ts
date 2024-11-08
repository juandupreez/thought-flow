import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { RuleService } from "../../service/RuleService";
import { glog } from "../../util/Logger";
import { Operation } from "../Operation";

export class ApplyRuleOp implements Operation {

    private readonly ruleService: RuleService = new RuleService()

    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<ConceptGraph> {
        const potentialError: ConceptGraph = args.checkConceptIdDefinitions('apply_rule_op_error', [
            'apply_rule_op_arg-source_slot',
            'apply_rule_op_arg-result_slot'
        ])
        if (!potentialError.isEmpty()) {
            return potentialError
        }

        const ruleNameConceptId: string = args.getConceptDefinition('apply_rule_op_arg-rule_name').getConceptIds()[0]
        const ruleSlotConceptId: string = args.getConceptDefinition('apply_rule_op_arg-rule_slot').getConceptIds()[0]
        const sourceSlotConceptId: string = args.getConceptDefinition('apply_rule_op_arg-source_slot').getConceptIds()[0]
        const resultSlotConceptId: string = args.getConceptDefinition('apply_rule_op_arg-result_slot').getConceptIds()[0]
        glog().info('\trule name to apply: ' + ruleNameConceptId)
        glog().info('\trule slot to apply: ' + ruleSlotConceptId)
        glog().info('\tsource slot:  ' + sourceSlotConceptId)
        glog().info('\tresult slot:  ' + resultSlotConceptId)

        if (ruleNameConceptId === undefined && ruleSlotConceptId === undefined) {
            return ConceptGraph.fromModel({
                'apply_rule_op_error': {
                    '-instance_of->': 'error',
                    '-has_message->': `Required either one of "apply_rule_op_arg-rule_name" or "apply_rule_op_arg-rule_slot"`
                }
            })
        }
        let ruleToApply: ConceptGraph = await conceptGraphDao.getRuleByName(ruleNameConceptId)
        if (ruleToApply.isEmpty()) {
            let ruleToApply: ConceptGraph = workingMemory.getConceptDefinition(ruleSlotConceptId, true)
            if (ruleToApply.isEmpty()) {
                return ConceptGraph.fromModel({
                    'apply_rule_op_error': {
                        '-instance_of->': 'error',
                        '-has_message->': `Could not find rule from ${ruleNameConceptId ?? ruleSlotConceptId}`
                    }
                })
            }
        }
        const sourceSlotContents: ConceptGraph = workingMemory.getConceptDefinition(sourceSlotConceptId)
        const ruleResult: ConceptGraph = await this.ruleService.applyRuleToAllMatches(ruleToApply, sourceSlotContents)


        glog().info('\tapplied rule. result: ' + ruleResult.toStringifiedModel())

        workingMemory.forceDeleteConceptAndRelations(resultSlotConceptId)
        ruleResult.wrapAsDefinitionOf(resultSlotConceptId)
        workingMemory.mergeFrom(ruleResult)

        return new ConceptGraph()
    }

}