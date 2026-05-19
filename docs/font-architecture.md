# Arquitetura de fontes bitmap para letreiro LED

Este documento registra as decisões de produto e arquitetura para transformar o simulador em um editor/exportador de fontes bitmap para letreiros LED reais.

## Objetivo

O sistema deve permitir que uma pessoa:

1. Escolha uma fonte base existente.
2. Projete essa fonte para uma altura de letra adequada ao letreiro atual.
3. Ajuste métricas globais da fonte projetada.
4. Edite glifos individualmente em uma grade de LEDs.
5. Crie caracteres acentuados, cedilha, símbolos e outros caracteres Unicode.
6. Teste a fonte no simulador.
7. Exporte e importe a fonte para reutilização ou uso em hardware real.

O foco do modelo é fonte bitmap, não fonte vetorial. O render final não deve reinterpretar contornos nem rasterizar fontes do sistema. Ele deve apenas desenhar glifos bitmap já definidos.

## Decisões principais

### Fonte, não override solto

Um conjunto de caracteres para uma altura específica deve ser tratado como uma fonte completa.

Hoje o app salva fontes completas dentro de uma biblioteca local. A arquitetura usa:

- `baseFont`: fonte original, normalmente somente leitura.
- `projectedFont`: fonte gerada a partir da base para uma altura alvo.
- `activeFont`: fonte usada atualmente pelo letreiro.
- `fontLibrary`: coleção de fontes base, fontes importadas e fontes customizadas.

Uma família de fonte agrupa uma ou mais fontes completas em alturas diferentes. A interface principal trabalha por família; o render escolhe a melhor instancia para a altura ativa.

### Uma fonte projetada é editável

Ao escolher uma fonte base e uma altura, o sistema deve gerar uma nova fonte bitmap naquela altura. Essa fonte gerada vira o material editável.

Exemplo:

- Base: `classic-5x7`
- Altura alvo: `16`
- Fonte gerada: `classic-5x7-projected-11x16`

Depois da geração, o usuário pode editar qualquer glifo sem alterar a fonte base.

### Render simples

O render do letreiro deve receber glifos prontos:

- `rows` define quais LEDs acendem.
- `offsetX` e `offsetY` posicionam o bitmap.
- `advance` move o cursor para o próximo caractere.
- `defaultLetterSpacing` adiciona espaço global se desejado.

O render não deve decidir como uma letra deve ser escalada enquanto desenha a frase. A escala/projeção pertence a etapa de criação da fonte.

## Modelo de dados proposto

### Fonte individual

