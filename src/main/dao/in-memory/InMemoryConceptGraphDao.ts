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
        const foundRule: ConceptGraph = new ConceptGraph()

        const ruleStructureModel: ConceptGraphModel = {}
        ruleStructureModel[ruleName] = {
            '-has_hypothesis->': '?unknown_hypothesis',
            '-has_mapping->': '?unknown_mapping',
            '-has_conclusion->': '?unknown_conclusion'
        }
        const ruleStructure: ConceptGraph = ConceptGraph.fromModel(ruleStructureModel)

        const potentialRule: ConceptGraph = this.conceptMatchService.getAndMergeMatches(ruleStructure, this.conceptGraphDb)

        foundRule.mergeFrom(potentialRule)
        const potentialHypothesis: ConceptGraph = this.conceptGraphDb.getConceptDefinitionByRelationType(ruleName, 'has_hypothesis', true)
        foundRule.mergeFrom(potentialHypothesis)
        const potentialMapping: ConceptGraph = this.conceptGraphDb.getConceptDefinitionByRelationType(ruleName, 'has_mapping', true)
        foundRule.mergeFrom(potentialMapping)
        const potentialConclusion: ConceptGraph = this.conceptGraphDb.getConceptDefinitionByRelationType(ruleName, 'has_conclusion', true)
        foundRule.mergeFrom(potentialConclusion)

        return foundRule
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