# Buscador de Carros

Este documento conta o projeto do começo ao fim: o que o desafio pedia, como o problema foi lido pensando na Klubi, as decisões tomadas, a arquitetura que saiu delas e o diário do que foi construído. O README do repositório é um resumo daqui.

O projeto foi desenvolvido com auxílio do Claude Code.

## O Desafio

A Klubi pediu uma aplicação para buscar carros à venda, usando como base um JSON fornecido por eles. Podia ser web ou um agente de IA, e o foco declarado é a experiência de quem busca.

A avaliação passa por três cenários:

1. Procurar um carro que existe no JSON.
2. Procurar um carro que existe, mas com um valor abaixo do disponível.
3. Procurar um carro que existe, mas em outra localidade.

Nos dois últimos, o enunciado pede para pensar em como convencer a pessoa a comprar mesmo assim, com sugestões parecidas, filtros ajustáveis ou uma IA que entenda a intenção da busca.

Os diferenciais são uso de IA, deploy na nuvem, cuidado com design e usabilidade, e organização de código e commits. A entrega é um repositório público com um README explicando como rodar, mostrando o funcionamento, justificando as decisões e respondendo a um Plano de Negócios.

## O Que Está em Jogo

O ponto de partida foi entender quem é a Klubi. Ela é uma administradora de consórcio digital, e o consórcio de carros dela cobre créditos de R$ 50 mil a R$ 200 mil. Todos os carros da base, de R$ 68.990 a R$ 122.000, cabem nessa faixa.

Isso muda a leitura do desafio. Para uma empresa de consórcio, o buscador em si não gera receita: ele serve para levar quem está prestes a comprar um carro até a simulação. Por isso a busca foi considerada bem-sucedida quando a pessoa sai com um próximo passo, e não apenas quando ela encontra o carro.

Vistos assim, os casos 2 e 3 ganham outro peso. São as situações em que um marketplace comum perde o cliente, porque o carro está caro ou longe demais, e são também as situações em que o consórcio tem o que oferecer: o preço vira mensalidade, e o carro que a pessoa queria continua a um clique da simulação.

## Como as Decisões Foram Tomadas

A primeira ideia foi Next.js na Vercel, com a API do Claude interpretando toda busca. Funcionaria, mas cada busca teria um custo, e esse custo cresceria junto com o uso. Além disso, se o provedor de IA caísse, a busca inteira cairia junto.

A pergunta que mudou o desenho foi se a IA precisava mesmo estar no caminho principal. Com 10 carros e 6 cidades, quase tudo que alguém digitaria pode ser entendido por um parser simples: preço ("100 mil", "até 90k"), cidade ("SP", "sampa") e modelo. Esse caminho não tem custo por busca, responde na hora e pode ser testado. A IA ficou só para o que o parser não entende, como "algo econômico pra família". Com isso, apenas uma parte das buscas gera custo de IA, o que faz diferença na margem quando o volume cresce. A resposta rápida também ajuda na conversão, já que quem espera menos desiste menos.

O código também não ficou preso a um provedor de IA. Qualquer serviço compatível com a API de chat da OpenAI funciona, e trocar de provedor é trocar variáveis de ambiente. Se um fornecedor aumentar o preço, a troca não exige mexer no código.

A segunda mudança veio dos dados. Com apenas marca, modelo, preço e cidade, "carro parecido" significaria só "preço parecido", e quem procurasse um Dolphin elétrico receberia um Kwid como sugestão. Sugestões ruins fazem a pessoa deixar de confiar nas seguintes, então a base ganhou categoria e combustível.

A terceira veio de voltar à Klubi: se o buscador existe para levar pessoas ao consórcio, todo card precisa ter um caminho até a simulação.

A primeira versão desta arquitetura era bem mais extensa, com camadas de segurança, pesos de ranking e integrações que o desafio não pedia. Para 10 carros, era exagero, e foi cortada. A regra passou a ser resolver primeiro o que o desafio pede, da forma mais simples que funcione, e só depois acrescentar o que aumenta a chance de a busca virar venda.

## Visão Geral

