import React, { useEffect, useState } from 'react';
import {Button, Input, InputNumber, List, Modal, Select, Space, Typography, message, Checkbox} from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { Action } from './models/action';
import { ACTIONS_KEY } from './utils/localStorageKeys';
import { StatKey } from './models/monster';

const dices = [
    { value: 4, label: <span>4</span> },
    { value: 6, label: <span>6</span> },
    { value: 8, label: <span>8</span> },
    { value: 10, label: <span>10</span> },
    { value: 12, label: <span>12</span> },
    { value: 20, label: <span>20</span> },
    { value: 100, label: <span>100</span> },
];

const stats = [
    { value: "Сила", label: <span>Сила</span> },
    { value: "Телосложение", label: <span>Телосложение</span> },
    { value: "Ловкость", label: <span>Ловкость</span> },
    { value: "Интеллект", label: <span>Интеллект</span> },
    { value: "Мудрость", label: <span>Мудрость</span> },
    { value: "Харизма", label: <span>Харизма</span> },
];

const ActionsPage: React.FC = () => {
    const [actions, setActions] = useState<Action[]>([]);
    const [search, setSearch] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importData, setImportData] = useState<string>('');
    const [editingActionId, setEditingActionId] = useState<string | null>(null);
    const [name, setName] = useState<string>('');
    const [diceCount, setDiceCount] = useState<number>(1);
    const [diceSides, setDiceSides] = useState<number>(4);
    const [modifier, setModifier] = useState<number>(0);
    const [statKey, setStatKey] = useState<StatKey>('Сила');
    const [cooldown, setCooldown] = useState<number | null>(null);
    const [hitModifier, setHitModifier] = useState<number>(0);
    const [requiresTarget, setRequiresTarget] = useState<boolean>(true);

    useEffect(() => {
        const storedActions = localStorage.getItem(ACTIONS_KEY);
        if (storedActions) {
            setActions(
                (JSON.parse(storedActions) as Action[]).map(
                    (x) => new Action(x.id, x.name, x.diceCount, x.diceSides, x.modifier, x.statKey, x.cooldown, x.hitModifier, x.requiresTarget)
                )
            );
        }
    }, []);

    useEffect(() => {
        if (actions.length > 0) {
            localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
        }
    }, [actions]);

    const filteredAbilities = actions.filter((action) =>
        action.name.toLowerCase().includes(search.toLowerCase())
    );

    const addAction = (newAbility: Action) => {
        setActions([...actions, newAbility]);
    };

    const removeAction = (id: string) => {
        setActions(actions.filter((ability) => ability.id !== id));
    };

    const updateAction = (updatedAction: Action) => {
        setActions(actions.map((action) => (action.id === updatedAction.id ? updatedAction : action)));
    };

    const duplicateAction = (action: Action) => {
        const duplicated = new Action(
            uuidv4(),
            action.name,
            action.diceCount,
            action.diceSides,
            action.modifier,
            action.statKey,
            action.cooldown,
            action.hitModifier,
            action.requiresTarget,
        );
        addAction(duplicated);
        editAction(duplicated);
    };

    const handleModalOk = () => {
        if (editingActionId) {
            const updatedAction = new Action(editingActionId, name, diceCount, diceSides, modifier, statKey, cooldown, hitModifier, requiresTarget);
            updateAction(updatedAction);
        } else {
            const newAction = new Action(uuidv4(), name, diceCount, diceSides, modifier, statKey, cooldown, hitModifier, requiresTarget);
            addAction(newAction);
        }
        handleModalCancel();
    };

    const handleModalCancel = () => {
        resetForm();
        setIsModalVisible(false);
    };

    const resetForm = () => {
        setName('');
        setDiceCount(1);
        setDiceSides(4);
        setModifier(0);
        setStatKey('Сила');
        setEditingActionId(null);
        setCooldown(null);
        setHitModifier(0);
        setRequiresTarget(true);
    };

    const showAddModal = () => {
        resetForm();
        setIsModalVisible(true);
    };

    const editAction = (action: Action) => {
        setEditingActionId(action.id);
        setName(action.name);
        setDiceCount(action.diceCount);
        setDiceSides(action.diceSides);
        setModifier(action.modifier);
        setStatKey(action.statKey);
        setCooldown(action.cooldown)
        setHitModifier(action.hitModifier);
        setRequiresTarget(action.requiresTarget);
        setIsModalVisible(true);
    };

    const exportToClipboard = () => {
        const data = localStorage.getItem(ACTIONS_KEY);
        if (data) {
            navigator.clipboard.writeText(data);
            message.success('Данные экспортированы в буфер обмена');
        } else {
            message.warning('Нет данных для экспорта');
        }
    };

    const importFromText = () => {
        try {
            const parsedData = JSON.parse(importData);
            if (Array.isArray(parsedData)) {
                localStorage.setItem(ACTIONS_KEY, importData);
                setActions(parsedData.map((x) => new Action(x.id, x.name, x.diceCount, x.diceSides, x.modifier, x.statKey, x.cooldown, x.hitModifier, x.requiresTarget)));
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
            <h1>База способностей</h1>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                    placeholder="Поиск по названию"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="primary" onClick={showAddModal}>
                    Добавить новую способность
                </Button>
                <Space>
                    <Button onClick={exportToClipboard}>Экспортировать</Button>
                    <Button onClick={() => setIsImportModalVisible(true)}>Импортировать</Button>
                </Space>
                <List
                    bordered
                    dataSource={filteredAbilities}
                    renderItem={(action) => (
                        <List.Item
                            actions={[
                                <Button onClick={() => duplicateAction(action)}>Создать на основе</Button>,
                                <Button onClick={() => editAction(action)}>Изменить</Button>,
                                <Button danger onClick={() => removeAction(action.id)}>Удалить</Button>,
                            ]}
                        >
                            {action.toShowString()}
                        </List.Item>
                    )}
                />
            </Space>

            <Modal
                title={editingActionId ? 'Изменить способность' : 'Новая способность'}
                visible={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
            >
                <div>
                    <Typography.Title level={5}>Название</Typography.Title>
                    <Input placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                    <Typography.Title level={5}>Число костей</Typography.Title>
                    <InputNumber value={diceCount} onChange={(x) => setDiceCount(x || 1)} />
                </div>
                <div>
                    <Typography.Title level={5}>Тип костей</Typography.Title>
                    <Select style={{ width: 120 }} options={dices} value={diceSides} onChange={(x) => setDiceSides(x)} />
                </div>
                <div>
                    <Typography.Title level={5}>Модификатор</Typography.Title>
                    <Select style={{ width: 150 }} options={stats} value={statKey} onChange={(x) => setStatKey(x)} />
                </div>
                <div>
                    <Typography.Title level={5}>Дополнительный модификатор урона</Typography.Title>
                    <InputNumber value={modifier} onChange={(x) => setModifier(x || 0)} />
                </div>
                <div>
                    <Typography.Title level={5}>Время отката (оставить пустым если нет)</Typography.Title>
                    <InputNumber value={cooldown} onChange={(x) => setCooldown(x)} />
                </div>
                <div>
                    <Typography.Title level={5}>Дополнительный модификатор попадания</Typography.Title>
                    <InputNumber value={hitModifier} onChange={(x) => setHitModifier(x || 0)} />
                </div>
                <div>
                    <Typography.Title level={5}>Направлен на игрока</Typography.Title>
                    <Checkbox checked={requiresTarget} onChange={(e) => setRequiresTarget(e.target.checked)} />
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

export default ActionsPage;