```json
{
  "format": "led-matrix-font",
  "version": 1,
  "id": "custom-16",
  "name": "Custom 16",
  "description": "Fonte bitmap para letreiro LED",
  "author": "Usuário",
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

### Pacote de família

O formato principal de importação/exportação é a família inteira:

```json
{
  "format": "led-matrix-font-family",
  "version": 1,
  "familyId": "custom-led",
  "familyName": "Custom LED",
  "exportedAt": "2026-05-16T00:00:00.000Z",
  "fonts": [
    {
      "format": "led-matrix-font",
      "version": 1,
      "id": "custom-led-19px",
      "familyId": "custom-led",
      "familyName": "Custom LED",
      "name": "Custom LED - 19px"
    }
  ]
}
```

Cada item de `fonts` deve ser uma fonte individual válida. Importar uma família substitui as variações customizadas existentes daquela família. A importação de uma fonte individual ainda é aceita como compatibilidade.

## Campos obrigatórios

Para uma fonte ser renderizável e exportável, estes campos devem existir:

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

## Campos importantes desde o início

Mesmo que a primeira UI não edite tudo, o formato deve nascer com suporte para:

- `metrics.ascent`
- `metrics.descent`
- `metrics.capHeight`
- `metrics.xHeight`
- `glyphs[char].anchors`
- `glyphs[char].category`
- `glyphs[char].codepoint`
- `composites`

Esses campos permitem acentos, cedilha, minúsculas, símbolos e outros alfabetos sem quebrar o formato depois.

## Conceitos de métrica

### height

Altura total da linha da fonte em LEDs. Define o espaço vertical reservado para renderizar texto.

### baseline

Linha onde os caracteres "sentam". Maiúsculas normalmente terminam perto da baseline. Cedilhas e descendentes podem passar abaixo.

No JSON interno, `baseline` é armazenado como coordenada 0-based a partir do topo para simplificar cálculos. Na interface do editor, o campo mostra a posição visual 1-based: uma baseline interna `12` aparece como `13`, porque a linha é desenhada abaixo da 13a linha de pixels.

### ascent

Quantidade de LEDs acima da baseline. Normalmente inclui maiúsculas e acentos.

### descent

Quantidade de LEDs abaixo da baseline. Usado por cedilha, `g`, `p`, `q`, `y` e marcas inferiores.

### capHeight

Altura visual das maiúsculas sem acento, como `A`, `B`, `M`.

### xHeight

Altura visual de minúsculas como `x`, `a`, `e`, quando a fonte tiver minúsculas.

### width

Largura real do bitmap do glifo.

### advance

Quanto o cursor anda depois que o glifo é desenhado. Pode ser maior que `width` para criar espaço natural.

Em modo monoespaçado, a UI bloqueia o `advance` individual e usa `metrics.defaultAdvance` para todos os glifos. Em modo proporcional, cada glifo pode ter seu próprio `advance`.

### defaultLetterSpacing

Quantidade de colunas vazias adicionadas entre caracteres durante o render. O editor expõe esse valor como **Espaçamento padrão**.

No preview da fonte, esse espaçamento aparece como colunas apagadas mais escuras em um letreiro contínuo. Isso evita confundir espaçamento com aumento real da largura do glifo.

### offsetX

Deslocamento horizontal do bitmap em relação ao cursor.

### offsetY

Deslocamento vertical do bitmap dentro da linha da fonte.

### anchors

Pontos de encaixe para composição visual. Exemplos:

- `accent`: posição para acento acima.
- `cedilla`: posição para cedilha abaixo.
- `top`: topo óptico do glifo.
- `center`: centro óptico.

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

O editor deve permitir adicionar qualquer caractere digitável. Para caracteres compostos, a fonte pode ter:

1. Um glifo final desenhado manualmente.
2. Uma regra em `composites`.
3. Ambos, com o glifo manual tendo prioridade no render/export.

## Composição de acentos

Caracteres compostos podem ser gerados a partir de uma base e marcas.

Exemplos:

- `Á` = `A` + `´`
- `Ã` = `A` + `~`
- `Ç` = `C` + `¸`
- `ã` = `a` + `~`

O fluxo recomendado:

1. Gerar o caractere composto usando anchors.
2. Criar um glifo bitmap final.
3. Permitir edição manual do resultado.
4. Salvar o glifo final na fonte.

Assim, a regra ajuda a criar, mas o hardware recebe um mapa pronto e simples.

## Jornada do usuário

### 1. Escolher fonte base

O usuário escolhe uma fonte disponível na biblioteca:

- `classic-5x7`
- fontes futuras importadas
- fontes customizadas salvas

### 2. Projetar fonte

O usuário escolhe altura alvo e parâmetros iniciais:

- altura da fonte
- baseline
- ascent/descent
- capHeight/xHeight
- modo proporcional ou monoespaçado
- advance padrão
- espaço entre letras
- espaço entre palavras

O sistema cria uma fonte projetada.

### 3. Ajustar métricas globais

O editor mostra linhas-guia:

- topo da fonte
- ascent
- capHeight
- xHeight
- baseline
- descent
- limite inferior

Essas guias devem ser visuais e ajustáveis.

### 4. Editar glifos

Para cada caractere, o usuário pode:

- clicar LEDs para acender/apagar
- alterar largura
- alterar advance
- alterar offsetX/offsetY
- ajustar anchors
- clonar outro caractere
- apagar caracteres individuais, exceto espaço e fallback
- resetar para a projeção original

O campo de novo caractere aceita vários caracteres de uma vez. O app cria todos os glifos faltantes e seleciona o último da sequência.

### 5. Gerar caracteres derivados

O editor pode ter ações como:

- gerar acentos para maiúsculas
- gerar acentos para minúsculas
- gerar cedilha
- criar pontuação/símbolos básicos

### 6. Testar no letreiro

O campo de frase usa a fonte ativa. Se houver caracteres sem glifo, o sistema deve avisar:

```text
Faltando na fonte: ç, ã, #
```

### 7. Exportar/importar

O usuário pode exportar a família inteira como JSON. Importar deve validar:

- formato
- versão
- métricas obrigatórias
- integridade dos glifos
- consistência entre `width`, `height` e `rows`

O app também aceita uma fonte individual antiga e a normaliza para a biblioteca atual.

## Exportação para hardware real

O JSON é o formato-fonte principal. A partir dele, podem existir exportadores:

- JSON compacto
- C/C++ arrays para Arduino/ESP32
- bytes por coluna
- bytes por linha
- hexadecimal por glifo
- CSV ou texto simples para debug

Decisao: exportadores de hardware devem ser derivados da fonte validada, não de estado visual temporário.

## Plano de implementação

### Fase 1: formalizar fontStore

- Criar estrutura `fontStore`.
- Converter `matrixFont5x7` em `baseFont`.
- Criar `activeFont`.
- Manter o comportamento visual atual.

### Fase 2: projetar fontes

- Criar `projectFont(baseFont, options)`.
- Salvar fontes projetadas no `localStorage`.
- Substituir overrides por fontes customizadas.
- Quando uma fonte estiver projetada por altura de letra menor que o letreiro,
  derivar/materializar uma nova família com `height` igual a altura do letreiro.
  Os pixels projetados entram centralizados no canvas completo, deixando linhas
  editáveis acima e abaixo para acentos, cedilha e ajustes manuais.

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

### Fase 6: composição e Unicode

- Permitir adicionar qualquer caractere.
- Criar acentos e marcas como glifos.
- Implementar `composites`.
- Gerar glifos compostos editáveis.

### Fase 7: exportadores para hardware

- C/C++ row-major.
- C/C++ column-major.
- Hex por linha.
- Mapa compacto com metadados.

## Estado atual do protótipo

No momento, o app já tem:

- simulador de letreiro LED
- controles salvos em `localStorage`
- fonte base 5x7
- biblioteca de fontes em `localStorage`
- editor visual de fonte/glifo em tela inteira
- derivação de fonte projetada com nome escolhido pelo usuário
- salvar como para duplicar uma família
- apagar famílias customizadas
- importação/exportação de família inteira
- modo monoespaçado com `advance` bloqueado
- modo proporcional/adaptado com `advance` por glifo
- cópia/cola de matriz de caractere para criar variantes e acentos
- adição de vários caracteres de uma vez
- exclusão de caracteres individuais com proteção para espaço e fallback
- espaçamento padrão editável com preview visual em letreiro contínuo
- editor reorganizado com parâmetros gerais próximos da grade do caractere
- toolbox por ícones para operações frequentes do caractere
- layout responsivo com redução de grid, campos e ícones antes de empilhar

## Decisões em aberto

- O editor deve permitir glifos com altura diferente da fonte ou sempre editar dentro de `metrics.height`?
- Como representar kerning, se algum dia for necessário?
- O exportador para hardware deve priorizar linhas ou colunas?
- Como lidar com normalização Unicode: `Á` precomposto versus `A` + acento combinante?

## Decisão inicial sobre kerning

Kerning não entra na primeira versão. Para letreiro LED, `advance` por glifo e `defaultLetterSpacing` provavelmente bastam. Se necessário no futuro, o formato pode receber:

```json
{
  "kerning": {
    "AV": -1,
    "To": -1
  }
}
```

## Decisão inicial sobre Unicode

O formato deve aceitar chaves Unicode diretamente. Para exportação e validação, cada glifo pode informar `codepoint`.

Caracteres precompostos, como `Á`, devem ser suportados como glifos finais. Caracteres combinantes podem ser tratados futuramente por normalização e `composites`.
