import {Monster, StatKey} from "./monster";

export class Action {
    id: string;
    name: string;
    diceCount: number;
    diceSides: number;
    modifier: number;
    statKey: StatKey;
    cooldown: number | null;
    hitModifier: number;


    constructor(id: string, name: string, diceCount: number, diceSides: number,  modifier: number, statKey: StatKey,
                cooldown: number | null = null, hitModifier: number = 0) {
        this.id = id;
        this.name = name;
        this.diceCount = diceCount;
        this.diceSides = diceSides;
        this.modifier = modifier;
        this.statKey = statKey;
        this.hitModifier = hitModifier;
        this.cooldown = cooldown;
    }

    toShowString() {
        console.log(`${this.name} ${this.statKey}`);
        const modifierString = this.modifier > 0 ? ` + ${this.modifier}` : ""
        return `${this.name} : ${this.diceCount}d${this.diceSides} + ${this.statKey}${modifierString}`;
    }

    hit(monster: Monster) {
        const d20 = Math.floor(Math.random() * 20) + 1;
        if (d20 === 20){
            return "20";
        }

        if (d20 === 1){
            return "1";
        }

        const statBonus = monster.getModifier(this.statKey);
        return d20 + statBonus + this.hitModifier;
    }

    roll(monster: Monster): number {
        const statBonus = monster.getModifier(this.statKey);
        let total = this.modifier + statBonus;

        for (let i = 0; i < this.diceCount; i++) {
            total += Math.floor(Math.random() * this.diceSides) + 1;
        }

        return total;
    }
}
