import { Concept } from "../model/Concept"

export function parseConceptIdAndIsUnknown (conceptIdAndRefIdStr: string): { conceptId: string, refId: string | undefined } {
    const str1: string = conceptIdAndRefIdStr
    const refIdMatches: RegExpMatchArray | null = conceptIdAndRefIdStr.match(/\(.*\)/g)
    if (refIdMatches === null) {
        return {
            conceptId: str1.replaceAll(/\(.*\)/g, '').trim(),
            refId: undefined
        }
    } else {
        return {
            conceptId: str1.replaceAll(/\(.*\)/g, '').trim(),
            refId: refIdMatches[0].replaceAll('(', '').replaceAll(')', '').trim()
        }
    }
}

export function isConceptUnknown(concept: Concept): boolean {
    return concept.isUnknown ?? false
}