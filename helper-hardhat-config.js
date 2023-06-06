const { ethers } = require("hardhat");

const networkConfig = {
  11155111: {
    name: "sepolia",
    vrfCoordinatorV2: "0x8103B0A8A00be2DDC7­78e6e7eaa21791Cd3646­25",
    entranceFee: "0.01",
    gasLane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    subscriptionId: "0", // This will be gotten from chainlink
    callbackGasLimit: "500000",
    interval: "30",
  },
  31337: {
    name: "hardhat",
    entranceFee: ethers.utils.parseEther("0.1"),
    gasLane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    callbackGasLimit: "500000",
    interval: "30",
  },
  1337: {
    name: "ganache",
    entranceFee: ethers.utils.parseEther("0.1"),
    gasLane:
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
    callbackGasLimit: "500000",
    interval: "30",
  },
};

const developmentChains = ["localhost", "hardhat", "ganache"];
const FRONTEND_ADDRESSES_FILE =
  "../Raffle-Frontend/src/constants/contractAddress.json";
const FRONTEND_ABI_FILE = "../Raffle-Frontend/src/constants/abi.json";


module.exports = {
  networkConfig,
  developmentChains,
  FRONTEND_ADDRESSES_FILE,
  FRONTEND_ABI_FILE
};
