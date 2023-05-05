const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Test", function () {
      let raffle,
        vrfCoordinatorV2Mock,
        Interval,
        interval,
        EntranceFee,
        deployer;
      const chainId = network.config.chainId;
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["mocks", "raffle"]);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        raffle = await ethers.getContract("Raffle", deployer);
        Interval = networkConfig[chainId]["interval"];
        EntranceFee = networkConfig[chainId]["entranceFee"];
      });
      describe("constructor", async () => {
        it("initalizes the raffle correctly", async function () {
          const raffleState = await raffle.getRaffleState();
          interval = await raffle.getInterval();
          assert.equal(raffleState.toString(), "0");
          assert.equal(interval.toString(), Interval);
        });
      });
      describe("enterRaffle", function () {
        it("revert when you don't pay enough", async () => {
          await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
            raffle,
            "Raffle__NotEnoughEthEntered"
          );
        });
        it("revert if raffle is not open", async () => {
          await raffle.enterRaffle({ value: EntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await raffle.performUpkeep("0x");
          await expect(
            raffle.enterRaffle({ value: EntranceFee })
          ).to.be.revertedWithCustomError(raffle, "Raffle__NotOpen");
        });
        it("records the players when they enter", async () => {
          await raffle.enterRaffle({ value: EntranceFee });
          playerFromContract = await raffle.getPlayers(0);
          assert.equal(playerFromContract, deployer);
        });
        it("emits event on enter", async () => {
          await expect(raffle.enterRaffle({ value: EntranceFee })).to.emit(
            raffle,
            "RaffleEnter"
          );
        });
      });
      describe("checkUpkeep", () => {
        it("returns false if people have not sent any ETH😒", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upKeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          assert(!upKeepNeeded);
        });
        it("returns false if raffle is not open", async () => {
          await raffle.enterRaffle({ value: EntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await raffle.performUpkeep("0x");
          const raffleState = await raffle.getRaffleState();
          const { upKeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          assert.equal(raffleState.toString(), "1");
          assert.equal(upKeepNeeded, false);
        });
        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: EntranceFee });
          const { upKeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          assert.equal(upKeepNeeded, false);
        });
        it("returns true if isOpen, timePassed, hasPlayers, hasBalance returns true🚀", async () => {
          await raffle.enterRaffle({ value: EntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upKeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          assert.equal(upKeepNeeded, true);
        });
      });
      describe("performUpKeep", () => {
        it("can only run when CheckUpkeep return true", async () => {
          await raffle.enterRaffle({ value: EntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const tx = await raffle.performUpkeep("0x");
          assert(tx);
        });
        it("revert when checkUpkeep returns false", async () => {
          await expect(raffle.performUpkeep([])).to.be.revertedWithCustomError(
            raffle,
            "Raffle__UpKeepNotNeeded"
          );
        });
        it("updates the raffle state, emit an event and calls the vrf coordinator", async () => {
          await raffle.enterRaffle({ value: EntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const txResponse = await raffle.performUpkeep("0x");
          const txReceipt = await txResponse.wait();
          const requestId = txReceipt.events[1].args.requestId;
          const raffleState = await raffle.getRaffleState();
          assert(requestId.toNumber() > 0);
          assert.equal(raffleState.toString(), "1");
        });
      });
      describe("fulfillRandomWords", () => {
        beforeEach(async () => {
          await raffle.enterRaffle({ value: EntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
        });
        it("can only be called after performUpkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWith("nonexistent request");
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
          ).to.be.revertedWith("nonexistent request");
        });
        it("picks a winner, reset the lottery, and sends more", async () => {
          const additionalEntrants = 3;
          const startingAccountIndex = 1;
          const accounts = await ethers.getSigners();
          for (
            let i = startingAccountIndex;
            i < startingAccountIndex + additionalEntrants;
            i++
          ) {
            const accountConnectedRaffle = raffle.connect(accounts[i]);
            await accountConnectedRaffle.enterRaffle({ value: EntranceFee });
          }
          const startingTimeStamp = await raffle.getLastTimeStamp();

          // performUpkeep (mock the keepers)
          // fullfillRandomWords(mock being chainLinkvrf )
          // we will have to wait for the fullfillRandomWords to be called
          await new Promise(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
              console.log("found the event!");
              try {
                const recentWinner = await raffle.getRecentWinner();
                console.log(recentWinner);
                console.log(accounts[3].address);
                console.log(accounts[0].address);
                console.log(accounts[2].address);
                console.log(accounts[1].address);
                const raffleState = await raffle.getRaffleState();
                const endingTimeStamp = await raffle.getLastTimeStamp();
                const numPlayer = await raffle.getNumberPlayers();
                const winnerEndingBalance = await accounts[1].getBalance();

                assert.equal(numPlayer.toString(), "0");
                assert.equal(raffleState.toString(), "0");
                assert(endingTimeStamp > startingTimeStamp);
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance.add(
                    EntranceFee.mul(additionalEntrants)
                      .add(EntranceFee)
                      .toString()
                  )
                );
              } catch (e) {
                reject(e);
              }
              resolve();
            });
            // setting up the listener
            // below, we will fire the event, and the listener will pick it up
            const txResponse = await raffle.performUpkeep("0x");
            const txReceipt = await txResponse.wait();
            const winnerStartingBalance = await accounts[1].getBalance();
            const requestId = txReceipt.events[1].args.requestId;
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              requestId,
              raffle.address
            );
          });
        });
      });
    });
