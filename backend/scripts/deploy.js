const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  console.log("==================================================");
  console.log("Deploying Workshop Management System Contracts");
  console.log(`Network: ${networkName}`);
  console.log(`Deployer Address: ${deployer.address}`);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${hre.ethers.formatEther(balance)} ETH`);
  console.log("==================================================");

  // 1. Deploy WorkshopConfig
  console.log("\n[1/2] Deploying WorkshopConfig...");
  const WorkshopConfigFactory = await hre.ethers.getContractFactory("WorkshopConfig");
  const workshopConfig = await WorkshopConfigFactory.deploy();
  await workshopConfig.waitForDeployment();
  const configAddress = await workshopConfig.getAddress();
  console.log(`✓ WorkshopConfig deployed at: ${configAddress}`);
  console.log(`  - Owner: ${await workshopConfig.owner()}`);
  console.log(`  - Initial workshopEnabled status: ${await workshopConfig.getWorkshopEnabled()}`);

  // 2. Deploy WorkshopCredit
  console.log("\n[2/2] Deploying WorkshopCredit (WSC)...");
  const WorkshopCreditFactory = await hre.ethers.getContractFactory("WorkshopCredit");
  const workshopCredit = await WorkshopCreditFactory.deploy();
  await workshopCredit.waitForDeployment();
  const creditAddress = await workshopCredit.getAddress();
  console.log(`✓ WorkshopCredit deployed at: ${creditAddress}`);
  console.log(`  - Token Name: ${await workshopCredit.name()}`);
  console.log(`  - Token Symbol: ${await workshopCredit.symbol()}`);
  console.log(`  - Decimals: ${await workshopCredit.decimals()}`);
  const totalSupply = await workshopCredit.totalSupply();
  console.log(`  - Total Supply: ${hre.ethers.formatUnits(totalSupply, 18)} WSC`);
  console.log(`  - Deployer WSC Balance: ${hre.ethers.formatUnits(await workshopCredit.balanceOf(deployer.address), 18)} WSC`);

  console.log("\n==================================================");
  console.log("Deployment completed successfully!");
  console.log("Addresses to save:");
  console.log(`WorkshopConfig: ${configAddress}`);
  console.log(`WorkshopCredit: ${creditAddress}`);
  console.log("==================================================");

  return {
    workshopConfig: configAddress,
    workshopCredit: creditAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
