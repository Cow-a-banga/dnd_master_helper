import React, { useEffect, useState } from 'react';
import { Button, Input, InputNumber, List, Modal, Select, Space, Typography, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { Action } from './models/action';
import {ACTIONS_KEY, PLAYERS_KEY} from './utils/localStorageKeys';
import { StatKey } from './models/monster';
import {Player} from "./models/player";

const ActionsPage: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [search, setSearch] = useState<string>('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importData, setImportData] = useState<string>('');
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    const [name, setName] = useState<string>('');
    const [armorClass, setArmorClass] = useState<number>(1);

    useEffect(() => {
        const storedActions = localStorage.getItem(PLAYERS_KEY);
        if (storedActions) {
            setPlayers(
                (JSON.parse(storedActions) as Player[]).map(
                    (x) => new Player(x.id, x.name, x.armorClass)
                )
            );
        }
    }, []);

    useEffect(() => {
        if (players.length > 0) {
            localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
        }
    }, [players]);

    const filteredPlayers = players.filter((player) =>
        player.name.toLowerCase().includes(search.toLowerCase())
    );


    const addPlayer = (newPlayer: Player) => {
        setPlayers([...players, newPlayer]);
    };

    const removePlayer = (id: string) => {
        setPlayers(players.filter((player) => player.id !== id));
    };

    const updatePlayer = (updatedPlayer: Player) => {
        setPlayers(players.map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player)));
    };

    const duplicatePlayer = (player: Player) => {
        const duplicated = new Player(
            uuidv4(),
            player.name,
            player.armorClass,
        );
        addPlayer(duplicated);
        editPlayer(duplicated);
    };

    const handleModalOk = () => {
        if (editingPlayerId) {
            const updatedPlayer = new Player(editingPlayerId, name, armorClass);
            updatePlayer(updatedPlayer);
        } else {
            const newPlayer = new Player(uuidv4(), name, armorClass);
            addPlayer(newPlayer);
        }
        handleModalCancel();
    };

    const handleModalCancel = () => {
        resetForm();
        setIsModalVisible(false);
    };

    const resetForm = () => {
        setName('');
        setArmorClass(10);
    };

    const showAddModal = () => {
        resetForm();
        setIsModalVisible(true);
    };

    const editPlayer = (player: Player) => {
        setEditingPlayerId(player.id);
        setName(player.name);
        setArmorClass(player.armorClass);
        setIsModalVisible(true);
    };

    const exportToClipboard = () => {
        const data = localStorage.getItem(PLAYERS_KEY);
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
                localStorage.setItem(PLAYERS_KEY, importData);
                setPlayers(parsedData.map((x) => new Player(x.id, x.name, x.armorClass)));
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
            <h1>База игроков</h1>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                    placeholder="Поиск по имени"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="primary" onClick={showAddModal}>
                    Добавить нового игрока
                </Button>
                <Space>
                    <Button onClick={exportToClipboard}>Экспортировать</Button>
                    <Button onClick={() => setIsImportModalVisible(true)}>Импортировать</Button>
                </Space>
                <List
                    bordered
                    dataSource={filteredPlayers}
                    renderItem={(player) => (
                        <List.Item
                            actions={[
                                <Button onClick={() => duplicatePlayer(player)}>Создать на основе</Button>,
                                <Button onClick={() => editPlayer(player)}>Изменить</Button>,
                                <Button danger onClick={() => removePlayer(player.id)}>Удалить</Button>,
                            ]}
                        >
                            {player.toShowString()}
                        </List.Item>
                    )}
                />
            </Space>

            <Modal
                title={editingPlayerId ? 'Изменить способность' : 'Новая способность'}
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
                    <InputNumber value={armorClass} onChange={(x) => setArmorClass(x || 0)} />
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