```mermaid
flowchart TD
    S1(["1 · A busca"])
    B1["Texto livre ou filtros<br/>tudo fica na URL"]
    B2["Parser extrai modelo, cidade e preço"]
    B3{"Entendeu algo?"}
    B4["IA devolve só filtros<br/>valores fora da base são descartados"]

    S2(["2 · O resultado"])
    R1{"O carro pedido existe na base?"}
    C1["Cabe no preço e está na cidade<br/>aparece em destaque"]
    C2["Acima do orçamento<br/>mostra a diferença e parecidos que cabem"]
    C3["Em outra cidade<br/>mostra onde está e parecidos na cidade da pessoa"]
    C4["Não existe<br/>mostra os mais parecidos"]

    S3(["3 · O próximo passo"])
    P1["Todo card leva a uma simulação de consórcio<br/>a busca vira oportunidade de venda"]

    S1 --> B1 --> B2 --> B3
    B3 -- sim --> S2
    B3 -- não --> B4 --> S2
    S2 --> R1
    R1 -- "sim, tudo bate" --> C1
    R1 -- "sim, preço acima" --> C2
    R1 -- "sim, outra cidade" --> C3
    R1 -- não --> C4
    C1 --> S3
    C2 --> S3
    C3 --> S3
    C4 --> S3
    S3 --> P1

    classDef secao fill:#111827,stroke:#111827,color:#fff,font-weight:bold
    classDef ok fill:#14532d,stroke:#22c55e,color:#fff
    classDef modelo fill:#1e3a5f,stroke:#60a5fa,color:#fff
    class S1,S2,S3 secao
    class C1,P1 ok
    class B4 modelo
```

## A Base

O `data/cars.json` veio com 10 carros e os campos `Name`, `Model`, `Image`, `Price` e `Location`. Os preços vão de R$ 68.990 (Kwid) a R$ 122.000 (Renegade), metade dos carros está em São Paulo, e as demais cidades são Campinas, Rio de Janeiro, Belo Horizonte, Curitiba e Porto Alegre, com um carro cada. Todas as imagens apontavam para `exemplo.png`.

Os campos originais foram mantidos. Entraram apenas `Category` e `Fuel`, no mesmo padrão de nome, que era o mínimo necessário para sugerir carros parecidos:

| Carro | `Category` | `Fuel` |
|---|---|---|
| BYD Dolphin | hatch | elétrico |
| Toyota Corolla | sedan | flex |
| Volkswagen T-Cross | suv | flex |
| Honda Civic | sedan | gasolina |
| Chevrolet Onix | hatch | flex |
| Hyundai HB20 | hatch | flex |
| Renault Kwid | hatch | flex |
| Fiat Pulse | suv | flex |
| Jeep Renegade | suv | flex |
| Peugeot 208 | hatch | flex |

As imagens foram trocadas por fotos reais, como o desafio pede. Em anúncio de carro, a foto é a primeira coisa que a pessoa olha. As fotos ficam em `public/cars/`, e não em links externos, para que nenhuma imagem quebre durante a avaliação.

## A Busca

A pessoa pode escrever livremente ("Dolphin em SP por uns 100 mil") ou ajustar os filtros de modelo, cidade, categoria e preço máximo. Os dois caminhos terminam em filtros na URL, o que deixa a busca compartilhável, algo útil numa compra que raramente é decidida sozinha.

O parser trabalha com o texto em minúsculas e sem acento, e procura:

- Preço: um número com ou sem "mil" ou "k", ou precedido de "R$". Com "até", vira teto. Sem "até", é tratado como aproximado e aceita até 10% acima, porque quem fala "uns 100 mil" não descartaria um carro de R$ 100.500. Um número solto só vira preço se tiver cara de preço, já que "208" é modelo.
- Cidade: o nome ou um apelido comum ("SP", "sampa", "rio", "bh", "poa").
- Modelo e marca: o nome como está na base, apelidos como "VW" e erros de digitação comuns ("dolfin", "t cross", "hb 20").
- Categoria e combustível: "SUV", "sedã", "hatch", "elétrico", "flex".

O que o parser entendeu já aparece preenchido nos filtros, então a pessoa vê a interpretação e corrige se precisar. Uma busca mal entendida pode fazer alguém ir embora achando que o carro não existe.

## Os Três Casos de Teste

