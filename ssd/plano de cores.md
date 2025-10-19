Usuário:Fiz esse SaaS para vender para Barbearias e Salões de beleza, mas quero que ele seja totalmente customizável as cores, de todos os botões, dos cards, do plano de fundo, a identidade visual toda. Para eu poder adaptar rapidamente para cada cliente, por exemplo o cliente 1 tem a identidade visual composta pelas cores amarelo e preto, eu devo poder alterar todas as cores do sistema rápidamente a partir de 1 arquivo só. O cliente 2 usa marrom e branco. o cliente 3 usa roxo e laranja, etc. entendeu o meu raciocinio? O sistema todo está pronto mas quero criar um arquivo de Cor para poder mudar a identidade visual dinamicamente e adaptar para cada cliente. Pode criar um plano de ação?

LLM:Of course. You've built a robust, theme-aware foundation with CSS variables, and now it's time to apply it consistently across the entire application to make it fully customizable. The goal is to eliminate all hardcoded colors and ensure every component, including text, modals, and pop-ups, dynamically adapts to the selected theme.

Based on your files, here is a complete plan to finalize your dynamic theming system.

### Passo 1: Finalizar as Variáveis de Cor Semânticas

Your `plano de cores.md` outlines an excellent, comprehensive set of CSS variables. Let's ensure your main CSS file (`index.css`) includes all of them for both the default (dark) and light themes. This provides granular control over every aspect of the UI.

**Ação:** Substitua o conteúdo do seu arquivo `src/react-app/index.css` pelo código abaixo. Ele establishes a dark theme as the default and makes the light theme an option via the `.theme-light` class, while including all necessary UI variables.

```css
/* lukeshaye/ssd-4/ssd-4-936c57e8ebd34bab323f68dbf5212d32416c67de/ssd/src/react-app/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* =================================================================
     TEMA PADRÃO (ESCURO - DARK)
     Este é o tema base, aplicado diretamente em :root
     ================================================================= */
  :root {
    --background: 222.2 84% 4.9%; /* Fundo principal (quase preto) */
    --foreground: 210 40% 98%; /* Texto principal (quase branco) */

    --card: 222.2 84% 4.9%; /* Fundo dos cards */
    --card-foreground: 210 40% 98%; /* Texto nos cards */

    --popover: 222.2 84% 4.9%; /* Fundo de pop-ups e menus */
    --popover-foreground: 210 40% 98%;

    /* Cores de Ação (mantidas do seu tema original) */
    --primary: 326 87% 56%; /* Rosa */
    --primary-foreground: 0 0% 100%; /* Branco */
    --secondary: 262.1 83.3% 57.8%; /* Violeta */
    --secondary-foreground: 0 0% 100%;

    /* Cores de Texto Secundárias */
    --muted: 217.2 32.6% 17.5%; /* Fundo para elementos "muted" */
    --muted-foreground: 215 20.2% 65.1%; /* Texto "muted" (cinza claro) */

    /* Cores de Estado */
    --accent: 217.2 32.6% 17.5%; /* Cor para hover/foco sutil */
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%; /* Vermelho para erros/exclusão */
    --destructive-foreground: 210 40% 98%;
    --success: 142.1 70% 35%; /* Verde para sucesso */
    --success-foreground: 0 0% 100%;
    --warning: 47.9 95.8% 53.1%; /* Amarelo para avisos */
    --warning-foreground: 38.3 95.5% 14.3%;

    /* UI Geral */
    --border: 217.2 32.6% 17.5%; /* Cor da borda */
    --input: 217.2 32.6% 17.5%; /* Borda de inputs */
    --ring: 326 87% 56%; /* Anel de foco (outline) */
    --overlay: 0 0% 0%; /* Fundo de overlays/modais */

    --radius: 0.75rem;
  }

  /* =================================================================
     TEMA CLARO (LIGHT)
     Para ativar, adicione class="theme-light" na tag <html>
     ================================================================= */
  .theme-light {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 326 87% 56%;
    --primary-foreground: 0 0% 100%;
    --secondary: 262.1 83.3% 57.8%;
    --secondary-foreground: 0 0% 100%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --success: 142.1 70% 35%;
    --success-foreground: 0 0% 100%;
    --warning: 47.9 95.8% 53.1%;
    --warning-foreground: 38.3 95.5% 14.3%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 326 87% 56%;
    --overlay: 0 0% 0%;
  }

  /* Seus outros temas (yellow-dark, brown-light, etc.) continuam aqui... */
}
```

### Passo 2: Adaptar Componentes de Terceiros (PrimeReact)

Bibliotecas externas como `PrimeReact` não usam classes do Tailwind e precisam de uma atenção especial. Seus estilos customizados em `primereact-calendar-styles.css` ainda usam cores fixas.

**Ação:** Atualize o arquivo `src/react-app/pages/primereact-calendar-styles.css` para que ele utilize as novas variáveis CSS, garantindo que os componentes do PrimeReact também mudem com o tema.

