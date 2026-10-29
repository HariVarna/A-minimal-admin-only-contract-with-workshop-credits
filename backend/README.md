# Workshop Credit Management System

A production-grade, admin-only configuration contract and ERC-20 workshop-credit token system built with **Solidity 0.8.24**, **OpenZeppelin Contracts v5**, and **Hardhat 2** with **ethers v6**.

---

## 1. Project Overview & Architecture

The system satisfies two key institutional requirements:
1. **Admin-Only Workshop Configuration (`contracts/WorkshopConfig.sol`)**:
   - Manages a boolean flag `workshopEnabled` controlling whether workshop enrollment and features are active.
   - Enforces administrative access control using OpenZeppelin's `Ownable` pattern (`Ownable(msg.sender)`).
   - Only the contract owner can call `setWorkshopEnabled(bool enabled)`.
   - Anyone can call the public getter `getWorkshopEnabled()`.
   - Emits a `WorkshopConfigUpdated(bool indexed enabled, address indexed updatedBy)` event upon modification.
2. **ERC-20 Workshop Credit Token (`contracts/WorkshopCredit.sol`)**:
   - Official OpenZeppelin `ERC20` implementation with name `"Workshop Credit"`, symbol `"WSC"`, and `18` decimals.
   - Mints an initial fixed supply of exactly **100,000 WSC** (`100,000 * 10^18` base units) to the deploying admin.
   - Facilitates peer transfers among participants, instructors, and attendees with standard ERC-20 balance accounting and overdraft protection.

---

## 2. Prerequisites & Environment

- **Node.js**: `v18.x`, `v20.x`, `v22.x`, or `v24.x` (tested on `v24.17.0`)
- **npm**: `v9.x`+ (tested on `11.13.0`)
- **Hardhat**: `2.29.1` (Hardhat 2 with `@nomicfoundation/hardhat-toolbox` v5 and ethers v6)
- **Solidity Compiler**: `0.8.24` (evm target: paris, optimizer enabled: 200 runs)

---

## 3. Installation & Local Verification

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile all smart contracts:
   ```bash
   npm run compile
   ```
4. Run the full automated test suite (19 unit tests):
   ```bash
   npm test
   ```
5. Generate the official machine-readable test execution report:
   ```bash
   npm run test:report
   ```
   *Reports generated:*
   - `reports/test-report.json` (Machine-readable JSON)
   - `reports/test-report.md` (Markdown summary)

6. Run the local in-memory simulation:
   ```bash
   npm run demo:local
   ```

---

## 4. Sepolia Testnet Deployment & Interaction

### Safe Credential Configuration

1. Copy `.env.example` to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the parameters inside `backend/.env`:
   ```ini
   # Ethereum Sepolia Testnet RPC URL (Public node, Infura, or Alchemy)
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

   # Deployer Wallet Private Key (MUST be dedicated testnet account with SepoliaETH)
   PRIVATE_KEY=your_testnet_private_key_without_quotes

   # Etherscan API Key for block explorer contract verification
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```
   > [!CAUTION]
   > - **Never commit `.env` to version control.** It is explicitly ignored in `.gitignore`.
   > - **Never use a wallet containing real funds.** Always use a dedicated testnet address.
   > - Local compilation, automated tests, and local demos run 100% offline without needing `.env`.

### Step-by-Step Deployment to Sepolia

