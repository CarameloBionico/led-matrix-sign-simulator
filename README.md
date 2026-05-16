# Letreiro LED

Simulador e editor de fontes bitmap para letreiros LED.

O projeto comecou como um simulador simples de frase em matriz LED e esta evoluindo para uma ferramenta de criacao, edicao, importacao e exportacao de fontes bitmap para uso em letreiros reais.

## Documentacao

- [Arquitetura de fontes bitmap](docs/font-architecture.md)
- [Plano de execucao](docs/implementation-plan.md)

## Direcao do projeto

A decisao principal e tratar cada conjunto de caracteres em uma altura especifica como uma fonte completa, com metricas, glifos, acentos, caracteres especiais e formato exportavel.

O render final deve desenhar glifos bitmap prontos, sem rasterizar fontes vetoriais nem reinterpretar os caracteres durante a exibicao.
