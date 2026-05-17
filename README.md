# Letreiro LED

Simulador e editor de fontes bitmap para letreiros LED.

O projeto comecou como um simulador simples de frase em matriz LED e evoluiu para uma ferramenta de criacao, edicao, importacao e exportacao de familias de fontes bitmap para uso em letreiros reais.

## O que o app faz hoje

- Simula uma frase em um letreiro de matriz LED.
- Usa uma biblioteca de fontes bitmap persistida no `localStorage`.
- Permite escolher uma familia de fonte e projetar a fonte para a altura ativa do letreiro.
- Permite derivar uma fonte projetada com novo nome.
- Permite duplicar uma fonte com **Salvar como**.
- Permite apagar familias customizadas salvas no navegador.
- Permite editar glifos individualmente em uma grade de LEDs.
- Permite criar novos caracteres Unicode digitaveis, como letras acentuadas, cedilha, `#` ou `_`.
- Permite copiar e colar a matriz de um caractere para criar variantes com acento.
- Permite alternar entre fonte monoespacada e proporcional/adaptada.
- Exporta e importa a familia inteira em JSON.

## Fluxo recomendado

1. Ajuste o tamanho do letreiro e a altura desejada da letra.
2. Se a fonte estiver projetada, use **Derivar fonte projetada** e escolha um novo nome.
3. Use **Editar fonte** para ajustar metricas e glifos.
4. Para criar acentos, selecione uma letra base, copie o caractere, crie o caractere acentuado e cole a matriz.
5. Desenhe o acento manualmente e salve o caractere.
6. Use **Salvar como** para criar uma nova familia a partir de uma fonte pronta.
7. Use **Exportar familia** para gerar backup/compartilhar a familia inteira.

## Monoespacada vs proporcional

No editor, o modo **Monoespacada** bloqueia o `advance` individual dos caracteres. A largura padrao passa a definir o espaco de todos os glifos.

Ao desmarcar **Monoespacada**, cada caractere pode ter seu proprio `advance`, permitindo fontes proporcionais/adaptadas.

Conceitos importantes:

- `width`: largura real da matriz editavel do glifo.
- `advance`: quanto o cursor anda depois de desenhar o glifo.
- `defaultAdvance`: largura/advance padrao usada em modo monoespacado.

## Formato de exportacao

O formato principal de exportacao e um pacote de familia:

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

Cada item de `fonts` e uma fonte bitmap completa em uma altura especifica. A importacao ainda aceita JSON antigo de fonte unica para compatibilidade.

## Documentacao

- [Arquitetura de fontes bitmap](docs/font-architecture.md)
- [Plano de execucao](docs/implementation-plan.md)

## Direcao do projeto

A decisao principal e tratar fontes como familias com uma ou mais instancias por altura. O render final deve desenhar glifos bitmap prontos, sem rasterizar fontes vetoriais nem reinterpretar os caracteres durante a exibicao.

Exportadores para hardware real ainda devem ser derivados da familia/fonte validada, nao do estado visual temporario do simulador.
