# Workshop Credit Management System

A production-ready, minimal admin-only configuration contract and ERC-20 workshop-credit token system built with **Hardhat 2**, **Solidity 0.8.24**, **OpenZeppelin Contracts v5**, and **ethers v6**.

## Project Architecture

```text
backend/
  contracts/
    WorkshopConfig.sol          # Admin-only configuration switch (Ownable)
    WorkshopCredit.sol          # ERC-20 token (100,000 WSC initial supply)
  test/
    WorkshopConfig.test.js      # 8 comprehensive unit tests for configuration & access control
    WorkshopCredit.test.js      # 11 comprehensive unit tests for ERC-20 accounting & transfers
  scripts/
    deploy.js                   # Network-validated Sepolia deployment script
    verify.js                   # Automated Etherscan & Sourcify source verification
    demo.js                     # Read-only and state-changing demonstration script
    test-reporter.js            # Automated test runner generating JSON & Markdown reports
  reports/
    test-report.json            # Machine-generated test execution record
    test-report.md              # Formatted Markdown test report
  hardhat.config.js             # Hardhat 2 configuration (Solidity 0.8.24, chainId 11155111)
  package.json                  # NPM dependencies & task runners
  .env.example                  # Environment configuration template
  .gitignore                    # Security exclusions for secrets & artifacts
  README.md                     # Detailed Hardhat & Remix interaction guide
```

## Quick Start (Local)

```bash
cd backend
npm install
npm run compile
npm test
npm run test:report
npm run demo:local
```

## Sepolia Deployment & Demonstration

1. Configure `backend/.env` with `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, and `ETHERSCAN_API_KEY`.
2. Deploy to Sepolia:
   ```bash
   npm run deploy:sepolia
   ```
3. Verify contracts on block explorer:
   ```bash
   npm run verify:sepolia
   ```
4. Run read-only live inspection:
   ```bash
   npm run demo
   ```

For detailed Hardhat & Remix IDE step-by-step instructions, see [`backend/README.md`](backend/README.md).