O resultado nunca é uma lista vazia. Em vez de filtrar, o sistema ordena: primeiro o carro pedido, depois os parecidos, com prioridade para mesma categoria, depois mesma cidade, depois dentro do orçamento.

O carro pedido continua aparecendo mesmo quando não serve. Ele é a referência do que a pessoa quer, e escondê-lo seria desistir dessa venda cedo demais.

| Caso | Exemplo de busca | O que aparece | Por que ajuda a vender |
|---|---|---|---|
| 1. O carro existe | "BYD Dolphin em SP por uns 100 mil" | O Dolphin em destaque, com o botão de simular o consórcio | A pessoa encontrou o que queria; o trabalho é não atrapalhar |
| 2. Valor abaixo do disponível | "Dolphin até 80 mil" | O Dolphin marcado "R$ 19.990 acima do seu orçamento" e, abaixo, os hatches que cabem nos R$ 80 mil, como o HB20 em SP | Ela vê dois caminhos: um parecido que cabe hoje ou o carro que quer, pago em mensalidades |
| 3. Outra localidade | "Civic em São Paulo" | O Civic marcado "disponível no Rio de Janeiro" e, abaixo, os sedãs em São Paulo, como o Corolla | A distância deixa de ser motivo para desistir: há um sedã perto, e o Civic continua a um clique da simulação |

Quando a busca não traz nada reconhecível, como um modelo fora da base, a tela avisa, mostra todos os carros e sugere usar o nome do carro ou os filtros. Se ao menos o preço ou a cidade forem reconhecidos, a lista já vem ordenada por eles.

## A Tela

É uma página só: busca no topo, filtros abaixo e os resultados em cards com foto, nome, preço, cidade e o botão de simular o consórcio daquele carro.

O layout foi pensado primeiro para o celular, onde acontece a maior parte das buscas por carro. No celular os cards ficam em uma coluna, e no desktop viram grade.

Enquanto a próxima busca carrega, inclusive quando a IA está respondendo, aparece um esqueleto dos cards. Tela parada é o momento em que as pessoas fecham a aba.

Há algumas microinterações: os cards entram em cascata, sobem levemente com o mouse em cima, e os botões reagem ao clique. Quem configurou o sistema para reduzir movimento não vê as animações.

Todo campo tem rótulo, toda foto tem texto alternativo, e a navegação funciona pelo teclado.

## A IA

A IA só entra quando o parser não descobre que carro a pessoa quer: nenhum modelo, marca, categoria ou combustível no texto, com pelo menos duas palavras. Se a pessoa já ajustou os filtros, a IA também fica de fora, porque a intenção já está explícita.

A IA recebe o texto e a lista do que existe na base, e devolve apenas filtros em JSON: modelo, cidade, categoria, combustível e preço máximo. O servidor descarta qualquer valor que não esteja na base, então, no pior caso, uma resposta errada vira um filtro que a pessoa corrige.

A chamada usa temperatura 0 e tem limite de tempo. Se o provedor falhar, demorar ou não estiver configurado, a busca segue só com o parser.

Abaixo da busca ficam exemplos clicáveis. Três são os casos de teste do desafio, e dois são buscas vagas, "algo econômico pra família" e "carro espaçoso pra viajar", que caem no caminho da IA. Quando a IA preenche algum filtro, aparece a marcação "Interpretado por IA".

## Segurança

O cuidado de segurança se concentra na IA, que é onde estão o custo e o risco para a marca:

- A chave da IA fica só no servidor, em variável de ambiente, e nunca vai para o repositório. Uma chave vazada é uma conta que outra pessoa usa e a empresa paga.
- A resposta da IA nunca aparece na tela. Ela só vira filtro, e só se o valor existir na base. Todo texto exibido vem de template, porque uma empresa regulada pelo Banco Central não pode ter uma IA prometendo preço ou condição que não existe.
- O texto da busca tem tamanho máximo, e a conta do provedor deve operar com saldo pré-pago ou limite de gasto, o que garante um teto de custo mesmo em caso de abuso.

## Onde Roda

