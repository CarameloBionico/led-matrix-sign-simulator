# Letreiro LED

Simulador e editor de fontes bitmap para letreiros LED.

O projeto começou como um simulador simples de frase em matriz LED e evoluiu para uma ferramenta de criação, edição, importação e exportação de famílias de fontes bitmap para uso em letreiros reais.

## O que o app faz hoje

- Simula uma frase em um letreiro de matriz LED.
- Usa uma biblioteca de fontes bitmap persistida no `localStorage`.
- Permite escolher uma família de fonte e projetar a fonte para a altura ativa do letreiro.
- Permite derivar uma fonte projetada com novo nome.
- Permite duplicar uma fonte com **Salvar como**.
- Permite apagar famílias customizadas salvas no navegador.
- Permite editar glifos individualmente em uma grade de LEDs.
- Permite criar vários novos caracteres Unicode digitáveis de uma vez.
- Permite apagar caracteres individuais da fonte, exceto espaço e fallback.
- Permite copiar e colar a matriz de um caractere para criar variantes com acento.
- Permite desfazer/refazer edições de pixels no caractere em edição.
- Permite alternar entre fonte monoespaçada e proporcional/adaptada.
- Permite ajustar o espaçamento padrão entre letras na fonte.
- Mostra o preview dos caracteres em um letreiro contínuo, com colunas de espaçamento destacadas em cor mais escura.
- Organiza métricas globais da fonte perto do editor de caractere para mostrar a relação entre parâmetros e linhas-guia.
- Exporta e importa a família inteira em JSON.

## Fluxo recomendado

1. Ajuste o tamanho do letreiro e a altura desejada da letra.
2. Se a fonte estiver projetada, use **Derivar fonte projetada** e escolha um novo nome.
3. Use **Editar fonte** para ajustar métricas e glifos.
4. Para criar vários caracteres, clique no **+** ao fim da lista de caracteres, digite todos na janela e clique em **Adicionar**.
5. Para criar acentos, selecione uma letra base, copie o caractere, crie ou selecione o caractere acentuado e cole a matriz.
6. Desenhe o acento manualmente e salve o caractere.
7. Use **Salvar como** para criar uma nova família a partir de uma fonte pronta.
8. Use **Exportar família** para gerar backup/compartilhar a família inteira.

## Editor de fonte

O editor abre em tela inteira e separa o trabalho em três áreas:

- **Caracteres**: preview da família em formato de letreiro contínuo. O botão **+** no fim da lista abre a janela para adicionar um ou vários caracteres Unicode.
- **Parâmetros gerais da fonte**: modo monoespaçado, largura padrão, espaçamento, baseline, cap height, ascent, descent e x-height. Esses valores influenciam a grade e as linhas-guia do caractere selecionado.
- **Caractere selecionado**: grade de LEDs, métricas do glifo e toolbox por ícones.

A toolbox do caractere inclui salvar, alternar linhas-guia, desfazer/refazer, copiar/colar matriz, resetar e apagar caractere. O `advance` individual aparece apenas quando a fonte está em modo proporcional; em modo monoespaçado ele fica bloqueado pela largura padrão da fonte.

## Monoespaçada vs proporcional

No editor, o modo **Monoespaçada** bloqueia o `advance` individual dos caracteres. A largura padrão passa a definir o espaço de todos os glifos.

Ao desmarcar **Monoespaçada**, cada caractere pode ter seu próprio `advance`, permitindo fontes proporcionais/adaptadas.

Conceitos importantes:

- `width`: largura real da matriz editável do glifo.
- `advance`: quanto o cursor anda depois de desenhar o glifo.
- `defaultAdvance`: largura/advance padrão usada em modo monoespaçado.
- `defaultLetterSpacing`: quantidade de colunas vazias entre caracteres.

O espaçamento padrão não aumenta a largura real do glifo. Ele é aplicado entre caracteres no render e aparece no preview da fonte como colunas apagadas mais escuras.

## Acentos e Unicode

Hoje o app trabalha com glifos finais por caractere. Para letras acentuadas como `á`, `ã`, `â` e suas versões maiúsculas, cadastre o caractere final e desenhe/salve sua matriz.

Um fluxo prático é:

1. Copiar a letra base, por exemplo `A`.
2. Adicionar o caractere acentuado pelo botão **+**, por exemplo `Á`.
3. Colar a matriz copiada.
4. Desenhar o acento manualmente.
5. Salvar o caractere.

Glifos de acento combinante e composição automática ainda são uma etapa futura.

## Formato de exportação

O formato principal de exportação é um pacote de família:

```json
{
  "format": "led-matrix-font-family",
  "version": 1,
  "familyId": "minha-fonte",
  "familyName": "Minha Fonte",
  "exportedAt": "2026-05-16T00:00:00.000Z",
  "fonts": []
}
```

Cada item de `fonts` é uma fonte bitmap completa em uma altura específica. A importação ainda aceita JSON antigo de fonte única para compatibilidade.

## Documentação

- [Arquitetura de fontes bitmap](docs/font-architecture.md)
- [Plano de execução](docs/implementation-plan.md)

## Direção do projeto

A decisão principal é tratar fontes como famílias com uma ou mais instâncias por altura. O render final deve desenhar glifos bitmap prontos, sem rasterizar fontes vetoriais nem reinterpretar os caracteres durante a exibição.

Exportadores para hardware real ainda devem ser derivados da família/fonte validada, não do estado visual temporário do simulador.
