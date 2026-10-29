const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
require("dotenv").config({ override: true });

// Parse command line arguments and environment variables
function parseOptions() {
  const args = process.argv.slice(2);
  const options = {
    isLocal:
      process.env.DEMO_MODE === "local" ||
      hre.network.name === "hardhat" ||
      hre.network.name === "localhost",
    toggleConfig:
      args.includes("--toggle-config") ||
      process.env.DEMO_TOGGLE === "true" ||
      process.env.DEMO_TOGGLE === "1",
    restoreConfig:
      args.includes("--restore") ||
      process.env.DEMO_RESTORE === "true" ||
      process.env.DEMO_RESTORE === "1",
    transferTo: process.env.DEMO_TRANSFER_TO || null,
    transferAmount: process.env.DEMO_AMOUNT || "10",
  };

  const transferToIndex = args.indexOf("--transfer-to");
  if (transferToIndex !== -1 && args[transferToIndex + 1]) {
    options.transferTo = args[transferToIndex + 1];
  }

  const amountIndex = args.indexOf("--amount");
  if (amountIndex !== -1 && args[amountIndex + 1]) {
    options.transferAmount = args[amountIndex + 1];
  }

  return options;
}

// Local in-memory simulation demonstration
async function runLocalDemo() {
  const [admin, participant1, participant2] = await hre.ethers.getSigners();

  console.log("===============================================================");
  console.log("  WORKSHOP CREDIT SYSTEM - LOCAL SIMULATION DEMO               ");
  console.log("===============================================================");
  console.log(`Admin Account:        ${admin.address}`);
  console.log(`Participant 1:        ${participant1.address}`);
  console.log(`Participant 2:        ${participant2.address}`);

  console.log("\n[1] Deploying local contract instances...");
  const ConfigFactory = await hre.ethers.getContractFactory("WorkshopConfig");
  const config = await ConfigFactory.deploy();
  await config.waitForDeployment();

  const CreditFactory = await hre.ethers.getContractFactory("WorkshopCredit");
  const credit = await CreditFactory.deploy();
  await credit.waitForDeployment();

  console.log(`✓ WorkshopConfig deployed at: ${await config.getAddress()}`);
  console.log(`✓ WorkshopCredit deployed at: ${await credit.getAddress()}`);

  console.log("\n[2] WorkshopConfig Demonstration:");
  console.log(`- Initial workshopEnabled flag: ${await config.getWorkshopEnabled()}`);
  console.log(`- Contract owner:               ${await config.owner()}`);

  console.log("\nAdmin toggling workshop status to true...");
  let tx = await config.connect(admin).setWorkshopEnabled(true);
  await tx.wait();
  console.log(`✓ Status updated: workshopEnabled = ${await config.getWorkshopEnabled()}`);

  console.log("\nTesting non-owner call revert...");
  try {
    await config.connect(participant1).setWorkshopEnabled(false);
  } catch (e) {
    console.log("✓ Expected revert: Non-owner cannot modify workshop configuration.");
  }

  console.log("\n[3] WorkshopCredit Demonstration:");
  console.log(`- Token Name:     ${await credit.name()}`);
  console.log(`- Token Symbol:   ${await credit.symbol()}`);
  console.log(`- Decimals:       ${await credit.decimals()}`);
  const supply = await credit.totalSupply();
  console.log(`- Total Supply:   ${hre.ethers.formatUnits(supply, 18)} WSC`);
  console.log(`- Admin Balance:  ${hre.ethers.formatUnits(await credit.balanceOf(admin.address), 18)} WSC`);

  console.log("\nTransferring 100 WSC to Participant 1...");
  const xfer = hre.ethers.parseUnits("100", 18);
  tx = await credit.connect(admin).transfer(participant1.address, xfer);
  await tx.wait();
  console.log(`✓ Transferred 100 WSC`);
  console.log(`  - Admin Balance:         ${hre.ethers.formatUnits(await credit.balanceOf(admin.address), 18)} WSC`);
  console.log(`  - Participant 1 Balance: ${hre.ethers.formatUnits(await credit.balanceOf(participant1.address), 18)} WSC`);

  console.log("\n===============================================================");
  console.log("             LOCAL DEMO COMPLETED SUCCESSFULLY                 ");
  console.log("===============================================================");
}