A stack é Next.js com TypeScript e Tailwind, e roda em qualquer servidor com Node.js 22.18 ou mais recente. O código não usa recursos exclusivos de plataforma, e o `cars.json` vai junto no build, então não há banco nem serviço externo obrigatório. O mesmo `npm run build` seguido de `npm start` funciona na Vercel, em outra hospedagem, numa máquina virtual ou num contêiner. A Vercel foi escolhida pela integração com o GitHub, mas trocar de hospedagem não exige mudar código.

O único requisito é um servidor Node. Um site estático não serve, porque a página lê a busca a cada requisição e a chave da IA precisa ficar no servidor.

As variáveis de ambiente são apenas as da IA (`AI_API_URL`, `AI_API_KEY`, `AI_MODEL` e a opcional `AI_REQUEST_OPTIONS`), e todas são opcionais.

O parser e a ordenação têm testes que cobrem os três casos do desafio, porque é ali que a avaliação é decidida.

O código está separado por responsabilidade (base, parser, ordenação, IA e interface), cada uma no seu arquivo, e os commits seguem o Conventional Commits, com uma mudança por commit.

## Como Rodar

É preciso ter Node.js 22.18 ou mais recente.

```bash
npm install
cp .env.example .env   # opcional: só para ligar a IA
npm run dev            # http://localhost:3000
```

Para ligar a IA, preencha no `.env`:

| Variável | O que colocar | Obrigatória para a IA |
|---|---|---|
| `AI_API_URL` | O endpoint completo de chat do provedor, terminando em `/chat/completions`. A raiz do provedor não funciona. | Sim |
| `AI_API_KEY` | A chave de API do provedor. | Sim |
| `AI_MODEL` | O nome do modelo, exatamente como o provedor lista em `/models`. | Sim |
| `AI_REQUEST_OPTIONS` | Um JSON somado a cada requisição, para opções do provedor. Em modelos que raciocinam antes de responder, desligar o raciocínio deixa a busca mais rápida e mais barata. | Não |

Se faltar qualquer uma das três obrigatórias, a IA fica desligada e a busca segue só com o parser. Em produção, as mesmas variáveis vão no painel de variáveis de ambiente da hospedagem, já que o `.env` não vai para o repositório.

Outros comandos:

```bash
npm test                     # testes do parser, da ordenação e da IA
npm run lint                 # ESLint
npm run build && npm start   # versão de produção
```

## Detalhes Que Vendem o Carro

Com o desafio resolvido, estas seriam as próximas melhorias, desde que ajudem a busca a virar venda:

- Mensalidade do consórcio no caso 2: trocar "R$ 19.990 a mais" por uma mensalidade estimada, que a pessoa compara com o próprio salário. As premissas do cálculo ficariam no card, e o valor final viria da simulação oficial.
- Distância no caso 3: mostrar "≈ 360 km" em vez de só o nome da cidade.

## Como Saber se Está Funcionando

Para uma empresa de consórcio, o que importa é o que acontece depois da busca. Quatro números bastam para acompanhar isso. Esta versão ainda não coleta nenhum deles, e registrar esses eventos seria o primeiro passo com clientes reais.

- Cliques em "Simular consórcio" por busca, que é a conversão que importa.
- Cliques nas alternativas dos casos 2 e 3, para saber se as sugestões convencem ou só ocupam espaço.
- Buscas por modelos fora da base, que mostram a demanda real e o que valeria ter no catálogo.
- Buscas que precisaram da IA, que mostram o que o parser ainda não entende. Cada caso ensinado ao parser deixa de custar uma chamada de IA.

## O Que Ficou de Fora

Algumas ideias trariam resultado, mas dependem de coisas que um desafio técnico não tem, como dados reais, acesso aos sistemas da Klubi ou tráfego de verdade. Ficaram fora desta versão, mas valeriam a pena:

