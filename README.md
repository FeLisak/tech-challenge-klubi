# Buscador de Carros

Buscador de carros para compra em que a pessoa escreve do jeito dela, como "Dolphin em SP por uns 100 mil", e sai com um próximo passo mesmo quando o carro que ela quer está caro ou longe demais.

**No ar:** [tech-challenge-klubi.vercel.app](https://tech-challenge-klubi.vercel.app)

O projeto foi desenvolvido com auxílio do Claude Code.

## Experimente

| Cenário | Busca pronta |
|---|---|
| 1. O carro existe | [BYD Dolphin em SP por uns 100 mil](https://tech-challenge-klubi.vercel.app/?q=BYD+Dolphin+em+SP+por+uns+100+mil) |
| 2. O carro existe, mas acima do orçamento | [Dolphin até 80 mil](https://tech-challenge-klubi.vercel.app/?q=Dolphin+at%C3%A9+80+mil) |
| 3. O carro existe, mas em outra cidade | [Civic em São Paulo](https://tech-challenge-klubi.vercel.app/?q=Civic+em+S%C3%A3o+Paulo) |
| Busca vaga, interpretada por IA | [algo econômico pra família](https://tech-challenge-klubi.vercel.app/?q=algo+econ%C3%B4mico+pra+fam%C3%ADlia) |

No caso 2, o Dolphin continua em destaque, com o quanto passa do orçamento, e abaixo aparecem os hatches que cabem nos R$ 80 mil. No caso 3, o Civic aparece no Rio de Janeiro, e o primeiro parecido é um sedã em São Paulo. Todo card tem o botão de simular o consórcio.

## Como Rodar

É preciso ter Node.js 22.18 ou mais recente.

```bash
npm install
cp .env.example .env   # opcional: só para ligar a IA
npm run dev            # http://localhost:3000
```

A IA é opcional, e a busca funciona normalmente sem ela. Para ligá-la, basta preencher no `.env` o endpoint de chat do provedor (`AI_API_URL`, terminando em `/chat/completions`), a chave (`AI_API_KEY`) e o modelo (`AI_MODEL`). Funciona com qualquer provedor compatível com a API de chat da OpenAI, e o `.env.example` explica cada variável.

```bash
npm test                     # testes do parser, da ordenação e da IA
npm run lint
npm run build && npm start   # versão de produção
```

## Decisões Técnicas e de Experiência

O raciocínio completo, a arquitetura e o diário do projeto estão em [`docs/documentacao.md`](docs/documentacao.md). Em resumo:

- A Klubi vende consórcio, então o buscador foi pensado para levar quem está prestes a comprar um carro até a simulação. A busca nunca termina em lista vazia, e todo card tem o caminho para simular. Os casos 2 e 3, em que um marketplace comum perde o cliente, são justamente os que o consórcio resolve melhor.
- Os resultados são ordenados, e não filtrados. O carro pedido sempre aparece, mesmo quando não serve, junto com o motivo: quanto passa do orçamento ou em que cidade está. Os parecidos vêm por mesma categoria, depois mesma cidade, depois dentro do orçamento, com etiquetas explicando por que cada um está ali.
- Preço, cidade, modelo, categoria e combustível são entendidos por um parser, que responde na hora, pode ser testado e não tem custo por busca. A IA entra só nas buscas vagas, como "algo econômico pra família", o que mantém o custo baixo conforme o volume cresce.
- A IA nunca escreve o que aparece na tela. Ela só devolve filtros, cada valor é conferido contra a base, e todo texto exibido vem de template. Uma empresa regulada não pode arriscar uma IA prometendo uma condição que não existe.
- O provedor de IA é trocável pelo `.env`, e a aplicação roda em qualquer servidor Node. A Vercel foi a escolha de deploy.
- A base ganhou categoria e combustível para que "parecido" signifique mais do que "preço próximo". As fotos são das versões vendidas no Brasil, com créditos aos autores.
- Busca e filtros ficam na URL: a busca pode ser compartilhada, o botão de voltar funciona e a página responde antes do JavaScript carregar.
- Os três cenários do desafio, a leitura dos filtros e a conferência das respostas da IA são testes automatizados, rodando com o executor de testes do próprio Node.

## Plano de Negócios

Os números abaixo usam premissas de mercado e precisariam ser validados com os dados reais da Klubi.

### 1. Modelo de negócios

O buscador é gratuito para quem compra e funciona como porta de entrada do consórcio. A receita principal vem da taxa de administração das cotas vendidas a partir dele, que é diluída nas mensalidades ao longo do plano e costuma ficar entre 10% e 20% do crédito.

Há duas receitas complementares:

- Seguro auto: a Klubi também é corretora de seguros, e quem acabou de escolher um carro é o cliente certo para isso.
- Leads para lojistas parceiros: quem foi contemplado precisa comprar o carro, e o buscador pode levá-lo até o estoque de um parceiro.

### 2. Aquisição dos primeiros usuários

- A base atual da Klubi. São mais de 100 mil pessoas com consórcio, e quem é contemplado precisa escolher um carro. É o primeiro público, com custo de aquisição próximo de zero, e permite validar o produto antes de investir em mídia.
- Busca orgânica. Cada combinação de modelo e cidade pode virar uma página que responde a buscas como "BYD Dolphin em São Paulo", e a estrutura de URL do buscador já permite isso.
- Mídia paga de alta intenção, com anúncios apenas em buscas de quem já decidiu comprar, como "comprar Dolphin usado SP".
- Indicação. Toda busca é um link compartilhável, e compra de carro raramente é decidida sozinha.

### 3. Estimativa de CAC

| Premissa | Valor |
|---|---|
| Custo por clique em buscas de carro | R$ 2,00 |
| Visitas que chegam a simular o consórcio | 5% |
| Simulações que viram cota vendida | 8% |
| **CAC na mídia paga** | **R$ 2,00 ÷ (5% × 8%) = R$ 500** |

Com a base atual, a busca orgânica e as indicações entrando no mix, a meta é um CAC médio entre R$ 250 e R$ 350.

### 4. LTV e como maximizá-lo

| Premissa | Valor |
|---|---|
| Crédito médio da cota | R$ 100 mil |
| Taxa de administração ao longo do plano | 15%, ou R$ 15 mil de receita |
| Margem de contribuição | 40%, ou R$ 6 mil |
| Comissão do seguro auto em 3 anos | cerca de R$ 1,5 mil |
| **LTV** | **cerca de R$ 7,5 mil** |

A relação LTV/CAC fica em 15 vezes só com mídia paga, e entre 20 e 30 vezes com o CAC médio. A ressalva é o prazo: a receita entra ao longo de anos, e a desistência de cotas reduz esse valor. Por isso, o que mais pesa é manter a pessoa no plano até a contemplação.

Para aumentar o LTV:

- oferecer o seguro no momento em que o carro é escolhido;
- oferecer uma segunda cota ou a troca de carro no fim do plano;
- acompanhar a pessoa até a contemplação, quando o valor do consórcio fica concreto.

### 5. Monetização viável

Em ordem de prioridade:

1. taxa de administração das cotas;
2. comissão do seguro auto;
3. leads pagos por lojistas parceiros;
4. anúncios em destaque para lojistas, sempre identificados como anúncio.

Anúncios de terceiros fora do contexto ficariam de fora, porque tiram a atenção da simulação e pioram a experiência.

### 6. Retenção

- "Me avise quando chegar": quando o carro não existe ou não cabe no orçamento, a pessoa pede um aviso, e a busca que não deu certo vira um motivo para voltar.
- O carro certo na contemplação: quando a cota é contemplada, o buscador já mostra os carros que cabem na carta de crédito, o que facilita o momento mais importante do consórcio.
- Acompanhamento do plano, com comunicação consentida sobre assembleias, lances e chances de contemplação, para reduzir a desistência de cotas.
