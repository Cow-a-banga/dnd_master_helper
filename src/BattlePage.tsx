import React, { useEffect, useState } from 'react';
import { Button, List, Modal, Select, Space, Input, Table, message, InputNumber } from 'antd';
import { Monster } from "./models/monster";
import {ACTIONS_KEY, MONSTERS_KEY, PLAYERS_KEY} from "./utils/localStorageKeys";
import {Action} from "./models/action";
import { v4 as uuidv4 } from 'uuid';
import {Player} from "./models/player"; // Импортируем uuid для генерации уникальных ID
import {loadCombatState, saveCombatState } from './utils/indexDB';

const { Column } = Table;

interface CombatCharacter {
    character: Monster | Player,
    initiative: number,
    usedActions: {[k: string]: number},
}

// Функция для расчёта инициативы (d20 + модификатор ловкости)
const rollInitiative = (dexModifier: number) => {
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    return d20Roll + dexModifier;
};

const CombatScreen: React.FC = () => {
    const [allCharacters, setAllCharacters] = useState<Monster[]>([]);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
    const [selectedPlayersIds, setSelectedPlayersIds] = useState<string[]>([]);
    const [combatCharacters, setCombatCharacters] = useState<CombatCharacter[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalPlayerVisible, setIsModalPlayerVisible] = useState(false);
    const [isTargetSelectionVisible, setIsTargetSelectionVisible] = useState(false);
    const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
    const [actions, setActions] = useState<Record<string, Action>>({});
    const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null); // Индекс текущего хода
    const [currentTurn, setCurrentTurn] = useState<number>(0);
    const [log, setLog] = useState<string[]>([]); // Лог действий
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [pendingActionId, setPendingActionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedActions = localStorage.getItem(ACTIONS_KEY);
        if (storedActions) {
            const loadedActions: Action[] = JSON.parse(storedActions);
            const actionsMap = loadedActions.reduce((acc, action) => {
                acc[action.id] = new Action(action.id, action.name, action.diceCount, action.diceSides,
                    action.modifier, action.statKey, action.cooldown, action.hitModifier, action.requiresTarget);
                return acc;
            }, {} as Record<string, Action>);
            setActions(actionsMap);
        }

        const storedPlayers = localStorage.getItem(PLAYERS_KEY);
        if (storedPlayers) {
            const loadedPlayers: Player[] = JSON.parse(storedPlayers);
            setAllPlayers(loadedPlayers.map(x => new Player(x.id, x.name, x.armorClass)));
        }

        loadCombatState().then(state => {
            if (state) {
                const loadedCombatCharacters = state.combatCharacters
                    .map((x: CombatCharacter) => Object.keys(x.character).includes("stats") ?
                        {
                            character: new Monster(x.character.id, x.character.name, (x.character as Monster).stats, (x.character as Monster).actionIds),
                            initiative: x.initiative,
                            usedActions: x.usedActions,
                        } :
                        {
                            character: new Player(x.character.id, x.character.name, (x.character as Player).armorClass),
                            initiative: x.initiative,
                            usedActions: x.usedActions,
                        }
                    );
                setCombatCharacters(loadedCombatCharacters);
                setCurrentTurn(state.currentTurn);
                setLog(state.log);
                setCurrentCharacterId(state.currentCharacterId);
            }
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        const storedCharacters = localStorage.getItem(MONSTERS_KEY);
        if (storedCharacters) {
            const chars = JSON.parse(storedCharacters) as Monster[];
            setAllCharacters(chars.map(x => new Monster(x.id, x.name, x.stats, x.actionIds.filter(a => Object.keys(actions).includes(a)))));
        }
    }, [actions]);

    useEffect(() => {
        if(!isLoading){
            saveCombatState({
                combatCharacters,
                currentTurn,
                log,
                currentCharacterId,
            });
        }
    }, [combatCharacters, currentTurn, log, currentCharacterId, isLoading]);

    const isActionAvailable = (action: Action, lastUsedTurn: number | undefined, currentTurn: number) => {
        return action.cooldown === null || lastUsedTurn === undefined || (currentTurn - lastUsedTurn > action.cooldown);
    }

    const getRemainingTurns = (action: Action, currentTurn: number, lastUsedTurn: number | undefined) => {
        if(action.cooldown !== null && lastUsedTurn !== undefined){
            return action.cooldown - (currentTurn - (lastUsedTurn));
        }
        return 0;
    }

    // Открыть модальное окно
    const showModal = () => {
        setIsModalVisible(true);
    };

    const showModalPlayer = () => {
        setIsModalPlayerVisible(true);
    };

    // Закрыть модальное окно
    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedCharacterIds([]);
    };

    const handleCancelPlayer = () => {
        setIsModalPlayerVisible(false);
        setSelectedPlayersIds([]);
    };

    // Добавить выбранных персонажей в список боя с расчётом инициативы
    const handleOkPlayer = () => {
        const selectedCharacters = allPlayers.filter(character => selectedPlayersIds.includes(character.id));
        const charactersWithInitiative = selectedCharacters.map(character => ({
            character: new Player(uuidv4(), character.name, character.armorClass),
            initiative: 0,
            usedActions: {},
        }));
        setCombatCharacters([...combatCharacters, ...charactersWithInitiative].sort((a, b) => b.initiative - a.initiative));
        handleCancelPlayer();
    };

    const handleOk = () => {
        const selectedCharacters = allCharacters.filter(character => selectedCharacterIds.includes(character.id));
        const charactersWithInitiative = selectedCharacters.map(character => ({
            character: new Monster(uuidv4(), character.name, character.stats, character.actionIds),
            initiative: rollInitiative(character.getModifier("Ловкость")),
            usedActions: {},
        }));
        setCombatCharacters([...combatCharacters, ...charactersWithInitiative].sort((a, b) => b.initiative - a.initiative));
        handleCancel();
    };

    // Изменить имя текущего персонажа
    const handleNameChange = (newName: string) => {
        if (activeCharacterId !== null) {
            const updatedCharacters = [...combatCharacters];
            const found = updatedCharacters.find(x => x.character.id === activeCharacterId);
            if(found){
                found.character.name = newName;
            }
            setCombatCharacters(updatedCharacters);
        }
    };

    // Активировать способность и добавить в лог
    const handleActionClick = (actionId: string) => {
        if (activeCharacterId === currentCharacterId && currentTurn !== 0) {
            const action = actions[actionId];
            if (action.requiresTarget) {
                setPendingActionId(actionId);
                setIsTargetSelectionVisible(true); // Открываем окно выбора цели
            } else {
                executeAction(actionId);
            }
        } else {
            message.warning('Этот персонаж не может использовать способности сейчас!');
        }
    };

    const executeAction = (actionId: string, playerId: string | null = null) => {
        const action = actions[actionId];
        const found1 = combatCharacters.find(x => x.character.id === currentCharacterId);
        if(found1 && found1.character instanceof Monster){

            const lastUsedTurn = found1.usedActions[actionId];

            if (!isActionAvailable(action, lastUsedTurn, currentTurn)) {
                const remainingTurns = getRemainingTurns(action, currentTurn, lastUsedTurn);
                message.warning(`${action.name} ещё ${remainingTurns} ходов на кулдауне!`);
                return;
            }

            const char = found1.character;
            if(!playerId){
                setLog([...log, `${char.name} использовал ${action.name}: ${action.roll(char)}`]);
            }
            else{
                const foundPlayer = combatCharacters.find(x => x.character.id === playerId);
                if(foundPlayer){
                    const player = foundPlayer.character as Player;
                    const hit = action.hit(found1.character);
                    if(hit === "20"){
                        const logs = [
                            `${char.name} использовал ${action.name} на ${player.name} [Попадание]: (20) КРИТИЧЕСКИЙ УСПЕХ`,
                            `${char.name} использовал ${action.name} на ${player.name} [Урон x2]: ${2 * action.roll(char)}`
                        ]
                        setLog([...log, ...logs]);
                    }
                    else if(hit === "1"){
                        setLog([...log, `${char.name} использовал ${action.name} на ${player.name} [Попадание]: (1) КРИТИЧЕСКИЙ ПРОМАХ`]);
                    }else{
                        const hited = hit >= player.armorClass;
                        const logs = [
                            `${char.name} использовал ${action.name} на ${player.name} [Попадание]: ${hit} ${hited ? '' : '(МИМО)'}`,
                        ]
                        if(hited){
                            logs.push(`${char.name} использовал ${action.name} на ${player.name} [Урон]: ${action.roll(char)}`)
                        }
                        setLog([...log, ...logs]);
                    }
                }
            }
            if(action.cooldown !== null){
                const updatedCharacters = [...combatCharacters];
                const found = updatedCharacters.find(x => x.character.id === activeCharacterId);
                if(found){
                    found.usedActions = {...found.usedActions, [actionId]:currentTurn};
                }
                setCombatCharacters(updatedCharacters.sort((a, b) => b.initiative - a.initiative));

            }
        }
    }

    const handleTargetSelect = () => {
        if (pendingActionId && selectedTargetId) {
            // Действие совершается на выбранного игрока
            executeAction(pendingActionId, selectedTargetId);
            setIsTargetSelectionVisible(false);
            setSelectedTargetId(null);
            setPendingActionId(null);
        }
    };

    // Переход к следующему ходу
    const nextCharacter = () => {
        if (currentTurn === 0) {
            const newCombatChars = [...combatCharacters].sort((a, b) => b.initiative - a.initiative);
            setCombatCharacters(newCombatChars);
            const newTurn = currentTurn + 1;
            setCurrentTurn(newTurn);
            setCurrentCharacterId(newCombatChars[0].character.id);
            setLog([...log, `===== ХОД ${newTurn} =====`, `----- ХОДИТ ${newCombatChars[0].character.name} -----`]);
            return;
        }

        const currentCharacterIndex = combatCharacters.findIndex(x => x.character.id === currentCharacterId);
        const newCharacterIndex = (currentCharacterIndex + 1) % combatCharacters.length;

        const newLogs: string[] = [];
        if (newCharacterIndex === 0) {
            const newTurn = currentTurn + 1;
            setCurrentTurn(newTurn);
            newLogs.push(`===== ХОД ${newTurn} =====`);
        }
        setCurrentCharacterId(combatCharacters[newCharacterIndex].character.id);
        newLogs.push(`----- ХОДИТ ${combatCharacters[newCharacterIndex].character.name} -----`);
        setLog([...log, ...newLogs]);
        setActiveCharacterId(combatCharacters[newCharacterIndex].character.id);
    };

    // Рендер таблицы статов
    const renderStatsTable = (stats: Record<string, number> | undefined) => {

        if (!stats) {
            return (<></>);
        }

        const data = Object.keys(stats).map(stat => ({
            key: stat,
            name: stat,
            value: stats[stat],
        }));

        return (
            <Table dataSource={data} pagination={false}>
                <Column title="Стат" dataIndex="name" key="name" />
                <Column title="Значение" dataIndex="value" key="value" />
            </Table>
        );
    };

    const handleInitiativeChange = (newInitiative: number) => {
        const updatedCharacters = [...combatCharacters];
        const found = updatedCharacters.find(x => x.character.id === activeCharacterId);
        if(found){
            found.initiative = newInitiative;
        }
        setCombatCharacters(updatedCharacters.sort((a, b) => b.initiative - a.initiative));
    };

    const getActiveCharacter = () => {
        const found = combatCharacters.find(x => x.character.id === activeCharacterId);
        if(found){
            return found;
        }
        return null;
    }

    const isActiveCharacterMonster = () => {
        const found = combatCharacters.find(x => x.character.id === activeCharacterId);
        if(found){
            return found.character instanceof Monster;
        }
        return false;
    }

    const handleDeath = () => {
        if(activeCharacterId === currentCharacterId){
            const index = combatCharacters.findIndex(x => x.character.id === currentCharacterId);
            if(index === combatCharacters.length - 1){
                if(combatCharacters.length > 1){
                    setCurrentCharacterId(combatCharacters[combatCharacters.length - 2].character.id);
                }
            }
            else {
                setCurrentCharacterId(combatCharacters[index + 1].character.id);
            }
        }
        setCombatCharacters([...(combatCharacters.filter(x => x.character.id !== activeCharacterId))]);
        setActiveCharacterId(null);
    };

    const clearBattle = () => {
        saveCombatState({
            combatCharacters: [],
            currentTurn: 0,
            log: [],
            currentCharacterId: null,
        })
            .then(x =>{
                setCombatCharacters([]);
                setCurrentTurn(0);
                setLog([]);
                setCurrentCharacterId(null);
            });
    }

    return (
        <div>
            <h1>Экран боя</h1>
            <Button danger type="primary" onClick={clearBattle}>Очистить страницу</Button>
            <h2>Ход: {currentTurn}</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Левая колонка: Список персонажей */}
                <div style={{ flex: 1 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Button type="primary" onClick={showModal}>Добавить монстров</Button>
                        <Button type="primary" onClick={showModalPlayer}>Добавить игроков</Button>
                        <List
                            bordered
                            dataSource={combatCharacters}
                            renderItem={({ character, initiative }, index) => (
                                    <List.Item
                                        onClick={() => setActiveCharacterId(character.id)}
                                        style={{
                                            cursor: 'pointer',
                                            backgroundColor: character.id === activeCharacterId ? '#e6f7ff' : 'transparent',
                                            fontWeight: character.id === currentCharacterId ? 'bold' : 'normal', // Выделение текущего персонажа
                                        }}
                                    >
                                        {character.name} - Инициатива: {initiative}
                                    </List.Item>
                            )}
                        />
                    </Space>
                </div>

                {/* Центральное окно лога */}
                <div style={{ flex: 2, textAlign: 'center' }}>
                    <h2>Лог боя</h2>
                    <div style={{ border: '1px solid #d9d9d9', padding: '20px', height: '800px', overflowY: 'auto' }}>
                        {log.map((entry, index) => (
                            <p key={index}>{entry}</p>
                        ))}
                    </div>
                    <Button onClick={nextCharacter}>{currentTurn === 0 ? 'Начать' : 'Далее'}</Button>
                </div>

                {/* Правая колонка: Информация о персонаже */}
                <div style={{ flex: 1 }}>
                    {activeCharacterId !== null ? (
                        <>
                            <h2>Текущий персонаж</h2>
                            <Input
                                value={getActiveCharacter()?.character.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                style={{ marginBottom: '10px' }}
                            />
                            {isActiveCharacterMonster() && <Button onClick={() => handleDeath()}>Умереть</Button>}
                            <h3>Инициатива</h3>
                            <InputNumber
                                value={getActiveCharacter()?.initiative}
                                onChange={(newInitiative) => handleInitiativeChange(newInitiative ?? 0)}
                            />
                            {isActiveCharacterMonster() &&
                                <>
                                    <h3>Способности</h3>
                                    <List
                                        bordered
                                        dataSource={(getActiveCharacter()?.character as Monster).actionIds}
                                        renderItem={(actionId) => {
                                            const action = actions[actionId];
                                            const lastUsed = getActiveCharacter()?.usedActions[actionId];
                                            const actionName = isActionAvailable(action, lastUsed, currentTurn)
                                                ? action.toShowString()
                                                : `${action.toShowString()} (Ещё ${getRemainingTurns(action, currentTurn, lastUsed)} ходов)`;
                                            return (
                                                <List.Item onClick={() => handleActionClick(actionId)} style={{ cursor: 'pointer' }}>
                                                    {actionName}
                                                </List.Item>
                                            );
                                        }}
                                    />
                                    <h3>Статы</h3>
                                    {renderStatsTable((getActiveCharacter()?.character as Monster).stats)}
                                </>
                            }
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #d9d9d9' }}>
                            <p>Выберите персонажа для просмотра информации</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно для добавления монстров */}
            <Modal
                title="Выберите монстров"
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Выберите монстров"
                    value={selectedCharacterIds}
                    onChange={setSelectedCharacterIds}
                    options={allCharacters.map(character => ({
                        label: character.name,
                        value: character.id,
                    }))}
                />
            </Modal>

            {/* Модальное окно для добавления игроков */}
            <Modal
                title="Выберите игроков"
                visible={isModalPlayerVisible}
                onOk={handleOkPlayer}
                onCancel={handleCancelPlayer}
            >
                <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Выберите игроков"
                    value={selectedPlayersIds}
                    onChange={setSelectedPlayersIds}
                    options={allPlayers.map(character => ({
                        label: character.name,
                        value: character.id,
                    }))}
                />
            </Modal>

            <Modal
                title="Выберите цель"
                visible={isTargetSelectionVisible}
                onOk={handleTargetSelect}
                onCancel={() => setIsTargetSelectionVisible(false)}
            >
                <Select
                    style={{ width: '100%' }}
                    placeholder="Выберите цель"
                    value={selectedTargetId}
                    onChange={setSelectedTargetId}
                    options={combatCharacters
                        .filter(x =>  !Object.keys(x.character).includes("stats"))
                        .map(x => ({
                        label: x.character.name,
                        value: x.character.id,
                    }))}
                />
            </Modal>
        </div>
    );
};

export default CombatScreen;
