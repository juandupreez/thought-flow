import { ThinkR } from "../../../main/ThinkR"
import { instance, mock } from 'ts-mockito'
import { DummyKb, DummyKbDb } from "../../_testutil/DummyKb"
import Graph from 'graphology'
import { ConceptGraph } from "../../../main/concepts/ConceptGraph"
import { OpGraph } from "../../main/ops/OpGraph"
import { Concept } from "../../../main/model/Concept"
import { Attributes, NodePredicate } from "graphology-types"
import { RelationType } from "../../main/model/RelationType"

global.console = require('console')

describe('Question Answering', () => {
    let thinkR: ThinkR

    beforeEach(() => {

        const kb: DummyKbDb = {
            conceptGraph: new ConceptGraph(),
            opGraph: new OpGraph()
        }

        // The sky is blue
        kb.conceptGraph.addNode('kb_1', { description: 'sky' })
        kb.conceptGraph.addNode('kb_2', { description: 'blue' })
        kb.conceptGraph.addEdge('kb_1', 'kb_2', { type: RelationType.ATTR })

        kb.conceptGraph.addNode('kb_3', { description: 'sky-is-blue' })
        kb.conceptGraph.addEdge('kb_3', 'kb_1', { type: RelationType.DEFINED_BY })
        kb.conceptGraph.addEdge('kb_3', 'kb_2', { type: RelationType.DEFINED_BY })

        // Blue is a colour
        kb.conceptGraph.addNode('kb_4', { description: 'colour' })
        kb.conceptGraph.addEdge('kb_2', 'kb_4', { type: RelationType.IS_A })

        kb.conceptGraph.addNode('kb_5', { description: 'blue-is-a-colour' })
        kb.conceptGraph.addEdge('kb_5', 'kb_2', { type: RelationType.DEFINED_BY })
        kb.conceptGraph.addEdge('kb_5', 'kb_4', { type: RelationType.DEFINED_BY })


        const dummyKb: KnowledgeBase = new DummyKb(kb)

        thinkR = new ThinkR(dummyKb)
    })

    it('should answer simple question', async () => {
        const questionConcept: ConceptGraph = new ConceptGraph()

        // What coulour is the sky?
        questionConcept.addNode(1, { description: 'specific-unkown' })
        questionConcept.addNode(2, { description: 'colour', refId: 'kb_4' })
        questionConcept.addNode(3, { description: 'sky', refId: 'kb_1'  })
        questionConcept.addEdge(1, 2, { type: RelationType.IS_A })
        questionConcept.addEdge(3, 1, { type: RelationType.ATTR })
        questionConcept.addNode(4, { description: 'what-color-is-the-sky' })
        questionConcept.addEdge(4, 1, { type: RelationType.DEFINED_BY })
        questionConcept.addEdge(4, 2, { type: RelationType.DEFINED_BY })
        questionConcept.addEdge(4, 3, { type: RelationType.DEFINED_BY })

        // const questionAnswerProgramStartOp: Op = new HaltOp()
        // const answerConceptGraph: ConceptGraph = await thinkR.runProgram(questionAnswerProgramStartOp, [questionConcept])
        const answerConceptGraph: ConceptGraph = await thinkR.runCustomAnswerQuestionProgram(questionConcept)

        console.log(answerConceptGraph)
        // console.log('finding node')
        // const predicate: NodePredicate<Concept> = (node: string, attributes: Concept) => {
        //     return attributes.description === 'colour'
        // }

        // const id: string | undefined = answerConceptGraph.findNode(predicate)
        // console.log('found node with ID : ' + id)
        // console.log('found node: ' + JSON.stringify(answerConceptGraph.getNodeAttributes(id), null, 2))
    })

})