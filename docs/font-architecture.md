# Arquitetura de fontes bitmap para letreiro LED

Este documento registra as decisoes de produto e arquitetura para transformar o simulador em um editor/exportador de fontes bitmap para letreiros LED reais.

## Objetivo

O sistema deve permitir que uma pessoa:

1. Escolha uma fonte base existente.
2. Projete essa fonte para uma altura de letra adequada ao letreiro atual.
3. Ajuste metricas globais da fonte projetada.
4. Edite glifos individualmente em uma grade de LEDs.
5. Crie caracteres acentuados, cedilha, simbolos e outros caracteres Unicode.
6. Teste a fonte no simulador.
7. Exporte e importe a fonte para reutilizacao ou uso em hardware real.

O foco do modelo e fonte bitmap, nao fonte vetorial. O render final nao deve reinterpretar contornos nem rasterizar fontes do sistema. Ele deve apenas desenhar glifos bitmap ja definidos.

## Decisoes principais

### Fonte, nao override solto

Um conjunto de caracteres para uma altura especifica deve ser tratado como uma fonte completa.

Hoje o prototipo salva overrides por caractere e altura. A arquitetura final deve evoluir para:

- `baseFont`: fonte original, normalmente somente leitura.
- `projectedFont`: fonte gerada a partir da base para uma altura alvo.
- `activeFont`: fonte usada atualmente pelo letreiro.
- `fontLibrary`: colecao de fontes base, fontes importadas e fontes customizadas.

### Uma fonte projetada e editavel

Ao escolher uma fonte base e uma altura, o sistema deve gerar uma nova fonte bitmap naquela altura. Essa fonte gerada vira o material editavel.

Exemplo:

- Base: `classic-5x7`
- Altura alvo: `16`
- Fonte gerada: `classic-5x7-projected-11x16`

Depois da geracao, o usuario pode editar qualquer glifo sem alterar a fonte base.

### Render simples

O render do letreiro deve receber glifos prontos:

- `rows` define quais LEDs acendem.
- `offsetX` e `offsetY` posicionam o bitmap.
- `advance` move o cursor para o proximo caractere.
- `defaultLetterSpacing` adiciona espaco global se desejado.

O render nao deve decidir como uma letra deve ser escalada enquanto desenha a frase. A escala/projecao pertence a etapa de criacao da fonte.

## Modelo de dados proposto

```json
{
  "format": "led-matrix-font",
  "version": 1,
  "id": "custom-16",
  "name": "Custom 16",
  "description": "Fonte bitmap para letreiro LED",
  "author": "Usuario",
  "license": "custom",
  "sourceFontId": "classic-5x7",
  "encoding": "unicode",
  "createdAt": "2026-05-16T00:00:00.000Z",
  "updatedAt": "2026-05-16T00:00:00.000Z",
  "metrics": {
    "units": "led",
    "mode": "proportional",
    "height": 16,
    "baseline": 13,
    "ascent": 13,
    "descent": 2,
    "capHeight": 11,
    "xHeight": 8,
    "defaultAdvance": 10,
    "defaultLetterSpacing": 1,
    "defaultWordSpacing": 4,
    "fallback": "?"
  },
  "glyphs": {
    "A": {
      "codepoint": "U+0041",
      "name": "LATIN CAPITAL LETTER A",
      "category": "uppercase",
      "width": 9,
      "height": 13,
      "advance": 10,
      "offsetX": 0,
      "offsetY": 1,
      "anchors": {
        "accent": { "x": 4, "y": 0 },
        "top": { "x": 4, "y": 0 },
        "center": { "x": 4, "y": 6 },
        "cedilla": { "x": 4, "y": 14 }
      },
      "rows": [
        "001110000",
        "010001000",
        "100000100"
      ]
    }
  },
  "composites": {
    "Á": {
      "base": "A",
      "marks": [
        { "glyph": "´", "anchor": "accent" }
      ]
    }
  }
}
```

## Campos obrigatorios

Para uma fonte ser renderizavel e exportavel, estes campos devem existir:

