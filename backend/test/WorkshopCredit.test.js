const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WorkshopCredit Token Contract", function () {
  let workshopCredit;
  let deployer;
  let recipient;
  let thirdParty;

  const EXPECTED_NAME = "Workshop Credit";
  const EXPECTED_SYMBOL = "WSC";
  const EXPECTED_DECIMALS = 18n;
  const EXPECTED_INITIAL_SUPPLY = ethers.parseUnits("100000", 18); // 100,000 * 10^18

  beforeEach(async function () {
    [deployer, recipient, thirdParty] = await ethers.getSigners();

    const WorkshopCreditFactory = await ethers.getContractFactory("WorkshopCredit");
    workshopCredit = await WorkshopCreditFactory.deploy();
    await workshopCredit.waitForDeployment();
  });

  describe("Deployment and Token Metadata", function () {
    it("1. Should deploy successfully with a valid contract address", async function () {
      const address = await workshopCredit.getAddress();
      expect(address).to.be.properAddress;
    });

    it("2. Should verify token name is 'Workshop Credit'", async function () {
      expect(await workshopCredit.name()).to.equal(EXPECTED_NAME);
    });

    it("3. Should verify token symbol is 'WSC'", async function () {
      expect(await workshopCredit.symbol()).to.equal(EXPECTED_SYMBOL);
    });

    it("4. Should verify decimals is 18", async function () {
      expect(await workshopCredit.decimals()).to.equal(EXPECTED_DECIMALS);
    });

    it("5. Should verify the initial total supply is 100,000 tokens in base units", async function () {
      const totalSupply = await workshopCredit.totalSupply();
      expect(totalSupply).to.equal(EXPECTED_INITIAL_SUPPLY);
    });

    it("6. Should verify the deployer receives all initial tokens", async function () {
      const deployerBalance = await workshopCredit.balanceOf(deployer.address);
      expect(deployerBalance).to.equal(EXPECTED_INITIAL_SUPPLY);
      expect(await workshopCredit.owner()).to.equal(deployer.address);
    });
  });

  describe("Token Transfers and Balance Accounting", function () {
    const transferAmount = ethers.parseUnits("1500", 18);

    it("7. Should transfer tokens to a second account", async function () {
      const tx = await workshopCredit.connect(deployer).transfer(recipient.address, transferAmount);
      await tx.wait();

      expect(await workshopCredit.balanceOf(recipient.address)).to.equal(transferAmount);
    });

    it("8. Should verify sender and recipient balances after transfer", async function () {
      const initialDeployerBalance = await workshopCredit.balanceOf(deployer.address);
      const initialRecipientBalance = await workshopCredit.balanceOf(recipient.address);

      await workshopCredit.connect(deployer).transfer(recipient.address, transferAmount);

      const finalDeployerBalance = await workshopCredit.balanceOf(deployer.address);
      const finalRecipientBalance = await workshopCredit.balanceOf(recipient.address);

      expect(finalDeployerBalance).to.equal(initialDeployerBalance - transferAmount);
      expect(finalRecipientBalance).to.equal(initialRecipientBalance + transferAmount);
    });

    it("9. Should verify the standard Transfer event is emitted with correct parameters", async function () {
      await expect(workshopCredit.connect(deployer).transfer(recipient.address, transferAmount))
        .to.emit(workshopCredit, "Transfer")
        .withArgs(deployer.address, recipient.address, transferAmount);
    });

    it("10. Should verify that a transfer exceeding the sender's balance reverts", async function () {
      const excessiveAmount = ethers.parseUnits("1", 18);
      // Recipient currently has 0 tokens
      await expect(
        workshopCredit.connect(recipient).transfer(thirdParty.address, excessiveAmount)
      ).to.be.revertedWithCustomError(workshopCredit, "ERC20InsufficientBalance")
        .withArgs(recipient.address, 0n, excessiveAmount);

      // Deployer attempting to transfer more than initial supply
      const moreThanSupply = EXPECTED_INITIAL_SUPPLY + 1n;
      await expect(
        workshopCredit.connect(deployer).transfer(recipient.address, moreThanSupply)
      ).to.be.revertedWithCustomError(workshopCredit, "ERC20InsufficientBalance")
        .withArgs(deployer.address, EXPECTED_INITIAL_SUPPLY, moreThanSupply);
    });

    it("11. Should verify that transfers respect ERC-20 balance accounting across multiple hops", async function () {
      const hop1Amount = ethers.parseUnits("5000", 18);
      const hop2Amount = ethers.parseUnits("2000", 18);

      // Deployer -> Recipient
      await workshopCredit.connect(deployer).transfer(recipient.address, hop1Amount);
      expect(await workshopCredit.balanceOf(recipient.address)).to.equal(hop1Amount);

      // Recipient -> ThirdParty
      await workshopCredit.connect(recipient).transfer(thirdParty.address, hop2Amount);
      expect(await workshopCredit.balanceOf(thirdParty.address)).to.equal(hop2Amount);
      expect(await workshopCredit.balanceOf(recipient.address)).to.equal(hop1Amount - hop2Amount);

      // Total supply must remain invariant
      const totalSupply = await workshopCredit.totalSupply();
      const sumOfBalances =
        (await workshopCredit.balanceOf(deployer.address)) +
        (await workshopCredit.balanceOf(recipient.address)) +
        (await workshopCredit.balanceOf(thirdParty.address));

      expect(sumOfBalances).to.equal(totalSupply);
      expect(totalSupply).to.equal(EXPECTED_INITIAL_SUPPLY);
    });
  });
});
