// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorkshopCredit
 * @notice ERC-20 token representing workshop credits.
 * @dev Inherits OpenZeppelin ERC20 and Ownable implementations.
 */
contract WorkshopCredit is ERC20, Ownable {
    /// @notice Initial supply of 100,000 WSC tokens in base units (100,000 * 10^18).
    uint256 public constant INITIAL_SUPPLY = 100_000 * 10 ** 18;

    /**
     * @notice Initializes token name and symbol, sets ownership to deployer,
     * and mints the initial supply to the deployer.
     */
    constructor() ERC20("Workshop Credit", "WSC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
