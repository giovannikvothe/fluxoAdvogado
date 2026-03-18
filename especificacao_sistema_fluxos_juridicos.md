# Especificação Inicial — Sistema de Gestão de Demandas com Fluxos

## Objetivo
Criar um sistema para organizar a execução de serviços jurídicos prestados para diferentes advogados, reduzindo esquecimentos, confusões de procedimento e perda de etapas operacionais.

A proposta central é permitir:
- cadastrar fluxos/templates de trabalho;
- criar demandas reais a partir desses templates;
- vincular cada demanda a um advogado e a um cliente;
- acompanhar o andamento por etapas;
- visualizar demandas ativas e finalizadas com filtros.

---

## Problema que o sistema resolve
O mesmo prestador atende diferentes advogados e clientes.

Cada advogado pode ter:
- um jeito próprio de conduzir o serviço;
- exigências específicas;
- ordem diferente de execução;
- validações manuais em momentos distintos.

Sem um sistema padronizado, isso gera:
- esquecimento de etapas;
- execução fora do padrão esperado;
- retrabalho;
- dificuldade para acompanhar demandas em andamento;
- risco de perda de prazo ou de informação importante.

---

## Ideia central da solução
O sistema deve funcionar com base em **templates de fluxo**.

### Lógica principal
1. cadastrar advogados;
2. cadastrar clientes;
3. criar templates de fluxo com etapas definidas;
4. criar uma demanda real a partir de um template;
5. vincular essa demanda a um advogado e a um cliente;
6. acompanhar a execução das etapas até a finalização.

---

## Passo a passo do sistema

## Etapa 1 — Cadastrar os participantes principais
Antes de usar os fluxos, o sistema deve permitir o cadastro das entidades básicas.

### O que cadastrar
#### Advogado contratante
Campos sugeridos:
- nome;
- telefone;
- e-mail;
- observações;
- status ativo/inativo.

#### Cliente final
Campos sugeridos:
- nome;
- documento;
- telefone;
- e-mail;
- observações.

### Objetivo dessa etapa
Garantir que toda demanda futura possa ser vinculada corretamente a:
- um advogado;
- um cliente.

---

## Etapa 2 — Criar os templates de fluxo
Essa é a parte principal do sistema.

Cada template representa um modo de execução de um serviço.

### Exemplo
**Template: Petição Inicial — Advogado A**
1. Receber documentos
2. Conferir documentos
3. Validar estratégia com advogado
4. Elaborar minuta
5. Revisar
6. Protocolar
7. Enviar comprovante

**Template: Cumprimento de sentença — Advogado B**
1. Analisar decisão
2. Calcular valores
3. Validar cálculos
4. Elaborar petição
5. Protocolar
6. Acompanhar retorno

### O que um template deve ter
- nome do fluxo;
- advogado vinculado ou opção de template genérico;
- tipo de serviço;
- lista de etapas;
- ordem das etapas;
- descrição por etapa;
- obrigatoriedade da etapa;
- prazo padrão por etapa;
- observações internas.

### Objetivo dessa etapa
Transformar conhecimento operacional em processo padronizado.

Assim, em vez de lembrar tudo de cabeça, o sistema passa a orientar a execução.

---

## Etapa 3 — Modelar as etapas do template
Cada template será formado por etapas.

### Para cada etapa, o ideal é definir
- nome da etapa;
- descrição do que deve ser feito;
- ordem de execução;
- status padrão inicial;
- se a etapa é obrigatória ou opcional;
- prazo sugerido;
- observações específicas.

### Exemplo de modelagem simples de etapa
- **Nome:** Validar com advogado
- **Descrição:** Enviar minuta para aprovação antes do protocolo
- **Obrigatória:** Sim
- **Prazo padrão:** 2 dias
- **Observação:** Advogado A sempre revisa antes do envio final

### Objetivo dessa etapa
Evitar que etapas importantes fiquem implícitas ou dependam apenas de memória.

---

## Etapa 4 — Criar uma nova demanda a partir de um template
Depois dos templates criados, o sistema deve permitir gerar uma demanda real.

### Exemplo de uso
- Advogado: Advogado A
- Cliente: Cliente 1
- Template: Petição Inicial — Advogado A
- Número do processo: opcional
- Observações: informações específicas do caso

