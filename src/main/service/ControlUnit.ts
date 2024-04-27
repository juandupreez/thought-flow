import { ConceptGraph } from "../core/ConceptGraph";
import { InMemoryConceptGraphDao } from "../dao/in-memory/InMemoryConceptGraphDao";
import { Operation } from "../operations/Operation";
import { HaltOp } from "../operations/impl/HaltOp";
import { NoOp } from "../operations/impl/NoOp";
import { ConceptMatchService } from "./ConceptMatchService";
import { RuleService } from "./RuleService";

export class ControlUnit {
    private readonly conceptGraphDao: InMemoryConceptGraphDao;
    private readonly conceptMatchService: ConceptMatchService = new ConceptMatchService();
    private readonly ruleService: RuleService = new RuleService();

    constructor(conceptGraphDao: InMemoryConceptGraphDao) {
        this.conceptGraphDao = conceptGraphDao
    }

    async run(startOperation: ConceptGraph, workingMemory: ConceptGraph): Promise<ConceptGraph> {
        const maxIterations: number = 10
        let i = 1

        let decodedOperation: Operation = await this._decode(startOperation)
        let runningResult: ConceptGraph = await this._execute(decodedOperation, workingMemory)

        while (true) {
            if (i >= maxIterations) {
                throw new Error('Max iterations reached: ' + maxIterations)
            }

            const curOperation: ConceptGraph = await this._fetchNextOperation(decodedOperation)
            decodedOperation = await this._decode(curOperation)
            runningResult = await this._execute(decodedOperation, runningResult)

            if (runningResult.isEmpty()) {
                return runningResult
            }

            i++
        }

    }

    private async _fetchNextOperation(curOperation: Operation): Promise<ConceptGraph> {
        const nextOpRule: ConceptGraph = new ConceptGraph()
        return nextOpRule
    }

    private async _decode(op: ConceptGraph): Promise<Operation> {
        return new HaltOp()
    }

    private async _execute(op: Operation, args: ConceptGraph): Promise<ConceptGraph> {
        return op.execute(args)
    }

}