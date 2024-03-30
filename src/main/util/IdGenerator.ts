export class IdGenerator {

    static instance: IdGenerator
    id: number = 1;

    static getInstance (): IdGenerator {
        if (!this.instance) {
            this.instance = new IdGenerator()
        }
        return this.instance
    }

    getNextUniqueId (): string {
        const curConceptTypeId: number = this.id++
        return curConceptTypeId.toString()
    }

}

export function genId (): string {
    return IdGenerator.getInstance().getNextUniqueId()
}