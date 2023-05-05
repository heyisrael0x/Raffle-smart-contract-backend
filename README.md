# Decentralized Lottery with Hardhat

This is a decentralized lottery project built with Hardhat, a popular development environment for building Ethereum smart contracts. With this project, users can enter a lottery by sending Ether to a smart contract, and a random winner will be selected after a certain time interval. The winner will receive all the Ether that has been collected from all participants.

## Setup

Before getting started, make sure you have the following tools installed:

- Node.js (v14 or later)
- npm or Yarn
- Hardhat (v2 or later)
- Ethereum wallet such as MetaMask

To get started with this project, follow these steps:

1. Clone the repository and navigate to the project directory:
    git clone https://github.com/gb0g0/Raffle-smart-contract-backend.git
    cd <project-name>
2. Install the project dependencies:
    npm install
3. Create a new file named `.env` in the project directory and add the following configuration:
    PRIVATE_KEY = <private_key>
    RPC_URL = <rpc_url>
    Replace `<rpc_url>` with your own Infura API key, and `<private_key>` with your Ethereum wallet private key.
4. Compile the smart contracts:
    npx hardhat compile
5. Deploy the smart contract to the network:
    npx hardhat run scripts/deploy.js --network <network-name>

## License

This project is licensed under the MIT License.

## Acknowledgments

- This project was built with the help of Hardhat and its documentation.
- Thanks to the Ethereum community for building amazing tools and technologies for decentralized applications.