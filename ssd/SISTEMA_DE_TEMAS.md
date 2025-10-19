# Sistema de Temas Dinâmico - SalonFlow

## Visão Geral

O SalonFlow agora possui um sistema de temas completamente dinâmico que permite adaptar a identidade visual para cada cliente rapidamente. Este sistema utiliza variáveis CSS semânticas e classes do Tailwind CSS para facilitar a customização.

## Como Funciona

### 1. Estrutura Base
- **Variáveis CSS**: Todas as cores são definidas através de variáveis CSS semânticas
- **Classes Tailwind**: O Tailwind foi configurado para usar essas variáveis
- **Temas por Classe**: Cada tema é ativado através de uma classe CSS na tag `<html>`

### 2. Temas Disponíveis

#### Tema Padrão (SalonFlow - Rosa e Violeta)
```html
<html lang="pt-BR" class="theme-default">
```
- **Cores Primárias**: Rosa (#ec4899) e Violeta (#a855f7)
- **Ideal para**: Salões modernos e femininos

#### Tema Amarelo e Preto
```html
<html lang="pt-BR" class="theme-yellow-dark">
```
- **Cores Primárias**: Amarelo (#fbbf24) e Preto
- **Ideal para**: Barbearias e salões masculinos

#### Tema Marrom e Branco
```html
<html lang="pt-BR" class="theme-brown-light">
```
- **Cores Primárias**: Marrom (#8b4513) e Branco
- **Ideal para**: Salões clássicos e elegantes

#### Tema Roxo e Laranja
```html
<html lang="pt-BR" class="theme-purple-orange">
```
- **Cores Primárias**: Roxo (#9333ea) e Laranja (#f97316)
- **Ideal para**: Salões criativos e modernos

## Como Alterar o Tema

### Método 1: Alteração Manual no HTML
1. Abra o arquivo `index.html`
2. Modifique a classe na tag `<html>`:
   ```html
   <!-- Para tema amarelo e preto -->
   <html lang="pt-BR" class="theme-yellow-dark">
   ```

### Método 2: Alteração Dinâmica com JavaScript
```javascript
// Para alterar o tema dinamicamente
document.documentElement.className = 'theme-yellow-dark';

// Para salvar a preferência
localStorage.setItem('theme', 'theme-yellow-dark');

// Para carregar a preferência salva
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.className = savedTheme;
}
```

## Variáveis CSS Disponíveis

### Cores Principais
- `--primary`: Cor primária do tema
- `--primary-foreground`: Texto sobre a cor primária
- `--secondary`: Cor secundária do tema
- `--secondary-foreground`: Texto sobre a cor secundária

### Cores de Estado
- `--success`: Verde para sucesso
- `--warning`: Amarelo para avisos
- `--destructive`: Vermelho para ações destrutivas

### Cores de Interface
- `--background`: Fundo principal
- `--foreground`: Texto principal
- `--card`: Fundo dos cards
- `--border`: Bordas
- `--accent`: Cor de destaque para hovers

## Classes Tailwind Semânticas

### Botões
```tsx
// Botão primário
<button className="bg-primary text-primary-foreground">
  Botão Primário
</button>

// Botão secundário
<button className="bg-secondary text-secondary-foreground">
  Botão Secundário
</button>

// Botão de sucesso
<button className="bg-success text-success-foreground">
  Sucesso
</button>
```

### Cards
```tsx
<div className="bg-card border border-border">
  <h3 className="text-foreground">Título</h3>
  <p className="text-muted-foreground">Descrição</p>
</div>
```

### Gradientes
```tsx
// Gradiente primário
<div className="bg-gradient-to-r from-primary to-secondary">
  Conteúdo
</div>
```

## Criando Novos Temas

Para criar um novo tema, adicione as variáveis CSS no arquivo `src/react-app/index.css`:

```css
.theme-meu-tema {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 142 76% 36%; /* Verde */
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  /* ... outras variáveis */
}
```

## Vantagens do Sistema

1. **Customização Rápida**: Mude toda a identidade visual alterando uma classe
2. **Consistência**: Todas as cores seguem uma paleta harmoniosa
3. **Manutenibilidade**: Cores centralizadas em variáveis CSS
4. **Escalabilidade**: Fácil adicionar novos temas
5. **Performance**: Sem necessidade de recarregar a página

## Exemplos de Uso

### Para Cliente 1 (Barbearia Masculina)
```html
<html lang="pt-BR" class="theme-yellow-dark">
```

### Para Cliente 2 (Salão Elegante)
```html
<html lang="pt-BR" class="theme-brown-light">
```

### Para Cliente 3 (Salão Criativo)
```html
<html lang="pt-BR" class="theme-purple-orange">
```

## Implementação Avançada

### Tema Baseado em Domínio
```javascript
// Detecta o domínio e aplica o tema correspondente
const domain = window.location.hostname;
const themeMap = {
  'barbearia.salonflow.app': 'theme-yellow-dark',
  'salao.salonflow.app': 'theme-brown-light',
  'criativo.salonflow.app': 'theme-purple-orange'
};

const theme = themeMap[domain] || 'theme-default';
document.documentElement.className = theme;
```

### Seletor de Temas na Interface
```tsx
const themes = [
  { name: 'Padrão', class: 'theme-default' },
  { name: 'Amarelo e Preto', class: 'theme-yellow-dark' },
  { name: 'Marrom e Branco', class: 'theme-brown-light' },
  { name: 'Roxo e Laranja', class: 'theme-purple-orange' }
];

const handleThemeChange = (themeClass) => {
  document.documentElement.className = themeClass;
  localStorage.setItem('theme', themeClass);
};
```

Este sistema permite que você adapte rapidamente o SalonFlow para qualquer identidade visual de cliente, mantendo a consistência e qualidade da interface.

