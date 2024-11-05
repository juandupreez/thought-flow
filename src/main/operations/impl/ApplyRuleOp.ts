import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphDao } from "../../dao/ConceptGraphDao";
import { RuleService } from "../../service/RuleService";
import { glog } from "../../util/Logger";
import { Operation } from "../Operation";

export class ApplyRuleOp implements Operation {

    private readonly ruleService: RuleService = new RuleService()

    async execute(args: ConceptGraph, workingMemory: ConceptGraph, conceptGraphDao: ConceptGraphDao): Promise<void>{
        const potentialRuleNames: string[] = args.getConceptIds()
        if (potentialRuleNames.length === 0) {
            throw new Error('cannot find rule from args: ' + args.toStringifiedModel())
        } else {
            glog().info('\trule to apply ' + potentialRuleNames[0])
            const ruleToApply: ConceptGraph = await conceptGraphDao.getRuleByName(potentialRuleNames[0])
            workingMemory.mergeFrom(await this.ruleService.applyRuleToAllMatches(ruleToApply, workingMemory))
            glog().info('\tApplied rule. result: ' + workingMemory.toStringifiedModel())
        }
    }

}