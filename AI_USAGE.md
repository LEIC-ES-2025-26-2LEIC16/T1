# Registo de Utilização de IA (Agentic AI)

Este projeto utilizou ferramentas de Inteligência Artificial para acelerar o desenvolvimento, garantindo as melhores práticas de Engenharia de Software.

## Ferramentas Utilizadas
* **Modelo:** Gemini 3.1 Pro (via interface de chat)

## Aplicações Práticas (Sprint 1)

1. **Refatoração de Arquitetura (Separation of Concerns):**
   * *Prompt/Objetivo:* Separar a lógica de cálculo de pontos e CO2 do componente visual (`LogRecyclingScreen`) para garantir a testabilidade do código.
   * *Resultado:* Criação do módulo `utils/recyclingUtils.ts`.

2. **Resolução de Problemas Nativos (Android Blob):**
   * *Prompt/Objetivo:* Resolver o problema de conversão de URIs de imagem para ficheiros compatíveis com o Firebase Storage no Android.
   * *Resultado:* Implementação de `XMLHttpRequest` no `firestore.ts` para criar o Blob com sucesso.

3. **Configuração de CI/CD e Testes:**
   * *Prompt/Objetivo:* Configurar o Jest num ambiente Expo com TypeScript e automatizar o processo através do GitHub Actions.
   * *Resultado:* Criação do ficheiro `ci.yml` e testes unitários funcionais.

4. **Automação de Testes E2E (User Acceptance Tests):**
   * *Prompt/Objetivo:* Criar scripts de teste end-to-end robustos usando o Maestro Mobile, superando bloqueios de hardware (ADB, permissões MIUI) e navegação em ambiente emulado.
   * *Resultado:* Criação dos scripts E2E (ex: `e2e/report_problem.yaml`, `e2e/add_ecoponto.yaml`) validados com sucesso no emulador Android.

5. **Gestão Ágil e Conformidade de Processos (Scrum/GitHub):**
   * *Prompt/Objetivo:* Estruturar o repositório de acordo com as métricas de avaliação do Sprint 1, incluindo o ciclo de vida de resolução de defeitos e documentação do Sprint.
   * *Resultado:* Criação do Issue Tracker modelado para reportar bugs (câmara), gestão de labels (`MisterAI`, `Task`, `Bug`) e estruturação do documento `sprint1_retrospective.md`.

## Aplicações Práticas (Sprint 3)

Neste último sprint, a intervenção de IA foi mínima e focada apenas em revisões rápidas e correção de sintaxe, servindo como um pequeno auxiliar pontual:

1. **Revisão de Sintaxe UML (Mermaid):**
   * Usámos IA apenas para validar e corrigir pequenos erros de formatação no código Markdown/Mermaid no `README.md` (ex: colocação de aspas nas etiquetas das setas).

2. **Apoio Estrutural em Testes (Jest/Maestro):**
   * *Prompt/Objetivo:* Sugestão de *boilerplate* para os blocos de testes unitários do Firebase e ajuda na sintaxe yaml dos testes E2E.
   * *Resultado:* Código gerado adaptado e refatorado inteiramente pela equipa.

3. **Otimização Rápida no CI/CD:**
   * Sugestão de correção para evitar que o GitHub Actions compilasse o APK desnecessariamente em cada commit.

**Nota:** As poucas tarefas onde a IA deu sugestões estão marcadas com a label `MisterAI` no GitHub.