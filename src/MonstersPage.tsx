import React, { useEffect, useState } from 'react';
import {Button, Col, Input, InputNumber, List, message, Modal, Row, Select, Space, Typography} from 'antd';
import { v4 as uuidv4 } from 'uuid';  // Для генерации уникальных ID
import { Action } from './models/action';
import {Monster, StatKey} from "./models/monster";
import {ACTIONS_KEY, MONSTERS_KEY} from "./utils/localStorageKeys";


const stats: {key: StatKey, value: number}[] = [
    { key: "Сила", value: 10 },
    { key: "Телосложение", value: 10 },
    { key: "Ловкость", value: 10 },
    { key: "Интеллект", value: 10 },
    { key: "Мудрость", value: 10 },
    { key: "Харизма", value: 10 },
];

const MonstersPage: React.FC = () => {
    const [monsters, setMonsters] = useState<Monster[]>([]);
    const [search, setSearch] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importData, setImportData] = useState<string>('');
    const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
    const [name, setName] = useState<string>("");
    const [charStats, setCharStats] =
        useState<Record<string, number>>(stats.reduce((acc, stat) => ({...acc, [stat.key]: stat.value}), {}));
    const [selectedActions, setSelectedActions] = useState<string[]>([]); // список id способностей
    const [actions, setActions] = useState<Record<string, Action>>({});

    useEffect(() => {
        const storedActions = localStorage.getItem(ACTIONS_KEY);
        if (storedActions) {
            const loadedActions: Action[] = JSON.parse(storedActions);
            const actionsMap = loadedActions.reduce((acc, action) => {
                acc[action.id] = new Action(action.id, action.name, action.diceCount, action.diceSides, action.modifier, action.statKey);
                return acc;
            }, {} as Record<string, Action>);
            setActions(actionsMap);
        }
    }, []);

    useEffect(() => {
        const storedCharacters = localStorage.getItem(MONSTERS_KEY);
        if (storedCharacters) {
            const chars = JSON.parse(storedCharacters) as Monster[];
            setMonsters(chars.map(x => new Monster(x.id, x.name, x.stats, x.actionIds.filter(a => Object.keys(actions).includes(a)))));
        }
    }, [actions]);

    useEffect(() => {
        if (monsters.length > 0) {
            localStorage.setItem(MONSTERS_KEY, JSON.stringify(monsters));
        }
    }, [monsters]);

    const filteredCharacters = monsters.filter(character => character.name.toLowerCase().includes(search.toLowerCase()));

    const addCharacter = (newCharacter: Monster) => {
        setMonsters([...monsters, newCharacter]);
    };

    const removeCharacter = (id: string) => {
        setMonsters(monsters.filter(character => character.id !== id));
    };

    const updateCharacter = (updatedCharacter: Monster) => {
        setMonsters(monsters.map(character => (character.id === updatedCharacter.id ? updatedCharacter : character)));
    };

    const duplicateCharacter = (character: Monster) => {
        const duplicated = new Monster(uuidv4(), character.name, character.stats, character.actionIds);
        addCharacter(duplicated);
        editCharacter(duplicated);
    };

    const handleModalOk = () => {
        const newCharacterStats = {...charStats};
        if (editingCharacterId) {
            const updatedCharacter = new Monster(editingCharacterId, name, newCharacterStats, selectedActions);
            updateCharacter(updatedCharacter);
        } else {
            const newCharacter = new Monster(uuidv4(), name, newCharacterStats, selectedActions);
            addCharacter(newCharacter);
        }
        handleModalCancel();
    };

    const handleModalCancel = () => {
        resetForm();
        setIsModalVisible(false);
    };

    const resetForm = () => {
        setName("");
        setCharStats(stats.reduce((acc, stat) => ({...acc, [stat.key]: stat.value}), {}));
        setSelectedActions([]);
    };

    const showAddModal = () => {
        resetForm();
        setIsModalVisible(true);
    };

    const editCharacter = (character: Monster) => {
        setEditingCharacterId(character.id);
        setName(character.name);
        setCharStats(character.stats);
        setSelectedActions(character.actionIds);
        setIsModalVisible(true);
    };

    const exportToClipboard = () => {
        const data = localStorage.getItem(MONSTERS_KEY);
        if (data) {
            navigator.clipboard.writeText(data);
            message.success('Данные экспортированы в буфер обмена');
        } else {
            message.warning('Нет данных для экспорта');
        }
    };

    const importFromText = () => {
        try {
            const parsedData = JSON.parse(importData) as Monster[];
            if (Array.isArray(parsedData)) {
                localStorage.setItem(MONSTERS_KEY, importData);
                setMonsters(parsedData.map((x) => new Monster(x.id, x.name, x.stats, x.actionIds)));
                message.success('Данные успешно импортированы');
            } else {
                message.error('Неправильный формат данных');
            }
        } catch (e) {
            message.error('Ошибка при импорте данных');
        }
        setIsImportModalVisible(false);
    };

    return (
        <div>
            <h1>База персонажей</h1>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                    placeholder="Поиск по названию"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="primary" onClick={showAddModal}>Добавить нового персонажа</Button>
                <Space>
                    <Button onClick={exportToClipboard}>Экспортировать</Button>
                    <Button onClick={() => setIsImportModalVisible(true)}>Импортировать</Button>
                </Space>
                <List
                    bordered
                    dataSource={filteredCharacters}
                    renderItem={character => (
                        <List.Item
                            actions={[
                                <Button onClick={() => duplicateCharacter(character)}>Создать на основе</Button>,
                                <Button onClick={() => editCharacter(character)}>Изменить</Button>,
                                <Button danger onClick={() => removeCharacter(character.id)}>Удалить</Button>
                            ]}
                        >
                            {character.toShowString()}
                        </List.Item>
                    )}
                />
            </Space>

            <Modal
                title={editingCharacterId ? "Изменить персонажа" : "Новый персонаж"}
                visible={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
            >
                <div>
                    <Typography.Title level={5}>Имя персонажа</Typography.Title>
                    <Input placeholder="Имя" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <Typography.Title level={5}>Статы</Typography.Title>
                    {stats.map(stat => (
                        <Row key={stat.key} gutter={16} align="middle" style={{ marginBottom: '10px' }}>
                            <Col span={12}>
                                <Typography.Text>{stat.key}</Typography.Text>
                            </Col>
                            <Col span={12}>
                                <InputNumber
                                    value={charStats[stat.key]}
                                    onChange={value => setCharStats({...charStats, [stat.key]: value || 0})}
                                    style={{ width: '100%' }}
                                />
                            </Col>
                        </Row>
                    ))}
                </div>
                <div>
                    <Typography.Title level={5}>Способности</Typography.Title>
                    <Select
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        mode="multiple"
                        value={selectedActions}
                        onChange={setSelectedActions}
                        options={Object.values(actions).map(action => ({value: action.id, label: action.toShowString()}))}
                        style={{ width: '100%' }}
                    />
                </div>
            </Modal>

            <Modal
                title="Импорт данных"
                visible={isImportModalVisible}
                onOk={importFromText}
                onCancel={() => setIsImportModalVisible(false)}
            >
                <Typography.Paragraph>Вставьте экспортированные данные для импорта</Typography.Paragraph>
                <Input.TextArea
                    rows={4}
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                />
            </Modal>
        </div>
    );
};

export default MonstersPage;