- `format`
- `version`
- `id`
- `name`
- `encoding`
- `metrics.height`
- `metrics.baseline`
- `metrics.defaultAdvance`
- `metrics.defaultLetterSpacing`
- `metrics.defaultWordSpacing`
- `metrics.fallback`
- `glyphs[char].width`
- `glyphs[char].height`
- `glyphs[char].advance`
- `glyphs[char].offsetX`
- `glyphs[char].offsetY`
- `glyphs[char].rows`

## Campos importantes desde o inicio

Mesmo que a primeira UI nao edite tudo, o formato deve nascer com suporte para:

- `metrics.ascent`
- `metrics.descent`
- `metrics.capHeight`
- `metrics.xHeight`
- `glyphs[char].anchors`
- `glyphs[char].category`
- `glyphs[char].codepoint`
- `composites`

Esses campos permitem acentos, cedilha, minusculas, simbolos e outros alfabetos sem quebrar o formato depois.

## Conceitos de metrica

### height

Altura total da linha da fonte em LEDs. Define o espaco vertical reservado para renderizar texto.

### baseline

Linha onde os caracteres "sentam". Maiusculas normalmente terminam perto da baseline. Cedilhas e descendentes podem passar abaixo.

### ascent

Quantidade de LEDs acima da baseline. Normalmente inclui maiusculas e acentos.

### descent

Quantidade de LEDs abaixo da baseline. Usado por cedilha, `g`, `p`, `q`, `y` e marcas inferiores.

### capHeight

Altura visual das maiusculas sem acento, como `A`, `B`, `M`.

### xHeight

Altura visual de minusculas como `x`, `a`, `e`, quando a fonte tiver minusculas.

### width

Largura real do bitmap do glifo.

### advance

Quanto o cursor anda depois que o glifo e desenhado. Pode ser maior que `width` para criar espaco natural.

### offsetX

Deslocamento horizontal do bitmap em relacao ao cursor.

### offsetY

Deslocamento vertical do bitmap dentro da linha da fonte.

### anchors

Pontos de encaixe para composicao visual. Exemplos:

- `accent`: posicao para acento acima.
- `cedilla`: posicao para cedilha abaixo.
- `top`: topo optico do glifo.
- `center`: centro optico.

## Unicode e caracteres especiais

O formato deve usar chaves Unicode nos glifos:

```json
{
  "glyphs": {
    "A": {},
    "Á": {},
    "ç": {},
    "_": {},
    "*": {},
    "#": {},
    "Ω": {}
  }
}
```

O editor deve permitir adicionar qualquer caractere digitavel. Para caracteres compostos, a fonte pode ter:

1. Um glifo final desenhado manualmente.
2. Uma regra em `composites`.
3. Ambos, com o glifo manual tendo prioridade no render/export.

## Composicao de acentos

Caracteres compostos podem ser gerados a partir de uma base e marcas.

Exemplos:

- `Á` = `A` + `´`
- `Ã` = `A` + `~`
- `Ç` = `C` + `¸`
- `ã` = `a` + `~`

O fluxo recomendado:

1. Gerar o caractere composto usando anchors.
2. Criar um glifo bitmap final.
3. Permitir edicao manual do resultado.
4. Salvar o glifo final na fonte.

Assim, a regra ajuda a criar, mas o hardware recebe um mapa pronto e simples.

## Jornada do usuario

### 1. Escolher fonte base

O usuario escolhe uma fonte disponivel na biblioteca:

- `classic-5x7`
- fontes futuras importadas
- fontes customizadas salvas

### 2. Projetar fonte

O usuario escolhe altura alvo e parametros iniciais:

- altura da fonte
- baseline
- ascent/descent
- capHeight/xHeight
- modo proporcional ou monoespacado
- advance padrao
- espaco entre letras
- espaco entre palavras

O sistema cria uma fonte projetada.

### 3. Ajustar metricas globais

O editor mostra linhas-guia:

- topo da fonte
- ascent
- capHeight
- xHeight
- baseline
- descent
- limite inferior

Essas guias devem ser visuais e ajustaveis.

### 4. Editar glifos

Para cada caractere, o usuario pode:

