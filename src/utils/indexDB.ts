import { openDB } from 'idb';

// Инициализация базы данных
const initDB = async () => {
    return openDB('combatDB', 1, {
        upgrade(db) {
            db.createObjectStore('combatState', { keyPath: 'id' });
        },
    });
};

// Функция сохранения состояния
export const saveCombatState = async (state: object) => {
    const db = await initDB();
    await db.put('combatState', { id: 'currentCombat', ...state });
};

// Функция загрузки состояния
export const loadCombatState = async () => {
    const db = await initDB();
    return await db.get('combatState', 'currentCombat');
};
