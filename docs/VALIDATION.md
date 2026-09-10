# Validation record / Registro de validação

Review date / Data da revisão: 2026-09-10.

## Change and reason / Mudança e motivo

EN: Restored the missing React application; corrected Wilder smoothing and zero MACD signals; prevented invalid trades, refreshed summaries after fills and latched stop-limit triggers.

PT: Restaurada aplicação React ausente; corrigidos suavização de Wilder e sinais MACD zero; bloqueadas operações inválidas, atualizados resumos após execução e persistidos gatilhos stop-limit.

## Reproduce / Reproduzir

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

## Example evidence / Evidência do exemplo

Tests verify hand-calculated Wilder RSI values, zero-valued MACD signals, reproducible candles and cash conservation on a round-trip paper trade. / Testes verificam RSI de Wilder calculado manualmente, sinais MACD iguais a zero, candles reproduzíveis e conservação de saldo em compra e venda simuladas.

EN: The suite includes normal operations and regression cases for the corrected behavior. The example checks values produced by the implementation. Use the linked workflow to inspect the result for a specific commit; no performance benchmark is inferred from a passing build.

PT: A suíte inclui operações válidas e regressões dos comportamentos corrigidos. O exemplo verifica valores produzidos pela implementação. Consulte a automação para conferir o resultado de um commit específico; aprovação de compilação não implica benchmark de desempenho.

## Limits / Limites

EN: All prices are synthetic; ticker names are illustrative. No brokerage, live quote feed or investment performance is represented. UI fills are immediate with no fees or slippage. The order-rule module is tested separately and is not a full exchange or portfolio settlement engine. Floating-point arithmetic is suitable for visualization, not custody accounting.

PT: Todos os preços são fictícios; nomes de ativos são ilustrativos. Não há corretora, cotações ao vivo ou desempenho de investimento representado. A interface executa imediatamente, sem taxas ou deslizamento. O módulo de regras é testado separadamente e não representa uma bolsa nem motor completo de liquidação. Ponto flutuante serve à visualização, não à contabilidade de custódia.

[Return to README / Voltar ao README](../README.md)

## Verified suite / Suíte verificada

**9 software tests passed / testes de software aprovados.**

README Mermaid syntax and local documentation links were checked. / A sintaxe Mermaid do README e os links locais da documentação foram conferidos.
