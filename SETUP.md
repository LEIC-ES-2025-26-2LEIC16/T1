# Guia de Configuração (Setup) - Eco-App

Este documento descreve os passos necessários para configurar o ambiente de desenvolvimento e executar a aplicação. 

**Nota Importante:** Como a aplicação utiliza módulos nativos avançados (Mapas e Câmara), **não é possível utilizar o Expo Go padrão**. É necessário utilizar um Development Client ou instalar o ficheiro APK diretamente.

## Pré-requisitos
* **Node.js**: Versão 18 ou superior.
* **npm**: Gestor de pacotes do Node.
* Telemóvel Android físico ou Emulador Android configurado no computador.

## Instalação e Execução

1. **Navegar para a pasta da aplicação**:
   ```bash
   cd eco-app
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Compilar e correr no dispositivo Android**:
   Liga o telemóvel por cabo (com a depuração USB ativa) ou liga o teu emulador Android, e executa:
   ```bash
   npm run android
   ```
   *(Isto irá compilar a aplicação nativa e instalar o Dev Client no telemóvel).*

## Testes Automatizados
Para garantir a qualidade do código e verificar a lógica de negócio, executa os testes unitários:
   ```bash
   npm test
   ```