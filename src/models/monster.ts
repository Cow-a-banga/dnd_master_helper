export type StatKey = "Сила" | "Телосложение" | "Ловкость" | "Интеллект" | "Мудрость" | "Харизма";

export class Monster {
    id: string;
    name: string;
    actionIds: string[];
    stats: Record<StatKey, number>;

    constructor(id: string, name: string, stats: Record<string, number>, actionIds: string[] = []) {
        this.id = id;
        this.name = name;
        this.stats = stats;
        this.actionIds = actionIds;
    }

    getModifier(statKey: StatKey) {
        return Math.floor((this.stats[statKey] - 10) / 2);
    }

    toShowString() {
        return `${this.name} - СИЛ: ${this.stats['Сила']} ТЕЛ: ${this.stats['Телосложение']} ЛОВ: ${this.stats['Ловкость']} ИНТ: ${this.stats['Интеллект']} МУД: ${this.stats['Мудрость']} ХАР: ${this.stats['Харизма']}`;
    }
}
