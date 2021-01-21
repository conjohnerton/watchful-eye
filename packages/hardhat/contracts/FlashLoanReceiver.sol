pragma solidity 0.6.12;

import "./aave/mocks/tokens/MintableERC20.sol";
import "./aave/flashloan/base/FlashLoanReceiverBase.sol";
import "./aave/protocol/configuration/LendingPoolAddressesProvider.sol";


contract FlashLoanReceiver is FlashLoanReceiverBase {
    using SafeMath for uint256;

    event borrowMade(address _reserve, uint256 amount , uint256 value);

    constructor(LendingPoolAddressesProvider _provider) FlashLoanReceiverBase(_provider) public {}

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {

        //
        // This contract now has the funds requested.
        // Your logic goes here.
        //
        
        // At the end of your logic above, this contract owes
        // the flashloaned amounts + premiums.
        // Therefore ensure your contract has enough to repay
        // these amounts.
        emit borrowMade(assets[0], amounts[0] , address(this).balance);
        
        // Approve the LendingPool contract allowance to *pull* the owed amount
        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(address(LENDING_POOL), amountOwing);
        }
        
        return true;
    }

    function myFlashLoanCall() public {
        address receiverAddress = address(this);

        address[] memory assets = new address[](2);
        assets[0] = 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD; // Kovan DAI

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 100;

        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](2);
        modes[0] = 0;

        address onBehalfOf = address(this);
        bytes memory params = "";
        uint16 referralCode = 0;

        LENDING_POOL.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }
}