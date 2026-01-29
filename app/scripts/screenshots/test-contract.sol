// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestToken
 * @dev A simple ERC20 token for testing
 */
contract TestToken is ERC20, Ownable {
    uint256 public maxSupply;

    event TokensMinted(address indexed to, uint256 amount);

    error MaxSupplyExceeded(uint256 requested, uint256 available);

    constructor(string memory name, string memory symbol, uint256 _maxSupply)
        ERC20(name, symbol)
        Ownable(msg.sender)
    {
        maxSupply = _maxSupply;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > maxSupply) {
            revert MaxSupplyExceeded(amount, maxSupply - totalSupply());
        }
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