- Simulação oficial dentro do card, com a mensalidade real calculada pelo sistema da Klubi em vez de uma estimativa. É o número que decide a compra, e cada clique a menos até ele ajuda na conversão. Depende de acesso à API de simulação.
- Comparação entre consórcio e financiamento, mostrando quanto a pessoa paga no total em cada um. É o argumento mais forte da Klubi, já que consórcio não tem juros. Precisa de taxas reais dos dois lados para não virar promessa sem base.
- Um "me avise quando chegar": quando o carro não existe ou não cabe no orçamento, a pessoa deixa o contato para ser avisada, e a busca frustrada vira um contato qualificado, com o carro e a faixa de preço que ela quer. Guardar dados pessoais exige consentimento, armazenamento e cuidados de LGPD que vão além do desafio.
- Alertas de preço e de carros novos, que trazem a pessoa de volta sem gasto com mídia. Dependem do cadastro acima.
- Catálogo real, vindo de parceiros. Com milhares de carros, busca semântica e recomendação personalizada passam a compensar o custo. Com 10 carros fictícios, seriam só custo.
- Teste A/B das mensagens dos casos 2 e 3, para descobrir qual frase converte mais, por exemplo "R$ 19.990 acima do orçamento" ou "a partir de R$ X por mês". Precisa de tráfego real para dar resultado confiável.

## Requisitos da Solução

O enunciado define o mínimo. A solução foi considerada pronta apenas quando atendeu a todos os critérios abaixo, que cobrem o enunciado e vão além dele:

| Requisito | Onde é atendido | Status |
|---|---|---|
| A pessoa encontra o carro escrevendo do jeito dela, com apelidos, erros de digitação e preços aproximados | A Busca | ✅ |
| O carro que existe e cabe na busca aparece em destaque | Os Três Casos de Teste | ✅ |
| Um carro acima do orçamento mostra quanto passa e oferece parecidos que cabem | Os Três Casos de Teste | ✅ |
| Um carro em outra cidade mostra onde está e oferece parecidos por perto | Os Três Casos de Teste | ✅ |
| Nenhuma busca termina em lista vazia | Os Três Casos de Teste | ✅ |
| Toda sugestão explica por que está ali | Os Três Casos de Teste, A Tela | ✅ |
| Todo carro tem um caminho até a simulação do consórcio | A Tela | ✅ |
| Buscas vagas são interpretadas por IA, sem que a busca dependa dela | A IA | ✅ |
| A IA nunca exibe texto próprio nem usa valores que não existem na base | A IA, Segurança | ✅ |
| A base original é preservada, com fotos reais das versões brasileiras e créditos aos autores | A Base, Créditos das Imagens | ✅ |
| A tela funciona bem no celular, dá retorno durante o carregamento e é acessível | A Tela | ✅ |
| A aplicação está publicada e roda em qualquer servidor Node, sem depender de fornecedor | Onde Roda | ✅ |
| Qualquer pessoa consegue rodar o projeto seguindo a documentação | Como Rodar | ✅ |
| Os cenários da avaliação são testes automatizados | Onde Roda, Andamento | ✅ |
| O código é separado por responsabilidade, e o histórico de commits conta a evolução do projeto | Onde Roda | ✅ |
| O repositório é público, e o README traz deploy, instruções, decisões e Plano de Negócios | A Entrega | ✅ |

## A Entrega

O repositório é público, e o README reúne o que o desafio pede:

- como rodar, incluindo o `.env` opcional da IA;
- o link do deploy na Vercel, com uma busca pronta para cada caso de teste;
- um resumo das decisões técnicas e de experiência, que estão completas aqui;
- o Plano de Negócios, que parte da leitura feita em O Que Está em Jogo.

## Créditos das Imagens

As fotos são do Wikimedia Commons, com licenças que permitem uso comercial desde que a autoria seja creditada. Mesmo num projeto pequeno, uma foto sem licença clara seria um risco desnecessário.