// Sepolia testnet demonstration (Read-only by default, optional state changes)
async function runSepoliaDemo(options) {
  console.log("===============================================================");
  console.log("     WORKSHOP CREDIT SYSTEM - SEPOLIA TESTNET DEMO            ");
  console.log("===============================================================");

  const deploymentFile = path.join(__dirname, "..", "deployments", "sepolia.json");
  if (!fs.existsSync(deploymentFile)) {
    console.error(`\n❌ Error: Deployment record not found at '${deploymentFile}'.`);
    console.error("   Please deploy contracts first using: npm run deploy:sepolia");
    console.error("   Or run local in-memory simulation using: npm run demo:local\n");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const configAddress = deploymentData.contracts?.workshopConfig?.address;
  const creditAddress = deploymentData.contracts?.workshopCredit?.address;

  console.log(`Loaded deployment records for Sepolia:`);
  console.log(`- WorkshopConfig: ${configAddress}`);
  console.log(`- WorkshopCredit: ${creditAddress}`);

  // Connect using read-only provider (requires NO private key)
  const provider = hre.ethers.provider;
  const configContract = await hre.ethers.getContractAt("WorkshopConfig", configAddress, provider);
  const creditContract = await hre.ethers.getContractAt("WorkshopCredit", creditAddress, provider);

  // -------------------------------------------------------------
  // Part A: Configuration Contract (Read-Only)
  // -------------------------------------------------------------
  console.log("\n--- [Part A] WorkshopConfig State ---");
  const currentFlag = await configContract.getWorkshopEnabled();
  const ownerAddress = await configContract.owner();
  console.log(`1. Current workshopEnabled flag: ${currentFlag}`);
  console.log(`2. Contract Owner:               ${ownerAddress}`);

  // Part A: Optional State-Changing Toggle Demonstration
  if (options.toggleConfig) {
    console.log("\n[State-Changing Action Requested: Toggle Workshop Status]");
    const signers = await hre.ethers.getSigners();
    if (!signers || signers.length === 0) {
      console.error("❌ Error: No signer available. Set PRIVATE_KEY in backend/.env to execute transactions.");
      process.exit(1);
    }
    const signer = signers[0];
    console.log(`Connected Signer: ${signer.address}`);

    if (signer.address.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.error(`❌ Error: Connected signer (${signer.address}) is not the contract owner (${ownerAddress}).`);
      console.error("   Aborting transaction to prevent unauthorized revert.");
      process.exit(1);
    }

    const newFlag = !currentFlag;
    console.log(`Toggling workshopEnabled from ${currentFlag} -> ${newFlag}...`);
    const tx = await configContract.connect(signer).setWorkshopEnabled(newFlag);
    console.log(`Transaction submitted! Hash: ${tx.hash}`);
    console.log("Waiting for block confirmation...");
    const receipt = await tx.wait();
    console.log(`✓ Confirmed in block ${receipt.blockNumber} (Status: ${receipt.status === 1 ? "SUCCESS" : "FAILED"})`);

    const updatedFlag = await configContract.getWorkshopEnabled();
    console.log(`6. Confirmed updated flag: ${updatedFlag}`);

    if (options.restoreConfig) {
      console.log(`\n[Restoring original configuration flag]`);
      const restoreTx = await configContract.connect(signer).setWorkshopEnabled(currentFlag);
      console.log(`Restore tx submitted! Hash: ${restoreTx.hash}`);
      await restoreTx.wait();
      console.log(`7. Restored workshopEnabled back to: ${await configContract.getWorkshopEnabled()}`);
    }
  } else {
    console.log("\n💡 Note: To execute an owner toggle transaction, set DEMO_TOGGLE=true (and optionally DEMO_RESTORE=true)");
  }

  // -------------------------------------------------------------
  // Part B: ERC-20 Token (Read-Only)
  // -------------------------------------------------------------
  console.log("\n--- [Part B] WorkshopCredit (WSC) Token State ---");
  const tokenName = await creditContract.name();
  const tokenSymbol = await creditContract.symbol();
  const decimals = await creditContract.decimals();
  const totalSupply = await creditContract.totalSupply();
  const ownerBalance = await creditContract.balanceOf(ownerAddress);

  console.log(`1. Token Name:       ${tokenName}`);
  console.log(`2. Token Symbol:     ${tokenSymbol}`);
  console.log(`3. Token Decimals:   ${decimals}`);
  console.log(`4. Total Supply:     ${hre.ethers.formatUnits(totalSupply, decimals)} ${tokenSymbol}`);
  console.log(`5. Deployer Balance: ${hre.ethers.formatUnits(ownerBalance, decimals)} ${tokenSymbol}`);

  // Part B: Optional Test-Token Transfer Demonstration
  if (options.transferTo) {
    console.log(`\n[State-Changing Action Requested: Transfer to ${options.transferTo}]`);
    if (!hre.ethers.isAddress(options.transferTo)) {
      console.error(`❌ Error: Invalid recipient address: '${options.transferTo}'`);
      process.exit(1);
    }

    const signers = await hre.ethers.getSigners();
    if (!signers || signers.length === 0) {
      console.error("❌ Error: No signer available. Set PRIVATE_KEY in backend/.env to execute transfers.");
      process.exit(1);
    }
    const sender = signers[0];
    const amountInUnits = hre.ethers.parseUnits(options.transferAmount, decimals);

    console.log(`Sender:    ${sender.address}`);
    console.log(`Recipient: ${options.transferTo}`);
    console.log(`Amount:    ${options.transferAmount} ${tokenSymbol}`);

    const senderBal = await creditContract.balanceOf(sender.address);
    if (senderBal < amountInUnits) {
      console.error(`❌ Error: Insufficient token balance. Sender has ${hre.ethers.formatUnits(senderBal, decimals)} ${tokenSymbol}`);
      process.exit(1);
    }

    const tx = await creditContract.connect(sender).transfer(options.transferTo, amountInUnits);
    console.log(`Transfer transaction submitted! Hash: ${tx.hash}`);
    console.log("Waiting for block confirmation...");
    const receipt = await tx.wait();
    console.log(`✓ Confirmed in block ${receipt.blockNumber} (Status: ${receipt.status === 1 ? "SUCCESS" : "FAILED"})`);

    const newSenderBal = await creditContract.balanceOf(sender.address);
    const newRecipientBal = await creditContract.balanceOf(options.transferTo);
    console.log(`Updated Sender Balance:    ${hre.ethers.formatUnits(newSenderBal, decimals)} ${tokenSymbol}`);
    console.log(`Updated Recipient Balance: ${hre.ethers.formatUnits(newRecipientBal, decimals)} ${tokenSymbol}`);
  } else {
    console.log("\n💡 Note: To execute a test transfer, set DEMO_TRANSFER_TO=<address> and DEMO_AMOUNT=<amount>");
  }

  console.log("\n===============================================================");
  console.log("             DEMO FINISHED SUCCESSFULLY                        ");
  console.log("===============================================================");
}

async function main() {
  const options = parseOptions();

  if (options.isLocal) {
    await runLocalDemo();
  } else {
    await runSepoliaDemo(options);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Demo failed:", err.message || err);
    process.exit(1);
  });
