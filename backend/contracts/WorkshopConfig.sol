// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorkshopConfig
 * @notice An admin-only configuration contract to manage workshop availability.
 * @dev Inherits OpenZeppelin Ownable for access control.
 */
contract WorkshopConfig is Ownable {
    /// @notice Indicates whether the workshop is currently enabled.
    bool private workshopEnabled;

    /// @notice Emitted whenever the workshop configuration status is updated.
    /// @param enabled New status of workshop availability.
    /// @param updatedBy Address of the account that triggered the status change.
    event WorkshopConfigUpdated(bool indexed enabled, address indexed updatedBy);

    /**
     * @notice Initializes the contract.
     * @dev Sets the deployer as the initial owner and initializes workshopEnabled to false.
     */
    constructor() Ownable(msg.sender) {
        workshopEnabled = false;
    }

    /**
     * @notice Sets the workshop enabled configuration flag.
     * @dev Restricted to the contract owner.
     * @param enabled The new boolean status for workshop availability.
     */
    function setWorkshopEnabled(bool enabled) external onlyOwner {
        workshopEnabled = enabled;
        emit WorkshopConfigUpdated(enabled, _msgSender());
    }

    /**
     * @notice Reads the current workshop enabled configuration flag.
     * @dev Publicly accessible view function.
     * @return Current boolean status of workshop availability.
     */
    function getWorkshopEnabled() external view returns (bool) {
        return workshopEnabled;
    }
}
