export class IdGenerator {

    protected id: number = 1;

    getNextUniqueId (): string {
        const curConceptTypeId: number = this.id++
        return curConceptTypeId.toString()
    }

}

export class IdGeneratorSingleton extends IdGenerator {

    static instance: IdGenerator

    static getInstance (): IdGenerator {
        if (!this.instance) {
            this.instance = new IdGenerator()
        }
        return this.instance
    }

}

export function genId (): string {
    return IdGeneratorSingleton.getInstance().getNextUniqueId()
}