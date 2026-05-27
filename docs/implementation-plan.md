# Plano de execução

Este plano transforma a arquitetura de fontes bitmap em uma sequência de implementação incremental. A meta é preservar o protótipo funcional enquanto o sistema migra para fontes completas, editáveis, importáveis e exportáveis.

Documento relacionado: [Arquitetura de fontes bitmap](font-architecture.md).

## Princípios de execução

1. Manter o simulador utilizável a cada fase.
2. Evitar reescrever UI, render e armazenamento ao mesmo tempo.
3. Migrar primeiro o modelo de dados, depois o editor, depois import/export.
4. Preferir compatibilidade com os dados atuais do `localStorage`.
5. Validar cada fase com uma frase real no letreiro e com caracteres editados.

## Fase 0: estabilizar o protótipo atual

Objetivo: deixar o estado atual pronto para uma refatoração maior.

Entregáveis:

- Corrigir layout final do editor, se ainda houver sobreposição em alguma altura.
- Remover código morto que sobrou de testes de fontes alternativas.
- Separar constantes da fonte 5x7 do restante da lógica.
- Criar pequenas funções de utilidade para matriz bitmap.

Arquivos prováveis:

- `script.js`
- `styles.css`

Critérios de aceite:

- O app abre sem erro.
- Controles continuam salvos.
- Editor atual abre e salva caractere na altura ativa.
- `node --check script.js` passa.

## Fase 1: criar o modelo de fonte

Objetivo: introduzir o formato formal de fonte sem mudar radicalmente a interface.

Entregáveis:

- Criar um objeto `baseFont5x7` no formato novo.
- Criar estrutura `fontStore`.
- Criar `activeFont`.
- Criar validadores básicos:
  - `isValidFont(font)`
  - `isValidGlyph(glyph)`
  - `normalizeGlyph(glyph)`
- Criar helpers:
  - `getGlyph(font, char)`
  - `getFallbackGlyph(font)`
  - `getFontCharacters(font)`

Arquivos prováveis:

- `script.js`

Critérios de aceite:

- A fonte 5x7 atual existe como fonte formal.
- O render ainda pode funcionar com a fonte antiga ou com uma camada adaptadora.
- Nenhuma perda do comportamento atual.

## Fase 2: projetar fonte para altura alvo

Objetivo: mover a escala para uma etapa de criação de fonte, não para o render.

Entregáveis:

- Criar `projectFont(baseFont, options)`.
- Projetar todos os glifos base para:
  - `metrics.height`
  - `metrics.baseline`
  - `defaultAdvance`
  - `defaultLetterSpacing`
  - `defaultWordSpacing`
- Gerar `width`, `height`, `advance`, `offsetX`, `offsetY`, `rows` por glifo.
- Criar um identificador estável para fonte projetada.

Decisões iniciais:

- A base 5x7 deve continuar sendo a fonte mãe.
- A projeção inicial deve usar escala por intervalos proporcionais.
- Para fonte monoespaçada, `advance` deve ser igual para todos os glifos.
- Para fonte proporcional, `advance` pode ser derivado de `width + 1`.

Critérios de aceite:

- Altura 7 e 14 continuam boas.
- Altura 15/16 gera uma fonte real, não um override solto.
- O render usa uma fonte projetada em memória.

## Fase 3: renderizar somente a partir de `activeFont`

Objetivo: simplificar o render para desenhar glifos prontos.

Entregáveis:

- Trocar `renderMatrixTextMap` para usar:
  - `activeFont.metrics`
  - `glyph.rows`
  - `glyph.advance`
  - `glyph.offsetX`
  - `glyph.offsetY`
- Remover escala dentro do render.
- Adicionar aviso interno para caracteres faltantes.

Regra de render:

```text
x = cursor + glyph.offsetX
y = topOffset + glyph.offsetY
cursor += glyph.advance + activeFont.metrics.defaultLetterSpacing
```

Critérios de aceite:

- A frase renderiza igual ou melhor que antes.
- Caracteres editados aparecem no letreiro.
- Caracteres inexistentes usam fallback.

## Fase 4: transformar overrides atuais em fonte customizada

Objetivo: migrar o armazenamento atual para o conceito de fonte.

Entregáveis:

- Criar `loadFontLibrary()`.
- Criar `saveFontLibrary()`.
- Migrar `ledMatrixCustomGlyphs` para uma fonte projetada se existir dado antigo.
- Salvar fontes customizadas em uma chave nova:
  - `ledMatrixFontLibrary`
- Manter leitura da chave antiga apenas como migração.

Fluxo de migração:

1. Ler configurações atuais.
2. Calcular altura ativa.
3. Projetar fonte base nessa altura.
4. Aplicar overrides antigos como glifos editados.
5. Salvar como fonte customizada.

