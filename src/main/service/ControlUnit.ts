import { ConceptGraph } from "../core/ConceptGraph"
import { ConceptGraphDao } from "../dao/ConceptGraphDao"
import { InMemoryConceptGraphDao } from "../dao/in-memory/InMemoryConceptGraphDao"
import { Operation } from "../operations/Operation"
import { HaltOp } from "../operations/impl/HaltOp"
import { NoOp } from "../operations/impl/NoOp"
import { glog } from "../util/Logger"
import { ConceptMatchService } from "./ConceptMatchService"
import { RuleService } from "./RuleService"

export class ControlUnit {
    private readonly conceptGraphDao: ConceptGraphDao
    private readonly conceptMatchService: ConceptMatchService = new ConceptMatchService()
    private readonly ruleService: RuleService = new RuleService()

    constructor(conceptGraphDao: ConceptGraphDao) {
        this.conceptGraphDao = conceptGraphDao
    }

    async run(procedure: ConceptGraph): Promise<ConceptGraph> {
        const workingMemory: ConceptGraph = new ConceptGraph()
        const maxIterations: number = 10
        let i = 0

        let curOperationCg: ConceptGraph | null = null
        // let decodedOperation: Operation | null = null
        // let runningResult: ConceptGraph | null = null

        while (true) {
            if (i >= maxIterations) {
                throw new Error('Max iterations reached: ' + maxIterations)
            }

            curOperationCg = await this._fetchNextOperation(curOperationCg, procedure, workingMemory)
            glog().info(curOperationCg.toStringifiedModel())
            // decodedOperation = await this._decode(curOperation)
            // runningResult = await this._execute(decodedOperation, runningResult)

            // if (runningResult.isEmpty()) {
            //     return runningResult
            // }

            i++
        }

    }

    private async _fetchNextOperation(curOperationCg: ConceptGraph | null, procedure: ConceptGraph, workingMemory: ConceptGraph): Promise<ConceptGraph> {

        if (curOperationCg == null) {
            const firstItemRule: ConceptGraph = await this.conceptGraphDao.getRuleByName('rule_get_first_sequence_item')
            glog().debug('---First Item Rule')
            glog().debug(firstItemRule.toStringifiedModel())
            const firstOp: ConceptGraph = await this.ruleService.applyRuleToFirstMatch(firstItemRule, procedure)
            glog().debug('---Op')
            glog().debug(firstOp.toStringifiedModel())
            return firstOp
        } else {
            const nextItemTemplateRule: ConceptGraph = await this.conceptGraphDao.getRuleByName('template_rule_create_next_sequence_item_rule')
            glog().debug('---Next Item Template Rule')
            glog().debug(nextItemTemplateRule.toStringifiedModel())
            const nextItemRule: ConceptGraph = await this.ruleService.applyRuleToFirstMatch(nextItemTemplateRule, curOperationCg)
            glog().debug('---Next Item Template Rule')
            glog().debug(nextItemRule.toStringifiedModel())
            const nextOp: ConceptGraph = await this.ruleService.applyRuleToFirstMatch(nextItemRule, procedure)
            glog().debug('---Op')
            glog().debug(nextOp.toStringifiedModel())
            return nextOp
        }
    }

    private async _decode(op: ConceptGraph): Promise<Operation> {
        return new HaltOp()
    }

    private async _execute(op: Operation, args: ConceptGraph): Promise<ConceptGraph> {
        return op.execute(args)
    }

}