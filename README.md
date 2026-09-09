# Funerária Eterna Saudade

> Repositório contendo o backend do sistema de gerenciamento de uma funerária.

## Avisos

Projeto desenvolvido para fins acadêmicos como parte do Trabalho Prático 3 da disciplina de Desenvolvimento Web.

Utilize o projeto preferencialmente para desenvolvimento local.

## 💻 Pré-requisitos

Antes de começar, verifique se sua máquina possui:

- Docker
- Docker Compose
- Git

## 🚀 Executando

Com o terminal (ou prompt de comando), entre na pasta do repositório e digite o seguinte comando:


docker compose up --build -d


Esse comando irá criar e iniciar os containers necessários para a execução do backend e do banco de dados.

## 🔄 Reiniciando o servidor

Caso queira reiniciar o servidor em algum momento, execute os seguintes comandos:


docker compose down -v

docker compose up --build -d


O primeiro comando encerra os containers em execução e o segundo inicia novamente o projeto.

## 🗄️ Banco de dados

O sistema utiliza PostgreSQL como banco de dados.

As tabelas são criadas automaticamente a partir das configurações do projeto e possuem dados iniciais para auxiliar nos testes da API.

O banco de dados possui as seguintes entidades:

- Cliente
- Funeral
- Serviço
- Serviço_Funeral

A entidade `servico_funeral` é responsável pela associação entre funerais e serviços.

## ⚙️ Funcionalidades

O sistema possui as seguintes funcionalidades:

- CRUD de clientes;
- CRUD de funerais;
- CRUD de serviços;
- Associação entre funerais e serviços;
- Desassociação entre funerais e serviços;
- Consultas utilizando JOIN;
- Operações exclusivas entre as entidades;
- Validação dos dados enviados para a API.

## ☕ Endereços para acesso

O endereço base para o backend e sua documentação é:


http://localhost:3000


A documentação completa das rotas pode ser acessada pela página inicial do servidor:


http://localhost:3000/


Para acessar a interface de gerenciamento do banco de dados e visualizar as tabelas criadas, utilize:


http://localhost:8081


## 📚 Rotas

As principais rotas da API são:


/cliente
/funeral
/servico
/servico_funeral


Cada entidade possui suas respectivas operações e rotas específicas.

A documentação detalhada de cada operação está disponível na página inicial da API.

## 📄 Documentação

A documentação apresenta informações sobre:

- Métodos HTTP;
- Endpoints;
- Parâmetros;
- Corpo das requisições;
- Exemplos de respostas;
- Códigos de status HTTP;
- Operações exclusivas do sistema.

## 👥 Autores

Projeto desenvolvido pelos alunos responsáveis pelo Trabalho Prático 3 da disciplina de Desenvolvimento Web - GRUPO F