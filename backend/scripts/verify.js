const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
require("dotenv").config({ override: true });

async function main() {
  console.log("==================================================");
  console.log("     ETHEREUM SEPOLIA CONTRACT SOURCE VERIFICATION");
  console.log("==================================================");

  const deploymentFile = path.join(__dirname, "..", "deployments", "sepolia.json");
  if (!fs.existsSync(deploymentFile)) {
    console.error(`\n❌ Error: Deployment record not found at '${deploymentFile}'.`);
    console.error("   Please deploy contracts first using: npm run deploy:sepolia\n");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const configAddress = deploymentData.contracts?.workshopConfig?.address;
  const creditAddress = deploymentData.contracts?.workshopCredit?.address;

  if (!configAddress || !creditAddress) {
    console.error("\n❌ Error: Deployment record missing contract addresses.");
    process.exit(1);
  }

  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  if (!etherscanKey || etherscanKey.trim() === "") {
    console.warn("\n⚠️  Warning: ETHERSCAN_API_KEY environment variable is not set.");
    console.warn("   Verification with Etherscan requires an API key.");
    console.warn("   Sourcify verification will still be attempted.\n");
  }

  console.log(`Found Sepolia deployment from: ${deploymentData.deploymentTimestamp}`);
  console.log(`WorkshopConfig address: ${configAddress}`);
  console.log(`WorkshopCredit address: ${creditAddress}`);

  // 1. Verify WorkshopConfig (no constructor arguments)
  console.log("\n[1/2] Verifying WorkshopConfig source code...");
  try {
    await hre.run("verify:verify", {
      address: configAddress,
      constructorArguments: [],
      contract: "contracts/WorkshopConfig.sol:WorkshopConfig",
    });
    console.log("✓ WorkshopConfig successfully verified on block explorer!");
  } catch (err) {
    if (err.message && err.message.includes("Already Verified")) {
      console.log("✓ WorkshopConfig is already verified on block explorer.");
    } else {
      console.error(`❌ WorkshopConfig verification message: ${err.message}`);
    }
  }

  // 2. Verify WorkshopCredit (no constructor arguments)
  console.log("\n[2/2] Verifying WorkshopCredit source code...");
  try {
    await hre.run("verify:verify", {
      address: creditAddress,
      constructorArguments: [],
      contract: "contracts/WorkshopCredit.sol:WorkshopCredit",
    });
    console.log("✓ WorkshopCredit successfully verified on block explorer!");
  } catch (err) {
    if (err.message && err.message.includes("Already Verified")) {
      console.log("✓ WorkshopCredit is already verified on block explorer.");
    } else {
      console.error(`❌ WorkshopCredit verification message: ${err.message}`);
    }
  }

  console.log("\n==================================================");
  console.log("Explorer Links:");
  console.log(`- WorkshopConfig: https://sepolia.etherscan.io/address/${configAddress}#code`);
  console.log(`- WorkshopCredit: https://sepolia.etherscan.io/address/${creditAddress}#code`);
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification script failed:", err);
    process.exit(1);
  });
