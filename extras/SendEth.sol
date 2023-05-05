// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

// error SendEth__NotEnough();

contract SendEth {
    mapping(string => uint) private recipients;

    event EthSent(address indexed sender, string recipientId, uint256 amount);
    event EthWithdrawn(string recipientId, uint256 amount);

    function sendEth(string[] memory recipientIds) public payable {
        require(msg.value > 0, "Amount Can't Be Zero");
        // if(msg.value < 0){ revert SendEth__NotEnough();}
        uint256 amountPerRecipient = msg.value / recipientIds.length;
        for (uint i = 0; i < recipientIds.length; i++) {
            recipients[recipientIds[i]] += amountPerRecipient;
        }
        // emit EthSent(msg.sender, recipientIds[i], amountPerRecipient);
    }

    function withdrawEth(string memory recipientId) public {
        require(recipients[recipientId] > 0, "No balance to withdraw");
        uint256 amount = recipients[recipientId];
        recipients[recipientId] = 0;
        payable(msg.sender).transfer(amount);
        emit EthWithdrawn(recipientId, amount);
    }
}
