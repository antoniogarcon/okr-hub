# 🎯 OKRs View

**OKRs View** é uma aplicação web **multi-tenant** para gestão de **OKRs**, **métricas ágeis (Scrum)** e **gestão organizacional de pessoas**, projetada para **trens de desenvolvimento (ARTs)** que utilizam **SAFe**.

O produto oferece visões estratégicas e operacionais para **POs, PMs, BOs, líderes e equipes**, unificando estratégia, execução e transparência em um único lugar.

---

## 🚀 Visão Geral

O OKRs View foi concebido para resolver problemas comuns em ambientes ágeis escalados:

- Falta de visibilidade entre estratégia e execução  
- OKRs desconectados das métricas reais dos times  
- Pouca transparência entre equipes de um mesmo trem  
- Dificuldade de gestão organizacional de pessoas  

A aplicação conecta **OKRs hierárquicos**, **indicadores Scrum**, **gestão de pessoas**, **Wiki interna** e **Feed de eventos automáticos**.

---

## 🧱 Principais Funcionalidades

### 🎯 Gestão de OKRs
- OKRs hierárquicos (OKR Pai → OKRs Filhas)
- OKRs de Trem e OKRs de Equipe
- Key Results com progresso automático
- Cálculo de progresso consolidado
- Integração automática com Feed e Relatórios

---

### 📊 Métricas Ágeis (Scrum)
- Velocity por sprint
- Capacity por sprint
- Histórico de sprints
- Tendências de entrega
- Indicadores agregados por equipe e por trem

---

### 🚆 SAFe / ART
- Organização por Trem de Desenvolvimento (ART)
- Equipes vinculadas ao trem
- Visão executiva consolidada
- Relatórios estratégicos para liderança

---

### 👥 Gestão de Pessoas
- Lista completa de pessoas do trem
- Movimentação entre equipes
- Ativação e desativação de usuários
- Histórico organizacional (preservação de dados)

---

### 🧑‍💼 Papéis Organizacionais (SAFe)
Separados das permissões técnicas:
- Product Owner (PO)
- Product Manager (PM)
- Business Owner (BO)
- Release Train Engineer (RTE)
- Tech Lead, Agile Coach, etc.
- Papéis customizáveis por tenant

---

### 📰 Feed Global de Atualizações
Eventos automáticos como:
- OKR criado, atualizado ou concluído
- Atualização de velocity ou capacity
- Movimentação de pessoas
- Publicações e atualizações da Wiki

Tudo centralizado em um feed único por trem.

---

### 🔔 Notificações
- Notificações in-app por usuário
- Eventos críticos do sistema
- Estrutura preparada para e-mail (futuro)

---

### 📚 Wiki Integrada
- Documentação interna do produto
- Onboarding de novos usuários
- Versionamento automático
- Integração com Feed

---

## 🔐 Segurança e Governança

- Autenticação por e-mail e senha
- Política de senha forte
- Hash seguro de senhas
- Controle de acesso baseado em papéis (RBAC)
- Isolamento total por tenant (multi-tenant)
- Auditoria e logs imutáveis
- Compliance-ready (ambientes corporativos)

---

## 🌍 Internacionalização (i18n)

Idiomas suportados:
- 🇧🇷 Português (Brasil) – padrão
- 🇺🇸 Inglês
- 🇪🇸 Espanhol

Idioma configurável por usuário.

---

## 👤 Tipos de Usuário

### Root
- Gerencia todos os tenants
- Visão global do sistema
- Não pertence a nenhum tenant

### Administrador do Tenant
- Acesso total ao trem
- Gerencia pessoas, equipes, OKRs e métricas

### Líder de Equipe
- Gerencia OKRs e métricas da própria equipe
- Visão operacional

### Membro de Equipe
- Visualiza OKRs
- Atualiza progresso de Key Results atribuídos

---

## 🧩 Arquitetura Conceitual

- Aplicação Web
- Multi-tenant
- RBAC (Role-Based Access Control)
- Domínios separados:
  - Autenticação
  - Pessoas
  - Equipes
  - OKRs
  - Métricas
  - Feed
  - Wiki
  - Auditoria

---

## 🛠️ Ferramentas Utilizadas

- **Lovable** — geração e construção da aplicação
- **Figma** — design das interfaces
- **Builder.io** — geração assistida de layouts
- **GitHub** — versionamento e documentação

---

## 📌 Status do Projeto

✅ Funcional  
✅ Estruturado  
✅ Escalável  
✅ Pronto para uso real  
✅ Base sólida para evolução (v2.0)

---

## 🗺️ Próximos Passos (Roadmap)

- Exportação de relatórios (PDF / CSV)
- Integração com Jira / Azure DevOps
- Indicadores de fluxo (Flow Metrics)
- Gestão de capacidade por pessoa
- Alertas inteligentes por risco de OKR

---

## 📄 Licença

Projeto desenvolvido para fins educacionais e profissionais.  
Licença a definir conforme evolução do produto.

---

## ✨ Autor

**OKRs View**  
Produto idealizado e estruturado para ambientes ágeis escalados (SAFe).




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
