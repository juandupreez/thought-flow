import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { RuleService } from "../../service/RuleService";
import { glog } from "../../util/Logger";
import { Operation } from "../Operation";

export class ApplyTemplateRuleOp implements Operation {

    private readonly ruleService: RuleService = new RuleService()

    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<ConceptGraph> {
        const potentialError: ConceptGraph = args.checkConceptIdDefinitions('apply_template_rule_op_error', [
            'apply_template_rule_op_arg-template_rule_name',
            'apply_template_rule_op_arg-template_rule_source_slot',
            'apply_template_rule_op_arg-rule_source_slot',
            'apply_template_rule_op_arg-result_slot'
        ])
        if (!potentialError.isEmpty()) {
            return potentialError
        }

        const templateRuleNameConceptId: string = args.getConceptDefinition('apply_template_rule_op_arg-template_rule_name').getConceptIds()[0]
        const templateRuleSourceSlotConceptId: string = args.getConceptDefinition('apply_template_rule_op_arg-template_rule_source_slot').getConceptIds()[0]
        const ruleSourceSlotConceptId: string = args.getConceptDefinition('apply_template_rule_op_arg-rule_source_slot').getConceptIds()[0]
        const resultSlotConceptId: string = args.getConceptDefinition('apply_template_rule_op_arg-result_slot').getConceptIds()[0]
        glog().info('\ttemplate rule name to apply: ' + templateRuleNameConceptId)
        glog().info('\ttemplate rule source slot:  ' + templateRuleSourceSlotConceptId)
        glog().info('\trule source slot:  ' + ruleSourceSlotConceptId)
        glog().info('\tresult slot:  ' + resultSlotConceptId)

        let templateRuleToApply: ConceptGraph = await conceptGraphDao.getRuleByName(templateRuleNameConceptId)
        if (templateRuleToApply.isEmpty()) {
            return ConceptGraph.fromModel({
                'apply_template_rule_op_error': {
                    '-instance_of->': 'error',
                    '-has_message->': `Could not find template rule from ${templateRuleNameConceptId}`
                }
            })
        }
        const templateRuleSourceSlotContents: ConceptGraph = workingMemory.getConceptDefinition(templateRuleSourceSlotConceptId)
        const ruleToApply: ConceptGraph = await this.ruleService.applyRuleToAllMatches(templateRuleToApply, templateRuleSourceSlotContents)
        if (ruleToApply.isEmpty()) {
            glog().debug(templateRuleSourceSlotContents.toStringifiedModel())
            return ConceptGraph.fromModel({
                'apply_template_rule_op_error': {
                    '-instance_of->': 'error',
                    '-has_message->': `template produced an empty rule`
                }
            })
        }
        glog().info('\tcreated rule to apply')
        const ruleSourceSlotContents: ConceptGraph = workingMemory.getConceptDefinition(ruleSourceSlotConceptId)
        const ruleResult: ConceptGraph = await this.ruleService.applyRuleToAllMatches(ruleToApply, ruleSourceSlotContents)


        glog().info('\tapplied rule. result: ' + ruleResult.toStringifiedModel())

        workingMemory.forceDeleteConceptAndRelations(resultSlotConceptId)
        ruleResult.wrapAsDefinitionOf(resultSlotConceptId)
        workingMemory.mergeFrom(ruleToApply)

        return new ConceptGraph()
    }

}