| Carro | Versão na foto | Autor | Licença | Fonte |
|---|---|---|---|---|
| BYD Dolphin | Dolphin 2024 | RL GNZLZ | CC BY-SA 2.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:BYD_Dolphin_2024.jpg) |
| Toyota Corolla | 2.0 XEi 2023 | Just a Man | CC BY 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2023_Toyota_Corolla_2.0_XEi_(Brazil).jpg) |
| Volkswagen T-Cross | 170 TSI Trendline 2022 | RL GNZLZ | CC BY-SA 2.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Volkswagen_T-Cross_170_TSi_Trendline_2022.jpg) |
| Honda Civic | Touring 1.5 Turbo 2017 | JasonVogel | CC BY-SA 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Brazilian_Honda_Civic_touring_2017_(cropped).jpg) |
| Chevrolet Onix | RS 2020 | NaBUru38 | CC BY-SA 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Chevrolet_Onix_Mk2_RS_2020_in_Maldonado_-_front.jpg) |
| Hyundai HB20 | 1.0 T-GDi Platinum Plus 2023 | Autosdeprimera | CC BY 3.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2023_Hyundai_HB20_1.0_T-GDi_Platinum_Plus_(Brazil)_front_view.png) |
| Renault Kwid | 1.0 Life 2021 | RL GNZLZ | CC BY-SA 2.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2021_Renault_Kwid_1.0_Life.jpg) |
| Fiat Pulse | 1.0 Turbo 200 Audace 2024 | Just a Man | CC BY 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2024_Fiat_Pulse_1.0_Turbo_200_Audace_(front).jpg) |
| Jeep Renegade | versão brasileira, antes da reestilização | JasonVogel | CC BY-SA 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Brazilian_Jeep_Renegade.jpg) |
| Peugeot 208 | 1.6 Feline 2020 | Garagem do Jabulas | CC BY 3.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2020_Peugeot_208_1.6_EC5_VTi_Feline_(built_in_Argentina).png) |

## Andamento

Este é o diário do projeto. Cada etapa entrou aqui ao terminar, com o que foi feito e o que mudou em relação ao plano.

### 2026-09-28: Arquitetura

A arquitetura foi escrita antes de qualquer código, para que cada etapa tivesse um critério claro de pronto.

### 2026-09-28: Scaffold

O projeto foi criado com Next.js 16, TypeScript, Tailwind 4 e ESLint, usando o App Router. O conteúdo de exemplo do template saiu, e a página ficou em português, com título e descrição do produto.

### 2026-09-28: Base e imagens

O `cars.json` ganhou `Category` e `Fuel`, e o `Image` de cada carro passou a apontar para uma foto em `public/cars/`. As fotos foram escolhidas com critério de anúncio: carro de frente, em três quartos, sem nada cortado.

Na primeira rodada, algumas fotos eram de versões europeias ou híbridas. Todas foram trocadas pelas versões vendidas no Brasil, porque a foto de uma versão estrangeira mostra um carro que a pessoa não vai encontrar na concessionária. O único Civic brasileiro com foto livre era o Touring, movido a gasolina, então o `Fuel` dele foi ajustado para bater com a foto.

### 2026-09-28: Parser e ordenação

O entendimento da busca e a ordenação ficaram em funções puras, separadas da interface: `lib/parse.ts` transforma o texto em filtros, e `lib/rank.ts` ordena a base a partir deles. Como não dependem de tela nem de servidor, os três casos do desafio viraram testes automatizados em `lib/search.test.ts`, com o executor de testes do próprio Node e sem nenhuma dependência nova. Se alguma mudança quebrar um dos casos da avaliação, o teste falha antes do deploy.

Os testes também garantem que nenhuma busca termina em lista vazia e que "208" não é confundido com orçamento.

A preferência do autor é trabalhar com TDD, escrevendo o teste antes do código. Aqui isso não foi possível: com o prazo curto, os testes foram escritos junto com a implementação, com foco em cobrir os casos da avaliação, sem testar cada detalhe do parser.

### 2026-09-28: Interface

A página ficou com um arquivo de rota e quatro componentes: a barra de busca, os filtros, o card do carro e um seletor que aplica o filtro assim que a pessoa escolhe. Busca e filtros são formulários GET, então tudo fica na URL: a busca pode ser compartilhada, o botão de voltar funciona e a página responde antes do JavaScript carregar.

Os filtros já vêm preenchidos com o que o parser entendeu, e o que a pessoa altera neles prevalece sobre o texto. Os valores da URL são conferidos contra a base antes de virar filtro, então um parâmetro inventado é ignorado. Isso também tem teste.

Cada caso de teste tem uma mensagem no topo dos resultados, e o carro pedido aparece em destaque, com foto grande, mesmo quando não cabe no orçamento ou está em outra cidade. Os parecidos vêm abaixo, com etiquetas que explicam por que estão ali: mesma categoria, cabe no orçamento, na sua cidade ou quanto passa do orçamento. O rodapé leva aos créditos das fotos.