Critérios de aceite:

- Quem já editou caracteres não perde edições.
- Depois da migração, o render não depende de `ledMatrixCustomGlyphs`.

## Fase 5: editor passa a editar a fonte ativa

Objetivo: o editor deixa de editar apenas "caractere na altura atual" e passa a editar um glifo dentro da fonte ativa.

Entregáveis:

- Lista de caracteres vem de `activeFont.glyphs`.
- Botão para adicionar caractere novo.
- Editor mostra:
  - caractere
  - largura
  - altura
  - advance
  - offsetX
  - offsetY
- Grade edita `glyph.rows`.
- Salvar altera `activeFont.glyphs[char]`.
- Resetar volta para a projeção original, se houver `sourceFontId`.

Critérios de aceite:

- Editar `A` altera a fonte ativa.
- Editar `Ç`, `_`, `*`, `#` e outros caracteres é possível.
- O letreiro atualiza usando a fonte ativa.

## Fase 6: métricas visuais e linhas-guia

Objetivo: tornar baseline, ascent, descent, capHeight e xHeight visíveis e ajustáveis.

Entregáveis:

- Mostrar linhas no editor:
  - topo da fonte
  - ascent
  - capHeight
  - xHeight
  - baseline
  - descent
  - limite inferior
- Adicionar controles globais:
  - `height`
  - `baseline`
  - `ascent`
  - `descent`
  - `capHeight`
  - `xHeight`
- Atualizar visual dos glifos quando métricas mudarem.

Critérios de aceite:

- Usuário entende onde a letra senta.
- Acentos e cedilha podem ser posicionados com previsibilidade.
- Mudanças globais não destroem glifos sem confirmação.

## Fase 7: anchors por glifo

Objetivo: permitir composição inteligente de acentos e marcas.

Entregáveis:

- Mostrar anchors como marcadores na grade.
- Permitir editar anchors:
  - `accent`
  - `cedilla`
  - `top`
  - `center`
  - outros customizados
- Salvar anchors em `glyph.anchors`.

Critérios de aceite:

- `A` possui anchor `accent`.
- `C` possui anchor `cedilla`.
- Anchors são exportados no JSON.

## Fase 8: composição de caracteres

Objetivo: gerar acentos e cedilha a partir de base + marca.

Entregáveis:

- Criar glifos de marca:
  - agudo
  - grave
  - circunflexo
  - til
  - trema
  - cedilha
- Criar `composeGlyph(baseGlyph, markGlyph, anchor)`.
- Adicionar ações:
  - gerar acentos para maiúsculas
  - gerar acentos para minúsculas
  - gerar cedilha
- Salvar resultado como glifo final editável.

Critérios de aceite:

- Gerar `Á`, `À`, `Â`, `Ã`, `É`, `Ê`, `Ç`.
- Resultado aparece na lista e pode ser editado manualmente.

## Fase 9: importar e exportar JSON

Objetivo: permitir backup, compartilhamento e preparação para hardware.

Entregáveis:

- Botão exportar família ativa.
- Download de JSON com pacote `led-matrix-font-family`.
- Botão importar família JSON.
- Validador de importação.
- Tratamento de conflito de `id`.
- Compatibilidade com JSON antigo de fonte única.

Critérios de aceite:

- Exportar uma família editada.
- Recarregar/importar em outro navegador.
- A família importada renderiza igual.

## Fase 10: exportadores para hardware

Objetivo: transformar a fonte validada em formatos praticos para letreiros reais.

Entregáveis:

- Exportador C/C++ row-major.
- Exportador C/C++ column-major.
- Exportador hex por linha.
- Opcao de incluir ou omitir metadados.
- Documentar orientação de bits.

Critérios de aceite:

- Um glifo exportado bate visualmente com a grade.
- O formato explicita largura, altura e advance.
- Não há dependência de estado visual temporário.

Decisão implementada inicialmente:

- O exportador C/C++ column-major é a primeira saída de firmware disponível.
- A fonte ativa gera tabela Unicode e bitmap em `PROGMEM`.
- Cada altura da família é um slot único; overrides editáveis substituem a fonte base da mesma altura.
- Imports legados com a duplicidade base/override são normalizados, enquanto colisões ambíguas são rejeitadas.

## Riscos e cuidados

### Layout do editor

O editor já mostrou que tamanhos dinâmicos podem sobrepor áreas. A regra daqui para frente:

- medir espaço real quando necessário;
- manter lista, grid e rodapé em regiões separadas;
- evitar scroll interno confuso;
- preferir redução de tamanho de célula a corte de conteúdo.

