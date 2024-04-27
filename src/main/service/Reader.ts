import { ConceptGraph } from "../core/ConceptGraph"
import { Neo4JConceptGraphDao } from "../dao/neo4j/Neo4JConceptGraphDao"

export class Reader {
    private readonly conceptGraphDao: Neo4JConceptGraphDao

    constructor (conceptGraphDao: Neo4JConceptGraphDao) {
        this.conceptGraphDao = conceptGraphDao
    }

    async readSingleWord (wordText: string): Promise<ConceptGraph> {
        const wordConceptId: string = 'word_' + wordText
        const wordConcept: ConceptGraph = await this.conceptGraphDao.getConceptByKey(wordConceptId)
        // if !unkown
        const bestConceptDefinition: ConceptGraph = await this._getBestWordDefinition(wordConcept)
        return bestConceptDefinition
    }

    private async _getBestWordDefinition (wordConcept: ConceptGraph): Promise<ConceptGraph> {
        const definitionGroup: ConceptGraph = await this._getDefinitionGroup(wordConcept)
        return definitionGroup
    }
    private async _getDefinitionGroup (wordConcept: ConceptGraph): Promise<ConceptGraph> {
        const definitionGroup: ConceptGraph = await this.conceptGraphDao.getConceptByKey('', )
        return definitionGroup
    }

}