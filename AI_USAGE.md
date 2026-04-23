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

**Nota:** As PBI's com intervenção de IA estão marcadas com a label `MisterAI` no GitHub.