Ao criar essa demanda, o sistema deve:
- copiar as etapas do template;
- gerar uma instância independente;
- permitir acompanhar a execução sem alterar o template original.

### Objetivo dessa etapa
Converter um modelo teórico em um caso real executável.

---

## Etapa 5 — Acompanhar a execução da demanda
Cada demanda criada deve possuir uma tela própria de acompanhamento.

### O que mostrar nessa tela
- advogado vinculado;
- cliente vinculado;
- template utilizado;
- status geral da demanda;
- lista das etapas;
- prazo geral;
- prazo por etapa;
- observações;
- histórico de alterações.

### Status sugeridos para a demanda
- não iniciada;
- em andamento;
- aguardando retorno;
- finalizada;
- cancelada.

### Status sugeridos para cada etapa
- não iniciada;
- em andamento;
- concluída;
- bloqueada;
- cancelada;
- aguardando terceiro.

### Objetivo dessa etapa
Dar visibilidade total sobre o que já foi feito, o que ainda falta e onde existe bloqueio.

---

## Etapa 6 — Criar uma listagem geral de demandas
O sistema também deve ter uma página central para visualização geral.

### Nessa página deve ser possível ver
- demandas ativas;
- demandas finalizadas;
- demandas atrasadas;
- demandas aguardando retorno;
- responsável atual;
- advogado;
- cliente;
- tipo de fluxo.

### Filtros importantes
- status;
- advogado;
- cliente;
- template;
- data de criação;
- prazo;
- ativas/finalizadas;
- pesquisa textual.

### Objetivo dessa etapa
Facilitar a gestão diária do trabalho e permitir localizar rapidamente qualquer demanda.

---

## Etapa 7 — Finalizar a demanda
Quando todas as etapas obrigatórias forem concluídas, a demanda pode ser encerrada.

### Regras sugeridas
- permitir finalizar manualmente;
- impedir finalização se ainda existirem etapas obrigatórias pendentes;
- registrar data de conclusão;
- manter o histórico preservado;
- mover a demanda para a listagem de finalizadas.

### Objetivo dessa etapa
Encerrar o ciclo da demanda sem perder rastreabilidade.

---

## Estrutura sugerida das telas

## 1. Tela de Advogados
Função:
- cadastrar;
- editar;
- listar;
- ativar/inativar.

## 2. Tela de Clientes
Função:
- cadastrar;
- editar;
- listar.

## 3. Tela de Templates
Função:
- criar fluxo;
- editar etapas;
- duplicar template;
- ativar/inativar template.

## 4. Tela de Nova Demanda
Função:
- selecionar advogado;
- selecionar cliente;
- selecionar template;
- criar instância do fluxo.

## 5. Tela de Detalhe da Demanda
Função:
- acompanhar etapas;
- alterar status;
- adicionar observações;
- visualizar progresso.

## 6. Tela de Listagem Geral
Função:
- visualizar todas as demandas;
- aplicar filtros;
- separar ativas e finalizadas.

---

## Estrutura mínima de dados

## Advogado
- id
- nome
- telefone
- email
- observacoes
- ativo

## Cliente
- id
- nome
- documento
- telefone
- email
- observacoes

## Template de Fluxo
- id
- nome
- tipo_servico
- advogado_id opcional
- ativo
- versao

## Etapa do Template
- id
- template_id
- ordem
- nome
- descricao
- obrigatoria
- prazo_padrao
- observacoes

## Demanda
- id
- advogado_id
- cliente_id
- template_id
- titulo
- numero_processo
- status
- data_criacao
- data_conclusao
- prazo_final
- observacoes

## Etapa da Demanda
- id
- demanda_id
- etapa_origem_id
- ordem
- nome
- descricao
- status
- prazo
- data_inicio
- data_conclusao
- observacoes

## Histórico
- id
- demanda_id
- etapa_id opcional
- acao
- descricao
- data

---

## Regras de negócio importantes

### 1. O template não deve ser alterado pela execução da demanda
Quando uma demanda for criada, as etapas devem ser copiadas para a instância.

Isso evita que mudanças futuras no template afetem demandas já abertas.

