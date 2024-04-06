import { Concept } from "../model/Concept"

export function parseConceptKeyAndRefId (conceptKeyAndRefIdStr: string): { conceptKey: string, refId: string | undefined } {
    const str1: string = conceptKeyAndRefIdStr
    const refIdMatches: RegExpMatchArray | null = conceptKeyAndRefIdStr.match(/\(.*\)/g)
    if (refIdMatches === null) {
        return {
            conceptKey: str1.replaceAll(/\(.*\)/g, '').trim(),
            refId: undefined
        }
    } else {
        return {
            conceptKey: str1.replaceAll(/\(.*\)/g, '').trim(),
            refId: refIdMatches[0].replaceAll('(', '').replaceAll(')', '').trim()
        }
    }
}

export function isConceptUnknown(concept: Concept): boolean {
    return concept.isUnknown ?? false
}