1. Obtain SepoliaETH from a public faucet:
   - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - [Sepolia PoW Faucet](https://sepoliafaucet.com)
   - [Chainlink Faucets](https://faucets.chain.link/sepolia)
2. Deploy both contracts to Sepolia:
   ```bash
   npm run deploy:sepolia
   ```
   *The deployment script automatically:*
   - Validates that the network is Sepolia (`chainId: 11155111`).
   - Verifies the deployer balance (requires ≥ 0.005 SepoliaETH for gas).
   - Deploys `WorkshopConfig` and `WorkshopCredit`.
   - Checks initial state (flag is `false`, supply is exactly `100,000 WSC`).
   - Saves deployment records to `deployments/sepolia.json`.

---

## 5. Contract Source Verification

Verify the deployed contract source code on Etherscan and Sourcify:

```bash
npm run verify:sepolia
```

Alternatively, run the individual Hardhat verify commands:
```bash
# Verify WorkshopConfig (no constructor arguments)
npx hardhat verify --network sepolia <WORKSHOP_CONFIG_ADDRESS>

# Verify WorkshopCredit (no constructor arguments)
npx hardhat verify --network sepolia <WORKSHOP_CREDIT_ADDRESS>
```

---

## 6. Interaction Guide: Option A (Hardhat CLI)

### 1. Read-Only State Inspection (No Private Key Required)
Inspect deployed Sepolia contracts without spending gas or loading private keys:
```bash
npm run demo
```
This reads the current `workshopEnabled` flag, owner address, token name, symbol, decimals, total supply, and deployer balance from the live blockchain.

### 2. Owner-Only Configuration Toggle
Toggle the `workshopEnabled` flag on Sepolia as the owner:
```bash
# Toggle flag
DEMO_TOGGLE=true npm run demo

# Toggle flag and restore to original state
DEMO_TOGGLE=true DEMO_RESTORE=true npm run demo
```
*Security verification: If the connected signer does not match the contract owner, the script safely halts before sending any transaction.*

### 3. Transfer Workshop Credits
Transfer tokens to a student or participant address on Sepolia:
```bash
DEMO_TRANSFER_TO=0xRecipientAddressHere DEMO_AMOUNT=25 npm run demo
```

---

## 7. Interaction Guide: Option B (Remix IDE)

You can also interact with the deployed contracts visually through [Remix IDE](https://remix.ethereum.org).

### Step 1: Load Source Files in Remix
1. Open [Remix IDE](https://remix.ethereum.org).
2. Create `WorkshopConfig.sol` and copy the code from [`contracts/WorkshopConfig.sol`](contracts/WorkshopConfig.sol).
3. Create `WorkshopCredit.sol` and copy the code from [`contracts/WorkshopCredit.sol`](contracts/WorkshopCredit.sol).
4. In the **Solidity Compiler** tab:
   - Set Compiler to `0.8.24`.
   - Enable Optimization (200 runs).
   - Click **Compile**.

### Step 2: Connect to Sepolia via MetaMask
1. In the **Deploy & Run Transactions** tab:
   - Set **Environment** to **Injected Provider - MetaMask**.
   - Make sure your MetaMask is connected to **Sepolia testnet** (`Chain ID: 11155111`).
2. Instead of deploying a new instance:
   - Select `WorkshopConfig` from the Contract dropdown.
   - Paste your deployed `WorkshopConfig` address into the **At Address** field.
   - Click **At Address**.
   - Repeat for `WorkshopCredit` using its deployed address.

### Step 3: Interacting with WorkshopConfig Functions
- `getWorkshopEnabled()`: Click to read the current boolean flag (`false` or `true`). Free call (no gas).
- `owner()`: Click to view the administrator wallet address. Free call.
- `setWorkshopEnabled(bool enabled)`:
  - Enter `true` or `false` in the input field.
  - Click the orange button to submit an on-chain transaction.
  - Confirm the transaction in MetaMask.
  - *Note:* If called from a non-owner address, the transaction will revert with `OwnableUnauthorizedAccount`.

### Step 4: Interacting with WorkshopCredit Functions
- `name()`: Returns `"Workshop Credit"`.
- `symbol()`: Returns `"WSC"`.
- `decimals()`: Returns `18`.
- `totalSupply()`: Returns `100000000000000000000000` (100,000 WSC in 18 decimal base units).
- `balanceOf(address)`: Enter any address to view their balance in base units.
- `transfer(address to, uint256 amount)`:
  - **Important Token Unit Conversion:** 1 WSC = 10^18 base units (`1000000000000000000`).
  - To transfer **10 WSC**, enter: `10000000000000000000` (`10` followed by 18 zeros).
  - To transfer **1 WSC**, enter: `1000000000000000000`.
  - Click **transact** and confirm in MetaMask.

> [!WARNING]
> Never paste private keys into Remix source files or console. Always use MetaMask or a secure Web3 browser wallet for signing.

---

## 8. Distinguishing Local Tests vs. Sepolia Transactions

| Property | Local Hardhat Test (`npm test`) | Real Sepolia Transaction (`npm run deploy:sepolia`) |
|---|---|---|
| **Network** | Ephemeral in-memory node | Ethereum Sepolia testnet |
| **Persistence** | Resets after test completion | Permanent on the blockchain |
| **Block Explorer** | None (in-memory only) | Verified on [Sepolia Etherscan](https://sepolia.etherscan.io) |
| **Transaction Fee** | Simulated 0 ETH gas | Requires real SepoliaETH from faucets |
| **Confirmation Time** | Instant (< 50ms) | ~12 seconds (Ethereum block time) |
| **Execution Record** | Saved in `reports/test-report.json` | Saved in `deployments/sepolia.json` |