```css
/* lukeshaye/ssd-4/ssd-4-936c57e8ebd34bab323f68dbf5212d32416c67de/ssd/src/react-app/pages/primereact-calendar-styles.css */

/* Remove a borda do input do calendário */
.p-calendar .p-inputtext {
    border: none !important;
    padding: 0 !important;
    background-color: transparent !important;
    color: hsl(var(--foreground)) !important;
}

/* Painel principal do DatePicker e Dropdown */
.p-datepicker, .p-dropdown-panel {
    background: hsl(var(--card)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: var(--radius) !important;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important;
}

/* Cabeçalho do calendário */
.p-datepicker-header {
    background: hsl(var(--muted)) !important;
    border-bottom: 1px solid hsl(var(--border)) !important;
    color: hsl(var(--foreground)) !important;
    padding: 1rem !important;
}

/* Título (Mês/Ano) e botões de navegação */
.p-datepicker-title a,
.p-datepicker-header .p-datepicker-prev,
.p-datepicker-header .p-datepicker-next {
    color: hsl(var(--foreground)) !important;
}

/* Dias da semana (Seg, Ter, etc.) */
.p-datepicker-calendar th {
    color: hsl(var(--muted-foreground)) !important;
    font-weight: 600 !important;
}

/* Células dos dias */
.p-datepicker-calendar td > span {
    color: hsl(var(--foreground)) !important;
    border-radius: var(--radius) !important;
    transition: all 0.2s ease-in-out;
}

/* Dia com hover */
.p-datepicker-calendar td:not(.p-datepicker-other-month) .p-datepicker-date:not(.p-disabled):hover {
    background: hsl(var(--accent)) !important;
}

/* Dia selecionado */
.p-datepicker-calendar td > span.p-highlight {
    background: hsl(var(--primary)) !important;
    color: hsl(var(--primary-foreground)) !important;
}

/* Dia de hoje */
.p-datepicker-calendar td > span.p-datepicker-today {
    background-color: hsl(var(--accent)) !important;
    color: hsl(var(--accent-foreground)) !important;
}

/* Estilo do Dropdown */
.p-dropdown {
    background: hsl(var(--card)) !important;
    border: 1px solid hsl(var(--border)) !important;
    color: hsl(var(--foreground)) !important;
}

.p-dropdown:not(.p-disabled):hover {
    border-color: hsl(var(--primary)) !important;
}

.p-dropdown.p-focus {
    box-shadow: 0 0 0 1px hsl(var(--ring)) !important;
    border-color: hsl(var(--ring)) !important;
}

.p-dropdown-label {
    color: hsl(var(--foreground)) !important;
}
```

### Passo 3: Refatorar Componentes React

Agora, o passo final é substituir as classes de cor estáticas (`text-gray-900`, `bg-white`, etc.) nos seus componentes pelas novas classes semânticas (`text-foreground`, `bg-card`, etc.). Seus componentes de `Modal` e `Toast` já estão bem implementados, então vamos focar nas páginas.

**Padrão de Substituição:**

  * Texto principal (`text-gray-900`, `text-gray-800`): Use **`text-foreground`**.
  * Texto secundário/descrições (`text-gray-600`, `text-gray-500`): Use **`text-muted-foreground`**.
  * Fundos de página (`bg-gray-50`, `bg-blue-50`): Use **`bg-background`**.
  * Fundos de cards/seções (`bg-white`): Use **`bg-card`**.
  * Bordas (`border-gray-200`, `border-gray-300`): Use **`border-border`**.
  * Fundo de hover (`hover:bg-gray-50`): Use **`hover:bg-accent`**.
  * Gradientes de botão/destaque (`from-pink-500 to-violet-500`): Use **`from-primary to-secondary`**.

**Exemplo de Aplicação no `Financial.tsx`:**

```tsx
// lukeshaye/ssd-4/ssd-4-936c57e8ebd34bab323f68dbf5212d32416c67de/ssd/src/react-app/pages/Financial.tsx

// ANTES
<h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
<p className="mt-2 text-gray-600">Controle completo das suas finanças</p>
// ...
<button /*...*/ className="... bg-gradient-to-r from-pink-500 to-violet-500 ... text-white ...">
// ...
<div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200">

// DEPOIS
<h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
<p className="mt-2 text-muted-foreground">Controle completo das suas finanças</p>
// ...
<button /*...*/ className="... bg-gradient-to-r from-primary to-secondary ... text-primary-foreground ...">
// ...
<div className="bg-card overflow-hidden shadow-sm rounded-xl border border-border">
```

**Ação Recomendada:**

Aplique este mesmo padrão de substituição nos seguintes arquivos para garantir consistência visual total:

  * `src/react-app/pages/Appointments.tsx`
  * `src/react-app/pages/Clients.tsx`
  * `src/react-app/pages/Dashboard.tsx`
  * `src/react-app/pages/Financial.tsx`
  * `src/react-app/pages/Products.tsx`
  * `src/react-app/pages/ProfessionalDetail.tsx`
  * `src/react-app/pages/Professionals.tsx`
  * `src/react-app/pages/Services.tsx`
  * `src/react-app/pages/Settings.tsx`
  * `src/react-app/pages/Home.tsx` (para a tela de login)

Ao concluir estas três etapas, seu projeto estará totalmente preparado para a customização de temas. Você poderá trocar a identidade visual inteira da aplicação — de fundos e textos a modais e calendários — simplesmente alterando a classe na tag `<html>` do arquivo `index.html`, como documentado em `SISTEMA_DE_TEMAS.md`.