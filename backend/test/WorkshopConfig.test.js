const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WorkshopConfig Contract", function () {
  let workshopConfig;
  let owner;
  let nonOwner;
  let anotherAccount;

  beforeEach(async function () {
    [owner, nonOwner, anotherAccount] = await ethers.getSigners();

    const WorkshopConfigFactory = await ethers.getContractFactory("WorkshopConfig");
    workshopConfig = await WorkshopConfigFactory.deploy();
    await workshopConfig.waitForDeployment();
  });

  describe("Deployment and Initial State", function () {
    it("1. Should deploy successfully with a valid contract address", async function () {
      const address = await workshopConfig.getAddress();
      expect(address).to.be.properAddress;
    });

    it("2. Should confirm the deployer is set as the contract owner", async function () {
      expect(await workshopConfig.owner()).to.equal(owner.address);
    });

    it("3. Should confirm the initial workshopEnabled configuration is false", async function () {
      expect(await workshopConfig.getWorkshopEnabled()).to.equal(false);
    });
  });

  describe("Configuration Updates and Access Control", function () {
    it("4. Should confirm the owner can enable the configuration", async function () {
      await workshopConfig.connect(owner).setWorkshopEnabled(true);
      expect(await workshopConfig.getWorkshopEnabled()).to.equal(true);
    });

    it("5. Should confirm the owner can disable the configuration after enabling", async function () {
      await workshopConfig.connect(owner).setWorkshopEnabled(true);
      expect(await workshopConfig.getWorkshopEnabled()).to.equal(true);

      await workshopConfig.connect(owner).setWorkshopEnabled(false);
      expect(await workshopConfig.getWorkshopEnabled()).to.equal(false);
    });

    it("6. Should confirm non-owner setter calls revert", async function () {
      await expect(
        workshopConfig.connect(nonOwner).setWorkshopEnabled(true)
      ).to.be.revertedWithCustomError(workshopConfig, "OwnableUnauthorizedAccount")
        .withArgs(nonOwner.address);

      // Verify the status remained unchanged
      expect(await workshopConfig.getWorkshopEnabled()).to.equal(false);
    });

    it("7. Should confirm the getter is publicly accessible by any account", async function () {
      // Owner reading
      expect(await workshopConfig.connect(owner).getWorkshopEnabled()).to.equal(false);

      // Non-owner reading
      expect(await workshopConfig.connect(nonOwner).getWorkshopEnabled()).to.equal(false);

      // Random third party reading after state update
      await workshopConfig.connect(owner).setWorkshopEnabled(true);
      expect(await workshopConfig.connect(anotherAccount).getWorkshopEnabled()).to.equal(true);
    });

    it("8. Should confirm the expected event and event arguments on status changes", async function () {
      // Test enabling
      await expect(workshopConfig.connect(owner).setWorkshopEnabled(true))
        .to.emit(workshopConfig, "WorkshopConfigUpdated")
        .withArgs(true, owner.address);

      // Test disabling
      await expect(workshopConfig.connect(owner).setWorkshopEnabled(false))
        .to.emit(workshopConfig, "WorkshopConfigUpdated")
        .withArgs(false, owner.address);
    });
  });
});
