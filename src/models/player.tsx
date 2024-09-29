export class Player {
    id: string;
    name: string;
    armorClass: number;

    constructor(id: string, name: string, armorClass:number) {
        this.id = id;
        this.name = name;
        this.armorClass = armorClass;
    }

    toShowString() {
        return `${this.name} - КД: ${this.armorClass}`;
    }
}
