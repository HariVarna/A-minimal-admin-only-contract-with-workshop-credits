const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  console.log("==================================================");
  console.log("    DEPLOYING WORKSHOP SYSTEM TO ETHEREUM SEPOLIA ");
  console.log("==================================================");

  // 1. Confirm that the selected network is Sepolia
  const currentNetwork = hre.network.name;
  const currentChainId = hre.network.config.chainId;

  if (currentNetwork !== "sepolia" && currentChainId !== 11155111) {
    console.error(`\n❌ Error: Deployment is restricted strictly to Ethereum Sepolia testnet.`);
    console.error(`   Target network must be 'sepolia' with chainId 11155111.`);
    console.error(`   Current network: '${currentNetwork}' (Chain ID: ${currentChainId || "unknown"}).`);
    console.error(`   Please run with: npm run deploy:sepolia\n`);
    process.exit(1);
  }

  // 2. Confirm required environment variables exist without printing their values
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || rpcUrl.trim() === "") {
    console.error("\n❌ Error: Missing SEPOLIA_RPC_URL environment variable.");
    console.error("   Please define SEPOLIA_RPC_URL in backend/.env (refer to .env.example).");
    process.exit(1);
  }

  if (!privateKey || privateKey.trim() === "") {
    console.error("\n❌ Error: Missing PRIVATE_KEY environment variable.");
    console.error("   Please define PRIVATE_KEY in backend/.env (refer to .env.example).");
    process.exit(1);
  }

  console.log("✓ Environment variables confirmed (SEPOLIA_RPC_URL and PRIVATE_KEY are present).");

  // 3. Display deployer public address
  const signers = await hre.ethers.getSigners();
  if (!signers || signers.length === 0) {
    console.error("\n❌ Error: No deployer account loaded from configured private key.");
    process.exit(1);
  }
  const deployer = signers[0];
  console.log(`✓ Deployer Public Address: ${deployer.address}`);

  // 4. Display deployer's Sepolia ETH balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`✓ Deployer Sepolia Balance: ${hre.ethers.formatEther(balance)} SepoliaETH`);

  // 5. Stop with a helpful error if the account has insufficient funds
  const MIN_RECOMMENDED_BALANCE = hre.ethers.parseEther("0.005");
  if (balance < MIN_RECOMMENDED_BALANCE) {
    console.error("\n❌ Error: Insufficient SepoliaETH balance for contract deployment.");
    console.error(`   Current balance:      ${hre.ethers.formatEther(balance)} SepoliaETH`);
    console.error(`   Recommended minimum:  0.0050 SepoliaETH`);
    console.error(`   Please obtain testnet ETH from a Sepolia faucet for address ${deployer.address}:`);
    console.error("   - Google Cloud Web3 Faucet: https://cloud.google.com/application/web3/faucet/ethereum/sepolia");
    console.error("   - Sepolia PoW / QuickNode:  https://sepoliafaucet.com");
    console.error("   - Chainlink Faucets:        https://faucets.chain.link/sepolia\n");
    process.exit(1);
  }

  // 6. Deploy WorkshopConfig
  console.log("\n[1/2] Deploying WorkshopConfig contract...");
  const WorkshopConfigFactory = await hre.ethers.getContractFactory("WorkshopConfig");
  const workshopConfig = await WorkshopConfigFactory.deploy();
  await workshopConfig.waitForDeployment();

  // 8. Wait for deployment & 9/10/11/12 Contract details
  const configAddress = await workshopConfig.getAddress();
  const configTxHash = workshopConfig.deploymentTransaction()?.hash || "Pending/Mined";
  const configOwner = await workshopConfig.owner();
  const initialEnabled = await workshopConfig.getWorkshopEnabled();

  console.log(`✓ WorkshopConfig deployed successfully!`);
  console.log(`  - Address:           ${configAddress}`);
  console.log(`  - Transaction Hash:  ${configTxHash}`);
  console.log(`  - Owner:             ${configOwner}`);
  console.log(`  - Initial Enabled:   ${initialEnabled}`);

  // 7. Deploy WorkshopCredit
  console.log("\n[2/2] Deploying WorkshopCredit (WSC) token contract...");
  const WorkshopCreditFactory = await hre.ethers.getContractFactory("WorkshopCredit");
  const workshopCredit = await WorkshopCreditFactory.deploy();
  await workshopCredit.waitForDeployment();

  // 8. Wait for deployment & 9/10/11/13 Contract details
  const creditAddress = await workshopCredit.getAddress();
  const creditTxHash = workshopCredit.deploymentTransaction()?.hash || "Pending/Mined";
  const creditOwner = await workshopCredit.owner();
  const tokenName = await workshopCredit.name();
  const tokenSymbol = await workshopCredit.symbol();
  const decimals = await workshopCredit.decimals();
  const totalSupply = await workshopCredit.totalSupply();
  const deployerBalance = await workshopCredit.balanceOf(deployer.address);

  console.log(`✓ WorkshopCredit deployed successfully!`);
  console.log(`  - Address:           ${creditAddress}`);
  console.log(`  - Transaction Hash:  ${creditTxHash}`);
  console.log(`  - Owner:             ${creditOwner}`);
  console.log(`  - Token Name:        ${tokenName}`);
  console.log(`  - Token Symbol:      ${tokenSymbol}`);
  console.log(`  - Decimals:          ${decimals}`);
  console.log(`  - Total Supply:      ${hre.ethers.formatUnits(totalSupply, decimals)} ${tokenSymbol}`);
  console.log(`  - Deployer Balance:  ${hre.ethers.formatUnits(deployerBalance, decimals)} ${tokenSymbol}`);

  // 14. Check that the token has an initial supply of exactly 100,000 WSC
  const expectedSupply = hre.ethers.parseUnits("100000", 18);
  if (totalSupply !== expectedSupply) {
    throw new Error(`Token total supply verification failed: expected 100,000 WSC base units, got ${totalSupply}`);
  }
  if (deployerBalance !== expectedSupply) {
    throw new Error(`Deployer balance verification failed: expected 100,000 WSC base units, got ${deployerBalance}`);
  }
  console.log("✓ Initial supply verification passed: Exactly 100,000 WSC allocated to deployer.");

  // 15. Save the actual deployment details to deployments/sepolia.json
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkDetails = await hre.ethers.provider.getNetwork();
  const deploymentRecord = {
    network: hre.network.name,
    chainId: Number(networkDetails.chainId),
    deploymentTimestamp: new Date().toISOString(),
    deployerAddress: deployer.address,
    contracts: {
      workshopConfig: {
        address: configAddress,
        deploymentTxHash: configTxHash,
        owner: configOwner,
        initialWorkshopEnabled: initialEnabled,
      },
      workshopCredit: {
        address: creditAddress,
        deploymentTxHash: creditTxHash,
        owner: creditOwner,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: Number(decimals),
        totalSupplyBaseUnits: totalSupply.toString(),
        totalSupplyHuman: hre.ethers.formatUnits(totalSupply, decimals),
        deployerBalanceBaseUnits: deployerBalance.toString(),
        deployerBalanceHuman: hre.ethers.formatUnits(deployerBalance, decimals),
      },
    },
    verification: {
      workshopConfigVerifyCmd: `npx hardhat verify --network sepolia ${configAddress}`,
      workshopCreditVerifyCmd: `npx hardhat verify --network sepolia ${creditAddress}`,
      explorerLinks: {
        workshopConfig: `https://sepolia.etherscan.io/address/${configAddress}`,
        workshopCredit: `https://sepolia.etherscan.io/address/${creditAddress}`,
      },
    },
  };

  const deploymentFilePath = path.join(deploymentsDir, "sepolia.json");
  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentRecord, null, 2), "utf8");

  console.log("\n==================================================");
  console.log("             DEPLOYMENT COMPLETED                 ");
  console.log("==================================================");
  console.log(`Saved Record:  ${deploymentFilePath}`);
  console.log(`WorkshopConfig: https://sepolia.etherscan.io/address/${configAddress}`);
  console.log(`WorkshopCredit: https://sepolia.etherscan.io/address/${creditAddress}`);
  console.log("==================================================");

  return deploymentRecord;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err.message || err);
    process.exit(1);
  });
