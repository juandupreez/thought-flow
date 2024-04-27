import { EagerResult } from "neo4j-driver-core"
import { Neo4JAdapter } from "./Neo4JAdapter"
import { glog } from "../../util/Logger"
import { ConceptGraphModel } from "../../model/ConceptGraphModel"
import { ConceptGraph } from "../../core/ConceptGraph"

interface SimpleRelation {
    fromConceptId: string
    toConceptId: string
    relationType: string
}

export class Neo4JConceptGraphDao {
    private readonly neo4JAdapter: Neo4JAdapter

    constructor (neo4JAdapter: Neo4JAdapter) {
        this.neo4JAdapter = neo4JAdapter
    }

    async createConceptGraphModel (cgModel: ConceptGraphModel) {
        const singleConcepts: string[] = this._recursivelyGetObjectKeys(cgModel)
        glog().debug('All Concepts to create:', singleConcepts)
        for (const singleConcept of singleConcepts) {
            await this.createConceptIfNotExists(singleConcept)
        }

        const singleRelations: SimpleRelation[] = this._recursivelyGetRelations(cgModel)
        glog().debug('All Relations to create:', JSON.stringify(singleRelations, null, 2))
        for (const singleRelation of singleRelations) {
            await this.createRelationIfNotExists(singleRelation)
        }

    }

    private _recursivelyGetObjectKeys (cgModel: ConceptGraphModel): string[] {
        const conceptIds: string[] = []

        for (const conceptId in cgModel) {
            conceptIds.push(conceptId)
            if (Object.prototype.hasOwnProperty.call(cgModel, conceptId)) {
                const relation: {
                    [relationKey: `-${string}->` | `<-${string}-`]: string | ConceptGraphModel
                } = cgModel[conceptId]
                for (const relationId in relation) {
                    const relationIdWithoutArrows: string = relationId[0] === '-' ?
                        relationId.slice(1, relationId.length - 2).split(' ').join('_')
                        :
                        relationId.slice(2, relationId.length - 1).split(' ').join('_')

                    conceptIds.push(relationIdWithoutArrows)
                    if (Object.prototype.hasOwnProperty.call(relation, relationId)) {
                        const relatedConcept: string | ConceptGraphModel = relation[(relationId as `-${string}->` | `<-${string}-`)]
                        if (typeof relatedConcept === 'string') {
                            conceptIds.push(relatedConcept)
                        } else {
                            conceptIds.push(...this._recursivelyGetObjectKeys(relatedConcept))
                        }
                    }
                }
            }
        }

        return conceptIds
    }

    private _recursivelyGetRelations (cgModel: ConceptGraphModel): SimpleRelation[] {
        const relations: SimpleRelation[] = []

        for (const conceptId in cgModel) {
            if (Object.prototype.hasOwnProperty.call(cgModel, conceptId)) {
                const relation: {
                    [relationKey: `-${string}->` | `<-${string}-`]: string | ConceptGraphModel
                } = cgModel[conceptId]
                for (const relationId in relation) {
                    let relationIdWithoutArrows: string
                    let relationDirection: 'from-to' | 'to-from'
                    if (relationId[0] === '-') { // x-relation->y
                        relationIdWithoutArrows = relationId.slice(1, relationId.length - 2).split(' ').join('_')
                        relationDirection = 'from-to'
                    } else { //x<-relation-y
                        relationIdWithoutArrows = relationId.slice(2, relationId.length - 1).split(' ').join('_')
                        relationDirection = 'to-from'
                    }


                    if (Object.prototype.hasOwnProperty.call(relation, relationId)) {
                        const relatedConceptOrId: string | ConceptGraphModel = relation[(relationId as `-${string}->` | `<-${string}-`)]
                        if (typeof relatedConceptOrId === 'string') {
                            if (relationDirection === 'from-to') {
                                relations.push({
                                    fromConceptId: conceptId,
                                    toConceptId: relatedConceptOrId,
                                    relationType: relationIdWithoutArrows
                                })
                            } else {
                                relations.push({
                                    fromConceptId: relatedConceptOrId,
                                    toConceptId: conceptId,
                                    relationType: relationIdWithoutArrows
                                })
                            }
                        } else {
                            for (const relatedConceptId of Object.keys(relatedConceptOrId)) {
                                if (relationDirection === 'from-to') {
                                    relations.push({
                                        fromConceptId: conceptId,
                                        toConceptId: relatedConceptId,
                                        relationType: relationIdWithoutArrows
                                    })
                                } else {
                                    relations.push({
                                        fromConceptId: relatedConceptId,
                                        toConceptId: conceptId,
                                        relationType: relationIdWithoutArrows
                                    })
                                }
                            }
                            relations.push(...this._recursivelyGetRelations(relatedConceptOrId))
                        }
                    }
                }
            }
        }

        return relations
    }

    async createConceptIfNotExists (conceptId: string) {
        const result: EagerResult = await this.neo4JAdapter.execute(`
            MATCH (n: Concept) 
            WHERE n.key = $key 
            RETURN n
        `, { key: conceptId })
        const doesConceptExist: boolean = result.records.length !== 0

        if (!doesConceptExist) {
            await this.createConcept(conceptId)
        }
    }

    async createConcept (conceptId: string) {
        const result: EagerResult = await this.neo4JAdapter.execute(`
            CREATE (n: Concept {key: $key, description: $key})
        `, { key: conceptId })

    }

    async createRelationIfNotExists (simpleRelation: SimpleRelation) {
        const result: EagerResult = await this.neo4JAdapter.execute(`
            MATCH (n: Concept)-[r:${simpleRelation.relationType}]->(c:Concept) 
            WHERE n.key = $fromConceptId 
                AND c.key = $toConceptId 
            RETURN r
        `, {
            fromConceptId: simpleRelation.fromConceptId,
            toConceptId: simpleRelation.toConceptId
        })
        const doesConceptExist: boolean = result.records.length !== 0

        if (!doesConceptExist) {
            await this.createRelation(simpleRelation)
        }
    }

    async createRelation (simpleRelation: SimpleRelation) {
        const relationKey: string = `${simpleRelation.fromConceptId}-${simpleRelation.relationType}->${simpleRelation.toConceptId}`
        const result: EagerResult = await this.neo4JAdapter.execute(`
            MATCH (cfrom:Concept) 
            WHERE cfrom.key = $fromConceptId
            MATCH (cto:Concept) 
            WHERE cto.key = $toConceptId
            CREATE (cfrom)-[:${simpleRelation.relationType} {key: $relationKey}]->(cto)

        `, {
            relationKey: relationKey,
            // relationType: simpleRelation.relationType,
            fromConceptId: simpleRelation.fromConceptId,
            toConceptId: simpleRelation.toConceptId
        })
    }

    async getConceptByKey (key: string): Promise<ConceptGraph> {
        const foundConcept: ConceptGraph = new ConceptGraph()
        const result: EagerResult = await this.neo4JAdapter.execute(`
            MATCH (n: Concept) WHERE n.key = $key RETURN n
        `, {
            key: key
        })
        result.records.forEach((record) => {
            record.forEach((value: any, key: PropertyKey, record) => {
                foundConcept.addConcept({
                    description: value.properties.description,
                    isUnknown: value.properties.isUnknown
                })
            })
        })
        return foundConcept
    }

    async deleteAllData () {
        const result1: EagerResult = await this.neo4JAdapter.execute(`
            MATCH (n)-[r]->(m) DELETE r, n, m
        `)
        const result2: EagerResult = await this.neo4JAdapter.execute(`
            MATCH (n) DELETE n
        `)
    }
}