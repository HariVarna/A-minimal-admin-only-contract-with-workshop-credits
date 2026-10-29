const hre = require("hardhat");

async function main() {
  const [admin, participant1, participant2] = await hre.ethers.getSigners();

  console.log("===============================================================");
  console.log("  WORKSHOP CREDIT MANAGEMENT SYSTEM - LIVE PRACTICAL DEMO      ");
  console.log("===============================================================");
  console.log(`Admin Account:        ${admin.address}`);
  console.log(`Participant 1 Account: ${participant1.address}`);
  console.log(`Participant 2 Account: ${participant2.address}`);

  // -----------------------------------------------------------------
  // 1. DEPLOY CONTRACTS
  // -----------------------------------------------------------------
  console.log("\n--- [Step 1] Deploying Contracts ---");
  const WorkshopConfigFactory = await hre.ethers.getContractFactory("WorkshopConfig");
  const config = await WorkshopConfigFactory.deploy();
  await config.waitForDeployment();
  console.log(`✓ WorkshopConfig deployed at: ${await config.getAddress()}`);

  const WorkshopCreditFactory = await hre.ethers.getContractFactory("WorkshopCredit");
  const credit = await WorkshopCreditFactory.deploy();
  await credit.waitForDeployment();
  console.log(`✓ WorkshopCredit deployed at: ${await credit.getAddress()}`);

  // -----------------------------------------------------------------
  // 2. DEMONSTRATE WORKSHOP CONFIG
  // -----------------------------------------------------------------
  console.log("\n--- [Step 2] WorkshopConfig (Admin-Only Configuration) ---");
  let isEnabled = await config.getWorkshopEnabled();
  console.log(`Initial workshop status: ${isEnabled ? "ENABLED" : "DISABLED"}`);

  console.log("\nAdmin toggling workshop to ENABLED...");
  let tx = await config.connect(admin).setWorkshopEnabled(true);
  let receipt = await tx.wait();
  console.log(`✓ Transaction confirmed (TxHash: ${receipt.hash})`);
  console.log(`Updated workshop status: ${await config.getWorkshopEnabled() ? "ENABLED" : "DISABLED"}`);

  console.log("\nNon-admin (Participant 1) attempting to alter configuration...");
  try {
    await config.connect(participant1).setWorkshopEnabled(false);
    console.log("❌ Error: Non-admin should not be able to modify config!");
  } catch (error) {
    console.log("✓ Expected Revert: Non-admin cannot alter workshop configuration.");
    console.log(`  Revert message/error: ${error.message.split("\n")[0]}`);
  }

  console.log("\nAdmin toggling workshop back to DISABLED...");
  tx = await config.connect(admin).setWorkshopEnabled(false);
  await tx.wait();
  console.log(`Current workshop status: ${await config.getWorkshopEnabled() ? "ENABLED" : "DISABLED"}`);

  // -----------------------------------------------------------------
  // 3. DEMONSTRATE WORKSHOP CREDIT (ERC-20)
  // -----------------------------------------------------------------
  console.log("\n--- [Step 3] WorkshopCredit (ERC-20 Token Transfers) ---");
  console.log(`Token Name:     ${await credit.name()}`);
  console.log(`Token Symbol:   ${await credit.symbol()}`);
  console.log(`Token Decimals: ${await credit.decimals()}`);

  const initialSupply = await credit.totalSupply();
  console.log(`Total Supply:   ${hre.ethers.formatUnits(initialSupply, 18)} WSC`);
  console.log(`Admin Balance:  ${hre.ethers.formatUnits(await credit.balanceOf(admin.address), 18)} WSC`);

  console.log("\nDistributing 250 WSC to Participant 1...");
  const grantAmount1 = hre.ethers.parseUnits("250", 18);
  tx = await credit.connect(admin).transfer(participant1.address, grantAmount1);
  await tx.wait();
  console.log(`✓ Transferred 250 WSC to ${participant1.address}`);
  console.log(`  Participant 1 Balance: ${hre.ethers.formatUnits(await credit.balanceOf(participant1.address), 18)} WSC`);

  console.log("\nParticipant 1 forwarding 50 WSC to Participant 2...");
  const peerAmount = hre.ethers.parseUnits("50", 18);
  tx = await credit.connect(participant1).transfer(participant2.address, peerAmount);
  await tx.wait();
  console.log(`✓ Transferred 50 WSC to ${participant2.address}`);
  console.log(`  Participant 1 Balance: ${hre.ethers.formatUnits(await credit.balanceOf(participant1.address), 18)} WSC`);
  console.log(`  Participant 2 Balance: ${hre.ethers.formatUnits(await credit.balanceOf(participant2.address), 18)} WSC`);

  console.log("\nParticipant 2 attempting to transfer 1,000 WSC (exceeding balance of 50 WSC)...");
  try {
    await credit.connect(participant2).transfer(admin.address, hre.ethers.parseUnits("1000", 18));
    console.log("❌ Error: Overdraft transfer should have reverted!");
  } catch (error) {
    console.log("✓ Expected Revert: Insufficient balance rejected by ERC-20 standard.");
  }

  console.log("\n===============================================================");
  console.log("               DEMO FINISHED SUCCESSFULLY                      ");
  console.log("===============================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
