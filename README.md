# Buscador de Carros

Um buscador de carros para compra em que a pessoa escreve do jeito dela, como "Dolphin em SP por uns 100 mil", e sempre sai com um próximo passo, mesmo quando o carro que ela quer está caro demais ou longe demais.

**No ar:** [tech-challenge-klubi.vercel.app](https://tech-challenge-klubi.vercel.app)

## Experimente

| Cenário | Busca pronta |
|---|---|
| 1. O carro existe | [BYD Dolphin em SP por uns 100 mil](https://tech-challenge-klubi.vercel.app/?q=BYD+Dolphin+em+SP+por+uns+100+mil) |
| 2. O carro existe, mas acima do orçamento | [Dolphin até 80 mil](https://tech-challenge-klubi.vercel.app/?q=Dolphin+at%C3%A9+80+mil) |
| 3. O carro existe, mas em outra cidade | [Civic em São Paulo](https://tech-challenge-klubi.vercel.app/?q=Civic+em+S%C3%A3o+Paulo) |
| Busca vaga, interpretada por IA | [algo econômico pra família](https://tech-challenge-klubi.vercel.app/?q=algo+econ%C3%B4mico+pra+fam%C3%ADlia) |

No caso 2, o Dolphin continua em destaque, com quanto passa do orçamento, e logo abaixo aparecem os hatches que cabem nos R$ 80 mil. No caso 3, o Civic aparece no Rio de Janeiro, e o primeiro parecido é um sedã em São Paulo. Todo card termina no botão de simular o consórcio.

## Como Rodar

É preciso ter Node.js 22.18 ou mais recente.

```bash
npm install
cp .env.example .env   # opcional: só para ligar a IA
npm run dev            # http://localhost:3000
```

A IA é opcional. Sem ela, a busca funciona normalmente. Para ligá-la, preencha no `.env` o endpoint de chat do provedor (`AI_API_URL`, terminando em `/chat/completions`), a chave (`AI_API_KEY`) e o modelo (`AI_MODEL`). Serve qualquer provedor compatível com a API de chat da OpenAI. O próprio `.env.example` explica cada variável.

```bash
npm test                     # testes do parser, da ordenação e da IA
npm run lint
npm run build && npm start   # versão de produção
```

## Decisões Técnicas e de Experiência

A história completa das decisões, a arquitetura e o diário do projeto estão em [`docs/documentacao.md`](docs/documentacao.md). Em resumo:

- **O buscador é a porta de entrada do consórcio.** A Klubi vende consórcio, e quem busca um carro está a poucos passos de uma compra grande. Por isso a busca nunca termina em lista vazia, e todo card leva à simulação. Os casos 2 e 3, em que um marketplace comum perde o cliente, são justamente os que o consórcio resolve melhor.
- **Ordenar em vez de filtrar.** O carro pedido aparece sempre, mesmo quando não serve, com o motivo: quanto passa do orçamento ou em que cidade está. Os parecidos vêm na ordem mesma categoria, mesma cidade e dentro do orçamento, cada um com etiquetas dizendo por que está ali.
- **Parser primeiro, IA só quando precisa.** Preço, cidade, modelo, categoria e combustível são entendidos por código testável, que responde na hora e não custa nada por busca. A IA só entra em buscas vagas, como "algo econômico pra família", e isso protege a margem conforme o volume cresce.
- **A IA nunca escreve o que a pessoa lê.** Ela só devolve filtros, e cada valor é conferido contra a base antes de ser usado. Todo texto da tela sai de um template, porque uma empresa regulada não pode arriscar uma IA prometendo uma condição que não existe.
- **Sem dependência de fornecedor.** O provedor de IA é trocável pelo `.env`, e a aplicação roda em qualquer servidor Node. A Vercel é a escolha de deploy, não uma dependência.
- **Dados que permitem recomendar.** A base ganhou categoria e combustível, para "parecido" significar mais do que "preço próximo". As fotos são das versões vendidas no Brasil, com créditos aos autores.
- **Tudo na URL.** Busca e filtros são formulários GET: a busca pode ser compartilhada, o botão de voltar funciona e a página responde antes do JavaScript carregar.
- **Os casos da avaliação são testes.** Os três cenários do desafio, a leitura dos filtros e a conferência das respostas da IA rodam com o executor de testes nativo do Node.

## Plano de Negócios

As premissas numéricas abaixo são de mercado e precisariam ser validadas com os números reais da Klubi.

### 1. Modelo de negócios

O buscador é gratuito para quem compra e funciona como topo de funil do consórcio. A receita principal vem da taxa de administração das cotas vendidas a partir dele. Ela é diluída nas mensalidades ao longo do plano e costuma ficar entre 10% e 20% do crédito.

Há duas receitas complementares:
- **Seguro auto:** a Klubi também é corretora de seguros, e quem acaba de escolher um carro é o cliente ideal para isso.
- **Leads para lojistas parceiros:** quem foi contemplado precisa comprar o carro, e o buscador pode levá-lo até o estoque de um parceiro.

### 2. Aquisição dos primeiros usuários

- **A base atual da Klubi.** Mais de 100 mil pessoas já têm consórcio, e quem é contemplado precisa escolher um carro. É o primeiro público, com custo de aquisição próximo de zero, e valida o produto antes de qualquer investimento em mídia.
- **Busca orgânica.** Cada combinação de modelo e cidade vira uma página que responde a buscas como "BYD Dolphin em São Paulo". A estrutura de URL do buscador já permite isso.
- **Mídia paga de alta intenção.** Anúncios só em buscas de quem já decidiu comprar, como "comprar Dolphin usado SP", e não em mídia ampla.
- **Indicação.** Toda busca é um link que dá para compartilhar, e a compra de carro raramente é decidida sozinha.

### 3. Estimativa de CAC

| Premissa | Valor |
|---|---|
| Custo por clique em buscas de carro | R$ 2,00 |
| Visita que chega a simular o consórcio | 5% |
| Simulação que vira cota vendida | 8% |
| **CAC na mídia paga** | **R$ 2,00 ÷ (5% × 8%) = R$ 500** |

Com a base atual, a busca orgânica e as indicações pesando no mix, o objetivo é um CAC médio entre R$ 250 e R$ 350.

### 4. LTV e como maximizá-lo

| Premissa | Valor |
|---|---|
| Crédito médio da cota | R$ 100 mil |
| Taxa de administração ao longo do plano | 15%, ou R$ 15 mil de receita |
| Margem de contribuição | 40%, ou R$ 6 mil |
| Comissão do seguro auto, por 3 anos | cerca de R$ 1,5 mil |
| **LTV** | **cerca de R$ 7,5 mil** |

A relação LTV/CAC fica em 15 vezes só com mídia paga, e entre 20 e 30 vezes com o CAC médio. A ressalva é o prazo: a receita entra ao longo de anos, e a desistência de cotas reduz esse valor. Por isso, a alavanca principal é manter a pessoa no plano até a contemplação.

Para maximizar o LTV:
- vender o seguro no momento da escolha do carro;
- oferecer uma segunda cota ou a troca de carro no fim do plano;
- acompanhar a pessoa até a contemplação, que é quando o valor do consórcio fica concreto.

### 5. Monetização viável

Em ordem de prioridade:
1. taxa de administração das cotas;
2. comissão do seguro auto;
3. leads pagos por lojistas parceiros;
4. anúncios em destaque para lojistas, sempre marcados como tais.

Anúncios de terceiros fora do contexto ficam de fora: tiram atenção da conversão principal e atrapalham a experiência.

### 6. Retenção

- **"Me avise quando chegar":** quando o carro não existe ou não cabe no orçamento, a pessoa pede um aviso, e a busca frustrada vira um motivo para voltar.
- **O carro na hora da contemplação:** quando a cota é contemplada, o buscador já mostra os carros que cabem na carta de crédito. O momento mais importante do consórcio vira o mais fácil.
- **Acompanhamento do plano:** comunicação com consentimento sobre assembleias, lances e a chance de contemplação, para reduzir a desistência de cotas.
