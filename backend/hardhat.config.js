require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ override: true });

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

// Safely validate and normalize private key (must be 32 bytes / 64 hex characters)
const cleanPrivateKey = (PRIVATE_KEY || "").trim().replace(/^0x/, "");
const isValidPrivateKey = /^[0-9a-fA-F]{64}$/.test(cleanPrivateKey);
const accounts = isValidPrivateKey ? [`0x${cleanPrivateKey}`] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: accounts,
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
};
