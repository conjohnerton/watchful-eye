pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "./aave/mocks/tokens/MintableERC20.sol";
import "./aave/flashloan/base/FlashLoanReceiverBase.sol";
import "./aave/protocol/configuration/LendingPoolAddressesProvider.sol";

interface I1InchFakeSwap {
    function doSwap(address fromAddress) external payable;
}

contract TheWatchfulEye is FlashLoanReceiverBase {
    using SafeMath for uint256;

    event borrowMade(address _reserve, uint256 amount , uint256 value);
    event FlashLoanStarted(address receiver, address[] assets, uint256[] amounts, bytes params);
    event FlashLoanEnded(address receiver, address[] assets, uint256[] amounts, bytes params);
    event TheEyeIsWatching(WatchfulEye watcher);
    event TheEyeIsClosed(WatchfulEye watcher);

    struct WatchfulEye {
        address owner;
        uint256 collateralPriceLimit;
        uint256 debtPriceLimit;
    }

    WatchfulEye watchfulEye;

    constructor(LendingPoolAddressesProvider _provider) FlashLoanReceiverBase(_provider) public {}

    fallback() external payable {

    }

    receive() external payable {
        
    }

    // executeOperation is called by Aave's flashloan contract after we call LENDIND_POOL.flashloan
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        emit borrowMade(assets[0], amounts[0] , address(this).balance);

        // Repay loan using flashloan (dai)
        // Recieve collateral ?? (Link)
        // Swap collateral and get flashloan asset (dai)

        
        // At the end of your logic above, this contract owes
        // the flashloaned amounts + premiums.
        // Therefore ensure your contract has enough to repay
        // these amounts.
        
        
        // Approve the LendingPool contract allowance to *pull* the owed amount
        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(address(LENDING_POOL), amountOwing);
        }
        
        return true;
    }

    function isWatchfulEyeOpen() external view returns (bool isOpen) {
        if (watchfulEye.owner == address(0x0)) {
            return true;
        }

        return false;
    }

    // Adds user debt and stop loss to state.
    // The function is payable since we store a bit of the user's ETH to pay for gas, 
    // which is paid back after the user's Watchful Eye is processed or cancelled. 
    function addWatchfulEye(uint256 collateralPriceLimit, uint256 debtPriceLimit) external payable {
        require(msg.value >= 0.1 ether, "The Watchful Eye wishes you would  support its wakefulness (by sending at least 0.1 ether).");
        require(msg.sender == 0xC81E6C9C0e51E785AEcbfF971464d1BFc5739E76, "Watchful Eye is a test contract. If you're not the creator, you should handle with care. Remove this if you dare." );
        require(watchfulEye.owner == address(0x0), "The eye is focused on another position. Try again later.");

        WatchfulEye memory eye = WatchfulEye({ owner: msg.sender, collateralPriceLimit: collateralPriceLimit, debtPriceLimit: debtPriceLimit });
        watchfulEye = eye;
        emit TheEyeIsWatching(eye); 
    }

    function removeWatchfulEye() external {
        require(watchfulEye.owner == msg.sender, "Hands off! The eye does not watch over a position of yours... Be patient, your turn will come after the eye finishes its current task.");
        emit TheEyeIsClosed(watchfulEye);
        watchfulEye = WatchfulEye({ owner: address(0x0), collateralPriceLimit: 0, debtPriceLimit: 0});

        (bool success,) = msg.sender.call{ value: address(this).balance }("");
        require(success, "refund failed");
    }

    // It's really expensive to go through all the watchfulEyes,which is the type of thing we'd do if we had more time to implement a 'Watchful Eye Protocal', but it's the easiest hack for us to do with the oracle.
    // To optimize, we could potentially have a `findWatchfulEye`, which would be called by an oracle. `findWatchfulEye` could return 
    // the watchfulEye that needs to be processed. The oracle would then be able to use that info in a call to `makeFlashLoan`. This might 
    // split each makeFlashLoan into a totally separate transactions. This could potentially cause some problems with liquidation occuring too late.
    function makeFlashLoan() public {
        // Compare the current collateral price and debt price to the limits inside 
        address receiverAddress = address(this);

        address[] memory assets = new address[](1);
        assets[0] = 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD; // Kovan DAI

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 10000000;

        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = msg.sender;
        bytes memory params = "";
        uint16 referralCode = 0;

        emit FlashLoanStarted(receiverAddress, assets, amounts, params);
        LENDING_POOL.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
        emit FlashLoanEnded(receiverAddress, assets, amounts, params);
    }
}