### 2. A demanda deve ser independente do template após a criação
Mesmo que o template mude depois, a demanda em andamento deve continuar com a estrutura que foi criada no momento da abertura.

### 3. Etapas obrigatórias devem ser tratadas com validação
Se ainda houver etapa obrigatória pendente, o sistema pode:
- impedir a finalização;
- ou exigir justificativa para encerramento excepcional.

### 4. Todo avanço importante deve gerar histórico
Exemplos:
- criação da demanda;
- conclusão de etapa;
- alteração de prazo;
- mudança de status;
- finalização.

### 5. O sistema deve destacar pendências com clareza
Principalmente:
- demandas atrasadas;
- etapas bloqueadas;
- itens aguardando cliente;
- itens aguardando advogado.

---

## Considerações importantes para o projeto

## 1. Não começar com modelagem complexa demais
Para a primeira versão, o ideal é evitar BPMN completo, automações avançadas e fluxos com muitas bifurcações.

Começar com:
- etapas ordenadas;
- checklist;
- status;
- prazos;
- observações.

Isso resolve a maior parte do problema com menor custo de desenvolvimento.

## 2. O foco principal deve ser usabilidade
Se a tela for complexa demais, a chance de abandono aumenta.

A experiência deve ser simples:
- criar template;
- criar demanda;
- marcar andamento;
- localizar pendências.

## 3. O sistema deve permitir pequenas adaptações por advogado
Nem sempre um fluxo servirá para todos.

Por isso é importante permitir:
- templates específicos por advogado;
- templates genéricos;
- duplicação de template para ajustes rápidos.

## 4. A tela mais importante do sistema será a listagem de demandas
É nela que o usuário vai acompanhar o dia a dia.

Essa tela deve deixar muito claro:
- o que está em aberto;
- o que está atrasado;
- o que depende de terceiros;
- o que já foi concluído.

## 5. Observações internas têm muito valor
Muitas vezes o diferencial do processo não está só na etapa, mas na forma como ela deve ser executada.

Exemplo:
- “esse advogado sempre revisa antes do protocolo”;
- “esse cliente costuma enviar documentação incompleta”;
- “nesses casos, conferir assinatura antes de seguir”.

## 6. Histórico é importante para organização e auditoria
Mesmo que o sistema seja simples, registrar movimentações ajuda a:
- entender o que aconteceu;
- evitar dúvidas futuras;
- dar segurança operacional.

---

## Sugestão de escopo por fase

## Fase 1 — MVP
Implementar:
- cadastro de advogados;
- cadastro de clientes;
- cadastro de templates;
- cadastro de etapas do template;
- criação de demanda por template;
- acompanhamento das etapas;
- listagem de demandas ativas e finalizadas.

## Fase 2 — Melhorias operacionais
Implementar:
- prazos por etapa;
- alertas visuais de atraso;
- histórico de ações;
- filtros avançados;
- observações por etapa.

## Fase 3 — Evoluções futuras
Implementar:
- dashboard;
- anexos;
- relatórios;
- versionamento de templates;
- automações;
- permissões por usuário.

---

## Resumo objetivo da implementação
1. Criar cadastro de advogados.
2. Criar cadastro de clientes.
3. Criar cadastro de templates de fluxo.
4. Permitir adicionar etapas ordenadas ao template.
5. Permitir criar uma demanda real a partir de um template.
6. Vincular a demanda a um advogado e a um cliente.
7. Exibir as etapas da demanda como checklist operacional.
8. Permitir atualizar status das etapas e da demanda.
9. Criar listagem geral com filtros.
10. Separar demandas ativas e finalizadas.
11. Registrar histórico básico das ações.
12. Evoluir depois com prazos, alertas e automações.

---

## Conclusão
A solução mais adequada é um sistema de **gestão de demandas com fluxos parametrizáveis**, onde o conhecimento operacional deixa de depender apenas da memória e passa a ser estruturado em templates reutilizáveis.

A melhor abordagem é começar simples, com foco em:
- padronização;
- clareza;
- acompanhamento;
- rastreabilidade.

Depois disso, o sistema pode evoluir com recursos mais avançados sem comprometer a base do projeto.

