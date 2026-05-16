# Plano de execucao

Este plano transforma a arquitetura de fontes bitmap em uma sequencia de implementacao incremental. A meta e preservar o prototipo funcional enquanto o sistema migra para fontes completas, editaveis, importaveis e exportaveis.

Documento relacionado: [Arquitetura de fontes bitmap](font-architecture.md).

## Principios de execucao

1. Manter o simulador utilizavel a cada fase.
2. Evitar reescrever UI, render e armazenamento ao mesmo tempo.
3. Migrar primeiro o modelo de dados, depois o editor, depois import/export.
4. Preferir compatibilidade com os dados atuais do `localStorage`.
5. Validar cada fase com uma frase real no letreiro e com caracteres editados.

## Fase 0: estabilizar o prototipo atual

Objetivo: deixar o estado atual pronto para uma refatoracao maior.

Entregaveis:

- Corrigir layout final do editor, se ainda houver sobreposicao em alguma altura.
- Remover codigo morto que sobrou de testes de fontes alternativas.
- Separar constantes da fonte 5x7 do restante da logica.
- Criar pequenas funcoes de utilidade para matriz bitmap.

Arquivos provaveis:

- `script.js`
- `styles.css`

Criterios de aceite:

- O app abre sem erro.
- Controles continuam salvos.
- Editor atual abre e salva caractere na altura ativa.
- `node --check script.js` passa.

## Fase 1: criar o modelo de fonte

Objetivo: introduzir o formato formal de fonte sem mudar radicalmente a interface.

Entregaveis:

- Criar um objeto `baseFont5x7` no formato novo.
- Criar estrutura `fontStore`.
- Criar `activeFont`.
- Criar validadores basicos:
  - `isValidFont(font)`
  - `isValidGlyph(glyph)`
  - `normalizeGlyph(glyph)`
- Criar helpers:
  - `getGlyph(font, char)`
  - `getFallbackGlyph(font)`
  - `getFontCharacters(font)`

Arquivos provaveis:

- `script.js`

Criterios de aceite:

- A fonte 5x7 atual existe como fonte formal.
- O render ainda pode funcionar com a fonte antiga ou com uma camada adaptadora.
- Nenhuma perda do comportamento atual.

## Fase 2: projetar fonte para altura alvo

Objetivo: mover a escala para uma etapa de criacao de fonte, nao para o render.

Entregaveis:

- Criar `projectFont(baseFont, options)`.
- Projetar todos os glifos base para:
  - `metrics.height`
  - `metrics.baseline`
  - `defaultAdvance`
  - `defaultLetterSpacing`
  - `defaultWordSpacing`
- Gerar `width`, `height`, `advance`, `offsetX`, `offsetY`, `rows` por glifo.
- Criar um identificador estavel para fonte projetada.

Decisoes iniciais:

- A base 5x7 deve continuar sendo a fonte mae.
- A projecao inicial deve usar escala por intervalos proporcionais.
- Para fonte monoespacada, `advance` deve ser igual para todos os glifos.
- Para fonte proporcional, `advance` pode ser derivado de `width + 1`.

Criterios de aceite:

- Altura 7 e 14 continuam boas.
- Altura 15/16 gera uma fonte real, nao um override solto.
- O render usa uma fonte projetada em memoria.

## Fase 3: renderizar somente a partir de `activeFont`

Objetivo: simplificar o render para desenhar glifos prontos.

Entregaveis:

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

Criterios de aceite:

- A frase renderiza igual ou melhor que antes.
- Caracteres editados aparecem no letreiro.
- Caracteres inexistentes usam fallback.

## Fase 4: transformar overrides atuais em fonte customizada

Objetivo: migrar o armazenamento atual para o conceito de fonte.

Entregaveis:

- Criar `loadFontLibrary()`.
- Criar `saveFontLibrary()`.
- Migrar `ledMatrixCustomGlyphs` para uma fonte projetada se existir dado antigo.
- Salvar fontes customizadas em uma chave nova:
  - `ledMatrixFontLibrary`
- Manter leitura da chave antiga apenas como migracao.

Fluxo de migracao:

1. Ler configurações atuais.
2. Calcular altura ativa.
3. Projetar fonte base nessa altura.
4. Aplicar overrides antigos como glifos editados.
5. Salvar como fonte customizada.

Criterios de aceite:

- Quem ja editou caracteres nao perde edicoes.
- Depois da migracao, o render nao depende de `ledMatrixCustomGlyphs`.

## Fase 5: editor passa a editar a fonte ativa

