
# 📊 OKRs View

**OKRs View** é uma aplicação web focada em **gestão de OKRs (Objectives and Key Results)** com suporte a **multi-tenancy**, **hierarquia organizacional**, **segurança avançada** e **visualização clara do alinhamento estratégico** entre objetivos corporativos, times e indivíduos.

O projeto foi pensado para empresas que desejam acompanhar resultados de forma estruturada, segura e escalável.

---

## 🎯 Objetivo do Projeto

Criar uma plataforma simples e poderosa para:

* Definir OKRs organizacionais, de times e individuais
* Visualizar a relação entre OKRs pai e OKRs filhas
* Garantir alinhamento estratégico entre áreas
* Controlar acesso por papéis (roles)
* Proteger informações sensíveis por tenant

---

## 🏗️ Arquitetura Conceitual

* **Multi-tenant**: cada empresa (tenant) possui dados totalmente isolados
* **Root User**: usuário global com acesso administrativo a todos os tenants
* **Tenant Admin**: administrador da empresa
* **Team Leader**: líder de equipe
* **Team Member**: colaborador

---

## 👥 Papéis e Permissões

### 🔑 Root

* Gerencia todos os tenants
* Acesso total à aplicação

### 🛠️ Tenant Admin

* Gerencia usuários do próprio tenant
* Cria e edita equipes
* Cria OKRs organizacionais
* Visualiza todos os OKRs do tenant

### 👨‍💼 Team Leader

* Cria e gerencia OKRs do seu time
* Visualiza OKRs do time e OKRs pai

### 👤 Team Member

* Visualiza OKRs relacionados
* Atualiza progresso dos Key Results atribuídos

---

## 🧩 Funcionalidades Principais

### ✅ Gestão de OKRs

* Criação de Objectives e Key Results
* Definição de métricas e progresso
* Status automático baseado no avanço

### 🔗 Hierarquia de OKRs

* Relacionamento entre OKR pai e OKRs filhas
* Visualização em árvore (organizacional → time → individual)

### 👥 Gestão de Usuários

* Convite por e-mail
* Ativação segura de conta
* Controle por papéis (roles)
* Associação a equipes

### 🏢 Gestão de Equipes

* Criação e edição de times
* Associação de usuários
* Vinculação de OKRs por equipe

---

## 🔐 Segurança

* Isolamento total de dados por tenant
* Controle de acesso baseado em papéis (RBAC)
* Senhas com regras fortes:

  * Letras maiúsculas e minúsculas
  * Números
  * Caracteres especiais
* Hash seguro de senhas
* Logs de auditoria para ações críticas

---

## 🌍 Internacionalização (i18n)

A aplicação suporta múltiplos idiomas:

* 🇧🇷 Português (Brasil)
* 🇺🇸 Inglês
* 🇪🇸 Espanhol

O idioma é configurável por usuário.

---

## 🎨 Design e UX

* Interfaces desenhadas no **Figma**
* Layout limpo e orientado a produto
* Experiência focada em clareza e produtividade
* Telas reutilizadas como referência visual no desenvolvimento

---

## 🤖 Ferramentas Utilizadas

* **Lovable** — geração e evolução da aplicação via prompts
* **Figma** — design e prototipação das telas
* **GitHub** — versionamento e documentação

---

## 🚀 Status do Projeto

🟡 **Em desenvolvimento ativo**

* [x] Definição funcional
* [x] Modelagem de usuários e permissões
* [x] Design das telas
* [x] Estrutura de prompts para geração no Lovable
* [ ] Implementação final
* [ ] Testes e ajustes

---

## 📌 Próximos Passos

* Implementação de dashboards e métricas visuais
* Exportação de relatórios
* Histórico de progresso de OKRs
* Notificações e lembretes






# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
