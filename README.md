# BarberCash - Aplicativo de Gestão Financeira para Barbearias

O **BarberCash** é um projeto de extensão universitária que visa desenvolver um aplicativo móvel de gestão financeira para a Barbearia do Lucas, substituindo o controle manual por planilhas por um sistema automatizado e integrado.

## 🚀 Tecnologias Utilizadas

O projeto é dividido em duas partes principais: o **Frontend (Aplicativo Móvel)** e o **Backend (API)**.

| Componente | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | **React Native (Expo)** | Aplicativo móvel para Android, focado em usabilidade e acesso em dispositivos móveis. |
| **Backend** | **Node.js (Express)** | API RESTful para comunicação entre o aplicativo e o banco de dados. |
| **Banco de Dados** | **MySQL** | Sistema de gerenciamento de banco de dados relacional para persistência dos dados financeiros. |

## 🛠️ Pré-requisitos

Para executar o projeto, você precisará ter instalado em sua máquina:

*   **Node.js** (versão 18.x ou superior)
*   **npm** (gerenciador de pacotes do Node.js)
*   **Expo CLI** (instalado globalmente: `npm install -g expo-cli`)
*   **MySQL Server** (ou acesso a um servidor MySQL)
*   **Git**

## ⚙️ Configuração e Instalação

Siga os passos abaixo para configurar e executar o projeto:

### 1. Clonar o Repositório

```bash
git clone https://github.com/richardfsdias/BarberCashApp.git
cd BarberCashApp
```

### 2. Configuração do Banco de Dados (MySQL)

O projeto utiliza o MySQL. Você precisará criar um banco de dados e configurar as credenciais de acesso no arquivo de configuração do backend (`BarberCashApp/backend/server.js` ou um arquivo de configuração similar, dependendo da implementação).

**Observação:** O código do `Dashboard.js` aponta para um IP local específico (`http://192.168.0.164:3001`). Certifique-se de atualizar este IP no arquivo `BarberCashApp/Dashboard.js` para o endereço IP da sua máquina ou para `http://10.0.2.2:3001` se estiver usando o emulador Android Studio.

### 3. Instalação e Execução do Backend (API)

O backend é responsável pela lógica de negócio e comunicação com o MySQL.

```bash
cd backend
npm install
npm start
```

A API estará rodando em `http://localhost:3001`.

### 4. Instalação e Execução do Frontend (Aplicativo Móvel)

O frontend é o aplicativo móvel desenvolvido com React Native (Expo).

```bash
cd .. # Volta para a pasta raiz do projeto (BarberCashApp)
npm install
npm start
```

Ao executar `npm start`, o Expo CLI iniciará e exibirá um QR Code no terminal. Você pode:

*   **Usar o aplicativo Expo Go:** Escaneie o QR Code com o aplicativo Expo Go (disponível para Android e iOS) para abrir o projeto em seu dispositivo móvel.
*   **Executar em um emulador:** Pressione `a` no terminal para abrir no emulador Android ou `i` para o simulador iOS (se estiver em macOS).

## 📝 Funcionalidades Principais

O aplicativo visa oferecer as seguintes funcionalidades:

*   **Login e Cadastro:** Acesso seguro ao sistema.
*   **Dashboard:** Visão geral do resumo financeiro (saldo, entradas, saídas) e gráficos por período (Dia, Semana, Mês).
*   **Lançamentos:** Registro de entradas e saídas.
*   **Catálogo:** Gerenciamento de serviços e estoque de produtos.