Objetivo: o editor deixa de editar apenas "caractere na altura atual" e passa a editar um glifo dentro da fonte ativa.

Entregaveis:

- Lista de caracteres vem de `activeFont.glyphs`.
- Botao para adicionar caractere novo.
- Editor mostra:
  - caractere
  - largura
  - altura
  - advance
  - offsetX
  - offsetY
- Grade edita `glyph.rows`.
- Salvar altera `activeFont.glyphs[char]`.
- Resetar volta para a projecao original, se houver `sourceFontId`.

Criterios de aceite:

- Editar `A` altera a fonte ativa.
- Editar `Ç`, `_`, `*`, `#` e outros caracteres e possivel.
- O letreiro atualiza usando a fonte ativa.

## Fase 6: metricas visuais e linhas-guia

Objetivo: tornar baseline, ascent, descent, capHeight e xHeight visiveis e ajustaveis.

Entregaveis:

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
- Atualizar visual dos glifos quando metricas mudarem.

Criterios de aceite:

- Usuario entende onde a letra senta.
- Acentos e cedilha podem ser posicionados com previsibilidade.
- Mudancas globais nao destroem glifos sem confirmacao.

## Fase 7: anchors por glifo

Objetivo: permitir composicao inteligente de acentos e marcas.

Entregaveis:

- Mostrar anchors como marcadores na grade.
- Permitir editar anchors:
  - `accent`
  - `cedilla`
  - `top`
  - `center`
  - outros customizados
- Salvar anchors em `glyph.anchors`.

Criterios de aceite:

- `A` possui anchor `accent`.
- `C` possui anchor `cedilla`.
- Anchors sao exportados no JSON.

## Fase 8: composicao de caracteres

Objetivo: gerar acentos e cedilha a partir de base + marca.

Entregaveis:

- Criar glifos de marca:
  - agudo
  - grave
  - circunflexo
  - til
  - trema
  - cedilha
- Criar `composeGlyph(baseGlyph, markGlyph, anchor)`.
- Adicionar acoes:
  - gerar acentos para maiusculas
  - gerar acentos para minusculas
  - gerar cedilha
- Salvar resultado como glifo final editavel.

Criterios de aceite:

- Gerar `Á`, `À`, `Â`, `Ã`, `É`, `Ê`, `Ç`.
- Resultado aparece na lista e pode ser editado manualmente.

## Fase 9: importar e exportar JSON

Objetivo: permitir backup, compartilhamento e preparacao para hardware.

Entregaveis:

- Botao exportar fonte ativa.
- Download de JSON.
- Botao importar JSON.
- Validador de importacao.
- Tratamento de conflito de `id`.

Criterios de aceite:

- Exportar uma fonte editada.
- Recarregar/importar em outro navegador.
- A fonte importada renderiza igual.

## Fase 10: exportadores para hardware

Objetivo: transformar a fonte validada em formatos praticos para letreiros reais.

Entregaveis:

- Exportador C/C++ row-major.
- Exportador C/C++ column-major.
- Exportador hex por linha.
- Opcao de incluir ou omitir metadados.
- Documentar orientacao de bits.

Criterios de aceite:

- Um glifo exportado bate visualmente com a grade.
- O formato explicita largura, altura e advance.
- Nao ha dependencia de estado visual temporario.

## Riscos e cuidados

### Layout do editor

O editor ja mostrou que tamanhos dinamicos podem sobrepor areas. A regra daqui para frente:

- medir espaco real quando necessario;
- manter lista, grid e rodape em regioes separadas;
- evitar scroll interno confuso;
- preferir reducao de tamanho de celula a corte de conteudo.

### Unicode

Unicode pode aparecer como caractere precomposto (`Á`) ou combinacao (`A` + acento combinante). A primeira versao deve priorizar precompostos e documentar que composicao combinante sera normalizada depois.

### Compatibilidade

O formato exportado precisa ter `version`. Mudancas futuras devem migrar versoes antigas, nao quebrar importacao.

### Hardware real

Antes dos exportadores finais, precisamos decidir:

- orientacao de linhas/colunas;
- ordem dos bits;
- se o primeiro bit representa topo/esquerda;
- como codificar `advance`, `offsetX` e `offsetY`.

## Ordem recomendada imediata

1. Fase 0: estabilizar prototipo.
2. Fase 1: criar modelo formal de fonte.
3. Fase 2: criar `projectFont`.
4. Fase 3: renderizar via `activeFont`.
5. Fase 4: migrar armazenamento.

So depois disso vale investir em import/export e acentos, porque eles dependem de a fonte ja ser uma entidade completa.
