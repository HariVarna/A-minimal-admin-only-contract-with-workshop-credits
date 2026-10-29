# Workshop Credit Management System

A production-ready, minimal admin-only configuration contract and ERC-20 workshop-credit token system built with Hardhat 2, Solidity 0.8.24, and OpenZeppelin Contracts v5.

## Project Structure

```text
backend/
  contracts/
    WorkshopConfig.sol          # Admin-only workshop activation toggle
    WorkshopCredit.sol          # ERC-20 token (100,000 WSC initial supply)
  test/
    WorkshopConfig.test.js      # 8 unit tests for admin configuration & access control
    WorkshopCredit.test.js      # 11 unit tests for ERC-20 functionality & accounting
  scripts/
    deploy.js                   # Deployment script (Local / Sepolia)
    demo.js                     # End-to-end interactive simulation script
    test-reporter.js            # Automated test reporter generating JSON & Markdown
  reports/
    test-report.json            # Machine-readable test execution report
    test-report.md              # Markdown formatted test execution report
  hardhat.config.js             # Hardhat 2 configuration (Solidity 0.8.24, ethers v6)
  package.json                  # NPM dependencies & scripts
  .env.example                  # Environment template for Sepolia RPC & keys
  .gitignore                    # Git ignore file protecting keys and build outputs
  README.md                     # Backend technical documentation
```

## Quick Start

```bash
cd backend
npm install
npm run compile
npm test
npm run test:report
npm run demo
```

For full details, deployment instructions, and security guidelines, refer to [backend/README.md](backend/README.md).
