import Graph from "graphology";
import { ConceptGraph } from "../../core/ConceptGraph";
import { ConceptGraphModel } from "../../model/ConceptGraphModel";
import { ConceptMatchService } from "../../service/ConceptMatchService";
import { RuleService } from "../../service/RuleService";
import { ConceptGraphDao, SimpleRelation } from "../ConceptGraphDao";

export class InMemoryConceptGraphDao implements ConceptGraphDao {

    private readonly conceptGraphDb: ConceptGraph = new ConceptGraph()
    private readonly conceptMatchService: ConceptMatchService = new ConceptMatchService()
    private readonly ruleService: RuleService = new RuleService()

    async findAndMergeMatches(query: ConceptGraph): Promise<ConceptGraph> {
        return this.conceptMatchService.getAndMergeMatches(query, this.conceptGraphDb)
    }

    async createConceptGraphModel(cgModel: ConceptGraphModel): Promise<void> {
        this.conceptGraphDb.mergeFrom(ConceptGraph.fromModel(cgModel))
    }

    async getRuleByName(ruleName: string): Promise<ConceptGraph> {
        const potentialRule: ConceptGraph = this.conceptGraphDb.getConceptDefinition(ruleName, true)
        const ruleInstanceConceptIds: string[] = this.conceptGraphDb.getConceptDefinitionByRelationType(ruleName, 'instance_of').getConceptIds()
        if (ruleInstanceConceptIds.includes('rule')) {
            return potentialRule.mergeFrom(ConceptGraph.fromModel({
                'rule': {
                    '<-instance_of-': ruleName
                }
            }))
        } else {
            return new ConceptGraph()
        }
    }

    async createConceptIfNotExists(conceptId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async createConcept(conceptId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async createRelationIfNotExists(simpleRelation: SimpleRelation): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async createRelation(simpleRelation: SimpleRelation): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getConceptByKey(key: string): Promise<ConceptGraph> {
        throw new Error("Method not implemented.");
    }

    async deleteAllData(): Promise<void> {
        throw new Error("Method not implemented.");
    }

}