O visual é monocromático, com cor só nas etiquetas, para que o destaque fique com o carro. A tela foi conferida no desktop e no celular.

### 2026-09-28: Integração com a IA

A chamada à IA ficou em `lib/ai.ts`, separada do parser e da tela. Ela envia o texto e um resumo do catálogo e recebe apenas filtros em JSON, com temperatura 0, até 300 tokens e 4 segundos de limite. Se faltar chave ou saldo, se o provedor demorar ou se a resposta vier fora do formato, a IA não devolve filtro nenhum e a busca segue com o parser.

Antes de virar filtro, a resposta é conferida: cada valor precisa existir na base. Modelo inventado, cidade fora do catálogo ou texto no lugar do preço são descartados, e isso tem teste.

Quando nem o parser nem a IA reconhecem nada, a tela avisa e sugere usar o nome do carro ou os filtros, em vez de mostrar uma lista sem explicação.

No teste com o provedor real, o primeiro modelo configurado raciocinava antes de responder. O raciocínio consumia todo o limite de tokens, e a resposta chegava vazia depois de seis segundos. Aumentar o limite só deixaria cada busca mais lenta e mais cara. A solução foi a variável opcional `AI_REQUEST_OPTIONS`, um JSON somado à requisição, que neste caso desliga o raciocínio. O código continua sem depender de provedor, e a resposta caiu para cerca de um segundo.

O prompt também ganhou uma tradução das intenções mais comuns: "econômico" puxa os mais baratos, "família" e "viagem" apontam para sedã ou SUV, e "cidade" aponta para hatch. Nos testes, "algo econômico pra família" virou SUV, com o mais barato primeiro, e "quero um carro que não gaste gasolina" virou elétrico. Um texto pedindo para ignorar as instruções não virou filtro nenhum.

### 2026-09-28: Portabilidade e configuração

O primeiro teste com o provedor real falhou porque a URL apontava para a raiz do provedor, e não para o endpoint de chat. O mesmo erro aconteceria com qualquer pessoa rodando o projeto, então o `.env.example` passou a detalhar cada variável e a seção Como Rodar foi escrita. O `package.json` também passou a declarar a versão mínima do Node, e a seção Onde Roda deixa claro que a aplicação roda em qualquer servidor Node.

### 2026-09-28: Deploy

A aplicação foi publicada em [tech-challenge-klubi.vercel.app](https://tech-challenge-klubi.vercel.app) pela integração da Vercel com o GitHub, com as variáveis da IA no painel. Em produção, os três casos de teste respondem em menos de meio segundo, e a busca com IA em cerca de um segundo.

O teste em produção revelou um problema de texto. Quando a pessoa escolhia nos filtros uma categoria diferente da do carro buscado, por exemplo sedã numa busca pelo Dolphin, a seção continuava dizendo "Parecidos com o Dolphin", e os sedãs apareciam como "Mesma categoria". Agora a seção vira "Opções na categoria Sedã", e a etiqueta vira "Categoria escolhida".

### 2026-09-28: Revisão contra o enunciado

O projeto foi revisado item por item contra o README do desafio. Tudo estava coberto, mas alguns detalhes não batiam: a frase do caso 3 dizia "em Rio de Janeiro" em vez de "no Rio de Janeiro", e alguns trechos deste documento descreviam comportamentos diferentes do que o código faz. Tudo foi corrigido, inclusive uma afirmação de que a carta de crédito vale em qualquer cidade, que não havia como confirmar nas regras da Klubi.

### 2026-09-28: README e Plano de Negócios

O README do repositório passou a ser o da entrega: link do deploy com uma busca pronta para cada caso de teste e para a busca com IA, como rodar, um resumo das decisões e o Plano de Negócios. Os detalhes continuam aqui, para que o README possa ser lido em poucos minutos.

O Plano de Negócios parte da leitura de O Que Está em Jogo: o buscador serve para trazer clientes ao consórcio, e não precisa se pagar sozinho. O primeiro público é a própria base da Klubi, porque quem é contemplado precisa escolher um carro, e esse é o canal de aquisição mais barato disponível. CAC e LTV foram estimados com premissas de mercado, cada uma escrita junto do número, para que possa ser trocada pelo dado real da Klubi sem refazer a conta.
