# AI Agent Design Manual: NeuroNex Brand Identity

Este documento serve como a **Fonte da Verdade** para qualquer Agente de IA (Code, Copy, Design) que trabalhe no projeto NeuroNex. Siga estas diretrizes estritamente para manter a coesão da marca.

## 1. Filosofia de Design: "Liquid Glass & Spatial Intelligence"
O NeuroNex não se parece com um software SaaS tradicional (Bootstrap/Material Design). Ele deve parecer um **sistema operacional futurista**.

### Palavras-Chave Visuais:
- **Eterealidade:** Uso extensivo de *Glassmorphism* (efeito de vidro fosco), transparências e camadas. O fundo nunca é uma cor sólida chapada; é sempre uma composição de gradientes suaves, orbes de luz ou imagens desfocadas.
- **Profundidade (Z-Axis):** A interface é espacial. Janelas flutuam sobre o conteúdo. Modais não são apenas "pop-ups", são camadas de vidro que se sobrepõem com sombras difusas e coloridas (`box-shadow` com cores, não apenas preto).
- **Dark Mode First:** O sistema é nativamente escuro (Dark Mode). Cores claras são usadas apenas para acentos de luz e tipografia de alto contraste.
- **Micro-interações Orgânicas:** Nada é estático. Botões têm brilho ao passar o mouse. Bordas têm gradientes que giram. O movimento deve ser fluido (curvas de Bezier suaves), nunca linear ou robótico.

## 2. Paleta de Cores e Materiais

### Backgrounds
- **Deep Space Black:** `#030712` (Base principal, quase preto, mas com tom azulado/frio).
- **Nebula Gradients:** Gradientes sutis de Roxo (`#7c3aed`), Ciano (`#06b6d4`) e Rosa (`#ec4899`) com opacidade muito baixa (5-10%) para criar atmosfera no fundo.

### Superfícies (Glass)
- **Glass Panel:** `bg-black/40 backdrop-blur-xl border-white/10`.
- **Active Glass:** `bg-white/5 backdrop-blur-2xl border-white/20`.

### Acentos (Neon/Glow)
- Use para indicar status, IA ativa ou ações primárias.
- **AI Glow:** Roxo Elétrico a Azul Ciano. Sempre acompanhado de `box-shadow` ou `drop-shadow` da mesma cor para simular incandescência.

## 3. Tipografia
- **Família:** `Inter` ou `Outfit` (Google Fonts).
- **Estilo:** Limpa, sem serifa, tracking levemente ajustado para leitura (relaxed) em títulos.
- **Peso:** Títulos finos (Light/Thin) em tamanhos grandes transmitem elegância tecnológica. Textos de corpo `Normal` ou `Medium` para legibilidade.

## 4. Comportamento da IA (Tone of Voice)
Ao gerar textos ou interagir com o usuário, a IA do NeuroNex deve ser:
- **Concisa e Cirúrgica:** Profissionais de saúde não têm tempo. Vá direto ao ponto.
- **Sofisticada:** Use vocabulário culto, mas moderno. Evite gírias de internet ou formalidade arcaica ("Vossa Senhoria"). Pense em "Assistente Executivo de Alto Nível".
- **Empoderadora:** A IA serve ao terapeuta, aumenta suas capacidades. Nunca deve soar condescendente.

## 5. Componentes Chave (Assinatura Visual)
- **Bento Grids:** Organize informações em grades retangulares (cards) com efeito de vidro.
- **Spotlight Effects:** Ao passar o mouse sobre cards, um efeito de luz deve seguir o cursor (revealing borders/glow).
- **Borderless Inputs:** Campos de texto muitas vezes não precisam de bordas pesadas, apenas uma linha sutil ou mudança de cor no fundo ao focar.

---
*Ao criar qualquer nova tela ou funcionalidade, pergunte-se: "Isso parece um formulário bancário chato ou uma interface de navegação espacial de um filme de ficção científica de bom gosto?" Se for a primeira opção, refaça.*
