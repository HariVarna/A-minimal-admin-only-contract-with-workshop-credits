# Workshop Credit Management System (Backend)

An administrative configuration contract and ERC-20 workshop-credit token built with Solidity 0.8.24, OpenZeppelin Contracts v5, and Hardhat 2 (ethers v6).

---

## 1. Project Overview

The **Workshop Credit Management System** fulfills a department's requirement for:
1. **Admin-Only Workshop Configuration (`WorkshopConfig.sol`)**:
   - Manages a boolean switch `workshopEnabled` controlling whether workshop activities/registration are active.
   - Enforces administrative access control using OpenZeppelin's `Ownable` pattern.
   - Transparently emits `WorkshopConfigUpdated` events upon state modification.
   - Provides a public view getter `getWorkshopEnabled()` accessible to any participant or external contract.

2. **ERC-20 Workshop Credit Token (`WorkshopCredit.sol`)**:
   - Standard ERC-20 token named **"Workshop Credit"** with symbol **"WSC"** and standard 18 decimals.
   - Mints a fixed initial supply of **100,000 WSC** (`100,000 * 10^18` base units) directly to the deployer upon creation.
   - Securely tracks balances and facilitates peer-to-peer credit transfers among participants, instructors, and attendees.

---

## 2. Prerequisites

Ensure your development environment meets the following requirements:
- **Node.js**: `v18.x`, `v20.x`, `v22.x`, or `v24.x` (tested on `v24.17.0`)
- **npm**: `v9.x`, `v10.x`, or `v11.x` (tested on `11.13.0`)
- **Hardhat**: `2.29.1` (Hardhat 2 series with ethers v6)
- **Solidity Compiler**: `0.8.24`

---

## 3. Installation & Setup

1. Open your terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up environment variables for Sepolia deployment:
   ```bash
   cp .env.example .env
   ```
   *Note: Compilation, testing, reporting, and local demo execution run completely in-memory without requiring any `.env` file or external network connection.*

---

## 4. Compilation

Compile all smart contracts using Hardhat:
```bash
npm run compile
```
Expected output:
```text
Compiled 8 Solidity files successfully (evm target: paris).
```

---

## 5. Running Automated Tests

Run the full automated test suite containing 19 comprehensive unit tests:
```bash
npm test
```

### Expected Test Results:
```text
  WorkshopConfig Contract
    Deployment and Initial State
      ✓ 1. Should deploy successfully with a valid contract address
      ✓ 2. Should confirm the deployer is set as the contract owner
      ✓ 3. Should confirm the initial workshopEnabled configuration is false
    Configuration Updates and Access Control
      ✓ 4. Should confirm the owner can enable the configuration
      ✓ 5. Should confirm the owner can disable the configuration after enabling
      ✓ 6. Should confirm non-owner setter calls revert
      ✓ 7. Should confirm the getter is publicly accessible by any account
      ✓ 8. Should confirm the expected event and event arguments on status changes

  WorkshopCredit Token Contract
    Deployment and Token Metadata
      ✓ 1. Should deploy successfully with a valid contract address
      ✓ 2. Should verify token name is 'Workshop Credit'
      ✓ 3. Should verify token symbol is 'WSC'
      ✓ 4. Should verify decimals is 18
      ✓ 5. Should verify the initial total supply is 100,000 tokens in base units
      ✓ 6. Should verify the deployer receives all initial tokens
    Token Transfers and Balance Accounting
      ✓ 7. Should transfer tokens to a second account
      ✓ 8. Should verify sender and recipient balances after transfer
      ✓ 9. Should verify the standard Transfer event is emitted with correct parameters
      ✓ 10. Should verify that a transfer exceeding the sender's balance reverts
      ✓ 11. Should verify that transfers respect ERC-20 balance accounting across multiple hops

  19 passing
```

---

## 6. Generating Machine-Readable Test Report

Execute the test suite and automatically generate structured reports:
```bash
npm run test:report
```
This produces two artifacts in the `reports/` folder:
- **`reports/test-report.json`**: Machine-readable JSON summary containing test pass/fail counts, execution timestamps, environment versions, and failure traces.
- **`reports/test-report.md`**: Human-readable Markdown summary suitable for documentation and audits.

---

## 7. Running the Live Demo

Run the end-to-end interactive simulation script:
```bash
npm run demo
```
This script demonstrates contract deployment, admin activation, non-owner revert protection, token balance distribution, peer transfer, and overdraft rejection on Hardhat's in-memory node.

---

## 8. Deployment Prerequisites (Ethereum Sepolia Testnet)

To deploy to Ethereum Sepolia:
1. Obtain Sepolia testnet ETH from a public faucet (e.g., Google Cloud Web3 Faucet, Alchemy Faucet, or Infura Faucet).
2. Configure `.env` inside `backend/`:
   ```ini
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   PRIVATE_KEY=your_actual_wallet_private_key_without_spaces
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```
3. Run the Sepolia deployment command:
   ```bash
   npm run deploy:sepolia
   ```

---

## 9. Security Precautions

- **Never Commit Private Keys**: The `.env` file is excluded in `.gitignore`. Never paste private keys directly into scripts, contracts, or version control.
- **Dedicated Testnet Wallet**: Always use a dedicated development wallet containing only testnet funds. Never use a wallet holding mainnet assets.
- **Access Control Verification**: The `WorkshopConfig` setter enforces `onlyOwner` checks inherited from OpenZeppelin `Ownable.sol`. Unauthorized attempts revert with `OwnableUnauthorizedAccount`.
- **Arithmetic & Overdraft Protection**: Built with Solidity `0.8.24` and OpenZeppelin `ERC20.sol`, protecting against integer underflow/overflow and unauthorized balance overdrafts.