- clicar LEDs para acender/apagar
- alterar largura
- alterar advance
- alterar offsetX/offsetY
- ajustar anchors
- clonar outro caractere
- resetar para a projecao original

### 5. Gerar caracteres derivados

O editor pode ter acoes como:

- gerar acentos para maiusculas
- gerar acentos para minusculas
- gerar cedilha
- criar pontuacao/simbolos basicos

### 6. Testar no letreiro

O campo de frase usa a fonte ativa. Se houver caracteres sem glifo, o sistema deve avisar:

```text
Faltando na fonte: ç, ã, #
```

### 7. Exportar/importar

O usuario pode exportar a fonte inteira como JSON. Importar deve validar:

- formato
- versao
- metricas obrigatorias
- integridade dos glifos
- consistencia entre `width`, `height` e `rows`

## Exportacao para hardware real

O JSON e o formato-fonte principal. A partir dele, podem existir exportadores:

- JSON compacto
- C/C++ arrays para Arduino/ESP32
- bytes por coluna
- bytes por linha
- hexadecimal por glifo
- CSV ou texto simples para debug

Decisao: exportadores de hardware devem ser derivados da fonte validada, nao de estado visual temporario.

## Plano de implementacao

### Fase 1: formalizar fontStore

- Criar estrutura `fontStore`.
- Converter `matrixFont5x7` em `baseFont`.
- Criar `activeFont`.
- Manter o comportamento visual atual.

### Fase 2: projetar fontes

- Criar `projectFont(baseFont, options)`.
- Salvar fontes projetadas no `localStorage`.
- Substituir overrides por fontes customizadas.

### Fase 3: render por fonte

- Fazer o render usar `activeFont.glyphs`.
- Usar `advance`, `offsetX`, `offsetY`, `defaultLetterSpacing`.
- Remover escala durante o render.

### Fase 4: editor de fonte

- Editor passa a editar a fonte ativa.
- Adicionar controles de `width`, `advance`, `offsetX`, `offsetY`.
- Adicionar linhas-guia de baseline, ascent, descent, capHeight e xHeight.

### Fase 5: importar/exportar JSON

- Exportar fonte ativa.
- Importar fonte JSON.
- Validar estrutura.
- Permitir escolher fontes importadas na biblioteca.

### Fase 6: composicao e Unicode

- Permitir adicionar qualquer caractere.
- Criar acentos e marcas como glifos.
- Implementar `composites`.
- Gerar glifos compostos editaveis.

### Fase 7: exportadores para hardware

- C/C++ row-major.
- C/C++ column-major.
- Hex por linha.
- Mapa compacto com metadados.

## Estado atual do prototipo

No momento, o app ja tem:

- simulador de letreiro LED
- controles salvos em `localStorage`
- fonte base 5x7
- editor visual de caractere para a altura atual
- overrides por caractere e tamanho salvos em `localStorage`

O proximo passo arquitetural e migrar de overrides soltos para fontes projetadas completas.

## Decisoes em aberto

- O editor deve permitir glifos com altura diferente da fonte ou sempre editar dentro de `metrics.height`?
- Fontes monoespacadas devem forcar `advance` global ou apenas sugerir `defaultAdvance`?
- Como representar kerning, se algum dia for necessario?
- O exportador para hardware deve priorizar linhas ou colunas?
- O app deve armazenar varias fontes no navegador ou exigir export manual?
- Como lidar com normalizacao Unicode: `Á` precomposto versus `A` + acento combinante?

## Decisao inicial sobre kerning

Kerning nao entra na primeira versao. Para letreiro LED, `advance` por glifo e `defaultLetterSpacing` provavelmente bastam. Se necessario no futuro, o formato pode receber:

```json
{
  "kerning": {
    "AV": -1,
    "To": -1
  }
}
```

## Decisao inicial sobre Unicode

O formato deve aceitar chaves Unicode diretamente. Para exportacao e validacao, cada glifo pode informar `codepoint`.

Caracteres precompostos, como `Á`, devem ser suportados como glifos finais. Caracteres combinantes podem ser tratados futuramente por normalizacao e `composites`.
