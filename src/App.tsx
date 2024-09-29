import React, {useState} from 'react';
import './App.css';
import {Layout, Menu} from "antd";
import MonstersPage from "./MonstersPage";
import ActionsPage from "./ActionsPage";
import BattlePage from "./BattlePage";
import PlayersPage from "./PlayersPage";

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('players');

  const renderPage = () => {
    switch (currentPage) {
        case 'players':
            return <PlayersPage />;
        case 'monsters':
            return <MonstersPage />;
        case 'actions':
            return <ActionsPage />;
        case 'battle':
            return <BattlePage />;
      default:
            return <MonstersPage />;
    }
  };

  return (
      <Layout>
        <Header>
          <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[currentPage]}
              onClick={(e) => setCurrentPage(e.key)}
          >
              <Menu.Item key="players">Игроки</Menu.Item>
              <Menu.Item key="actions">Способности</Menu.Item>
              <Menu.Item key="monsters">Монстры</Menu.Item>
              <Menu.Item key="battle">Битва</Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '20px' }}>
          {renderPage()}
        </Content>
      </Layout>
  );
};

export default App;
