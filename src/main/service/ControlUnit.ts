import { ConceptGraph } from "../core/ConceptGraph"
import { ConceptGraphDao } from "../dao/ConceptGraphDao"
import { InMemoryConceptGraphDao } from "../dao/in-memory/InMemoryConceptGraphDao"
import { Concept } from "../model/Concept"
import { ConceptGraphModel } from "../model/ConceptGraphModel"
import { Operation } from "../operations/Operation"
import { ApplyRuleOp } from "../operations/impl/ApplyRuleOp"
import { ApplyTemplateRuleOp } from "../operations/impl/ApplyTemplateRuleOp"
import { ErrorOp } from "../operations/impl/ErrorOp"
import { FetchOp } from "../operations/impl/FetchOp"
import { HaltOp } from "../operations/impl/HaltOp"
import { NoOp } from "../operations/impl/NoOp"
import { PrintConceptsOp } from "../operations/impl/PrintConceptsOp"
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

    async run(procedure: ConceptGraph): Promise<void> {
        const workingMemory: ConceptGraph = new ConceptGraph()
        const maxIterations: number = 10
        let i = 0

        let curOperationConceptId: string | null = null
        let decodedOperation: Operation | null = null
        let haltDetected: boolean = false

        while (!haltDetected) {
            if (i >= maxIterations) {
                throw new Error('Max iterations reached: ' + maxIterations)
            }

            curOperationConceptId = await this._fetchNextOperation(curOperationConceptId, procedure, workingMemory)
            glog().info(curOperationConceptId)
            decodedOperation = await this._decodeOperation(curOperationConceptId, procedure)
            if (decodedOperation instanceof HaltOp) {
                haltDetected = true
            }
            if (decodedOperation instanceof ErrorOp) {
                throw new Error((decodedOperation as ErrorOp).errorCg.toStringifiedModel())
            }
            const errorCg: ConceptGraph = await this._execute(decodedOperation, curOperationConceptId, procedure, workingMemory)
            if (!errorCg.isEmpty()) {
                throw new Error(errorCg.toStringifiedModel())
            }

            i++
        }

    }

    private async _fetchNextOperation(curOperationConceptId: string | null, procedure: ConceptGraph, workingMemory: ConceptGraph): Promise<string> {

        const conceptIds: string[] = []

        if (curOperationConceptId == null) {
            const firstItemRule: ConceptGraph = await this.conceptGraphDao.getRuleByName('rule_get_first_sequence_item')
            glog().debug('---First Item Rule')
            glog().debug(firstItemRule.toStringifiedModel())
            const firstOp: ConceptGraph = await this.ruleService.applyRuleToFirstMatch(firstItemRule, procedure)
            glog().debug('---Op')
            glog().debug(firstOp.toStringifiedModel())
            conceptIds.push(...firstOp.getConceptIds())
        } else {
            const nextItemTemplateRule: ConceptGraph = await this.conceptGraphDao.getRuleByName('template_rule_create_next_sequence_item_rule')
            glog().debug('---Next Item Template Rule')
            glog().debug(nextItemTemplateRule.toStringifiedModel())
            const curOpCgModel: ConceptGraphModel = {}
            curOpCgModel[curOperationConceptId] = {}
            const nextItemRule: ConceptGraph = await this.ruleService.applyRuleToFirstMatch(nextItemTemplateRule, ConceptGraph.fromModel(curOpCgModel))
            glog().debug('---Next Item Template Rule')
            glog().debug(nextItemRule.toStringifiedModel())
            const nextOp: ConceptGraph = await this.ruleService.applyRuleToFirstMatch(nextItemRule, procedure)
            glog().debug('---Op')
            glog().debug(nextOp.toStringifiedModel())
            conceptIds.push(...nextOp.getConceptIds())
        }
        if (conceptIds.length == 0) {
            throw new Error('Could not find first operation in procedure')
        } else if (conceptIds.length == 1) {
            return conceptIds[0]
        } else {
            throw new Error('Rule contains too many concept IDs: ' + JSON.stringify(conceptIds))
        }
    }

    private async _decodeOperation(opConceptId: string, procedure: ConceptGraph): Promise<Operation> {
        const operationTypeTemplateRule: ConceptGraph = await this.conceptGraphDao.getRuleByName('template_rule_get_operation_type')
        const curOpCgModel: ConceptGraphModel = {}
        curOpCgModel[opConceptId] = {}
        const operationTypeRule: ConceptGraph = await this.ruleService.applyRuleToFirstMatch(operationTypeTemplateRule, ConceptGraph.fromModel(curOpCgModel))
        const operationType: ConceptGraph = await this.ruleService.applyRuleToFirstMatch(operationTypeRule, procedure)
        
        const potentialOperationTypes: string[] = operationType.getConceptIds()
        if (potentialOperationTypes.length == 0) {
            return new ErrorOp(ConceptGraph.fromModel({
                'cannot_decode_op_error': {
                    '-instance_of->': 'error',
                    '-has_message->': `Could not operation type of ${opConceptId}: operation is not instance of anything`
                }
            }))
        } else {
            switch (potentialOperationTypes[0]) {
                case 'HaltOp':
                    return new HaltOp()
                case 'FetchOp':
                    return new FetchOp()
                case 'ApplyRuleOp':
                    return new ApplyRuleOp()
                case 'ApplyTemplateRuleOp':
                    return new ApplyTemplateRuleOp()
                case 'PrintConceptsOp':
                    return new PrintConceptsOp()
                default:
                    return new ErrorOp(ConceptGraph.fromModel({
                        'cannot_decode_op_error': {
                            '-instance_of->': 'error',
                            '-has_message->': `Could not operation type of ${opConceptId}: instance of an unknown operation type ${potentialOperationTypes[0]}`
                        }
                    }))
            }
        }
    }

    private async _execute(op: Operation, curOperationConceptId: string, procedure: ConceptGraph, workingMemory: ConceptGraph): Promise<ConceptGraph> {
        const args: ConceptGraph = procedure.getConceptDefinitionByRelationType(curOperationConceptId, 'has_args')
        return op.execute(args, workingMemory, this.conceptGraphDao)
    }

}