### Unicode

Unicode pode aparecer como caractere precomposto (`Á`) ou combinação (`A` + acento combinante). A primeira versão deve priorizar precompostos e documentar que composição combinante será normalizada depois.

### Compatibilidade

O formato exportado precisa ter `version`. Mudanças futuras devem migrar versões antigas, não quebrar importação.

### Hardware real

Antes dos exportadores finais, precisamos decidir:

- orientação de linhas/colunas;
- ordem dos bits;
- se o primeiro bit representa topo/esquerda;
- como codificar `advance`, `offsetX` e `offsetY`.

## Ordem recomendada imediata

1. Fase 0: estabilizar protótipo.
2. Fase 1: criar modelo formal de fonte.
3. Fase 2: criar `projectFont`.
4. Fase 3: renderizar via `activeFont`.
5. Fase 4: migrar armazenamento.

Só depois disso vale investir em import/export e acentos, porque eles dependem de a fonte já ser uma entidade completa.

## Progresso da primeira implementação

Implementado:

- `baseFont5x7` no formato formal inicial.
- `fontLibrary` persistida em `localStorage`.
- `activeFont` derivada da altura atual.
- `projectFont(baseFont, options)` para gerar fonte projetada a partir da 5x7.
- Render da fonte matriz usando glifos prontos da `activeFont`.
- Editor salvando glifos dentro da fonte ativa.
- Adição manual de novos caracteres digitáveis no editor.
- Migração inicial da chave antiga `ledMatrixCustomGlyphs` para a biblioteca de fontes.
- Exportação JSON da família ativa.
- Exportação C/C++ column-major da fonte ativa, com `uint8_t`, `uint16_t`, `uint32_t` ou bytes por coluna conforme a altura.
- Importação JSON de família com validação estrutural.
- Resolução de uma única variação por altura de família, evitando export duplicado da base e de seu override editável.
- Compatibilidade de importação com JSON antigo de fonte única.
- Render preservando caracteres Unicode quando a fonte ativa possui o glifo, com fallback para normalização quando não possui.
- Editor com controles iniciais de `width`, `advance`, `offsetX` e `offsetY` por glifo.
- Redimensionamento horizontal do bitmap preservando pixels existentes.
- Editor renomeado para "Editar fonte" e aberto em tela inteira.
- Preview visual de todos os glifos cadastrados em formato de letreiro.
- Guias visuais iniciais de baseline e advance no display do glifo em edição.
- Preview de fonte com quebra em múltiplas linhas.
- Correção do `clamp` para aceitar zero com ranges negativos.
- Controles globais iniciais de `baseline`, `ascent`, `descent`, `capHeight` e `xHeight`.
- Ação de derivação de fonte projetada com nome escolhido pelo usuário.
- Derivação/materialização de fonte projetada em canvas de altura total do letreiro,
  preservando a letra menor com espaços editáveis acima e abaixo.
- Reorganização dos controles principais em linha de letreiro e linha de fonte.
- Salvar como para duplicar a família ativa com novo nome.
- Apagar famílias customizadas salvas no navegador.
- Reparação de famílias antigas que corrompiam o nome visível da fonte base.
- Modo monoespaçado com `advance` bloqueado por glifo.
- Modo proporcional/adaptado com `advance` por glifo.
- Largura padrão editável para fontes monoespaçadas.
- Espaçamento padrão editável por fonte.
- Preview de caracteres em letreiro contínuo, com colunas de espaçamento mais escuras.
- Copiar e colar matriz de caractere para criar variantes.
- Adição de vários caracteres de uma vez por janela aberta pelo botão `+` no fim do preview de caracteres.
- Apagar caractere individual com proteção para espaço e fallback.
- Cabeçalho do editor mostrando família e altura como leitura.
- Layout do editor reorganizado com:
  - título da fonte centralizado no topo;
  - caracteres logo abaixo do cabeçalho;
  - parâmetros gerais da fonte ao lado do editor de caractere;
  - toolbox por ícones para salvar, linhas-guia, undo/redo, copiar/colar, resetar e apagar.
- Undo/redo de edições de pixels no glifo ativo.
- Responsividade calibrada para:
  - evitar clipping do editor de caractere;
  - evitar barras de rolagem duplicadas;
  - reduzir campos/ícones junto com o grid antes de empilhar;
  - manter linhas-guia alinhadas ao gap real da grade.

Ainda pendente:

- Seletor visual de fontes salvas/importadas.
- Redimensionamento vertical controlado do glifo, se decidirmos permitir glifos com altura diferente da fonte.
- Anchors editáveis.
- Composição de acentos e cedilha.
- Exportadores adicionais de hardware, como row-major ou binário compacto.
