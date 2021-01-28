pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "./aave/mocks/tokens/MintableERC20.sol";
import "./aave/flashloan/base/FlashLoanReceiverBase.sol";
import "./aave/protocol/configuration/LendingPoolAddressesProvider.sol";
import { SafeMath } from './aave/dependencies/openzeppelin/contracts/SafeMath.sol';
import { Ownable } from "./aave/dependencies/openzeppelin/contracts/Ownable.sol";

interface IFakeDebtToCollateralSwapper {
    function repay(address onBehalfOf, uint256 amount) external;
}

interface IFakeLinkToDaiSwapper {
    function doSwap(address fromAsset, address toAsset, uint256 amount) external returns (bool didSwap);
}

// 0xad5ce863ae3e4e9394ab43d4ba0d80f419f61789 Link Test Address

contract TheWatchfulEye is FlashLoanReceiverBase, Ownable {
    using SafeMath for uint256;

    event TheEyeIsWatching(WatchfulEye watcher);
    event TheEyeIsClosed(WatchfulEye watcher);
    event borrowMade(
        address _reserve,
        uint256 amount,
        uint256 value,
        address ownerOfDebt
    );
    event FlashLoanStarted(
        address receiver,
        address[] assets,
        uint256[] amounts,
        bytes params
    );
    event FlashLoanEnded(
        address receiver,
        address[] assets,
        uint256[] amounts,
        bytes params
    );

    struct WatchfulEye {
        address owner;
        uint256 collateralPriceLimit;
        uint256 debtPriceLimit;
        uint256 totalCollateralCount;
        uint256 totalDebtCount;
    }

    WatchfulEye public watchfulEye;
    IFakeLinkToDaiSwapper private _linkToDai;
    IFakeDebtToCollateralSwapper private _debtToCollateral;
    IERC20 linkToken = IERC20(0xAD5ce863aE3E4E9394Ab43d4ba0D80f419F61789);
    IERC20 daiToken = IERC20(0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD);

    constructor(
        LendingPoolAddressesProvider _provider,
        address fakeEthToDaiSwapper,
        address fakeDebtToCollateralSwapper
    ) public FlashLoanReceiverBase(_provider) {
        _linkToDai = IFakeLinkToDaiSwapper(fakeEthToDaiSwapper);
        _debtToCollateral = IFakeDebtToCollateralSwapper(
            fakeDebtToCollateralSwapper
        );
    }

    // Make sure user approves transfer first
    function giveDai(uint256 amount) public {
        (bool success) = daiToken.transferFrom(msg.sender, address(this), amount);
        require(success, "The Watchful Eye did not receive any Dai. Did you forget to approve of the transfer?");
    }

    fallback() external payable {}

    receive() external payable {}

    function repayDebt(uint256[] calldata amounts, address onBehalfOf) public {
        daiToken.approve(address(_debtToCollateral), amounts[0]);
        _debtToCollateral.repay(onBehalfOf, amounts[0]);
    }

    // executeOperation is called by Aave's flashloan contract after we call LENDIND_POOL.flashloan
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        (address ownerOfDebt, uint256 totalCollateralCount) = abi.decode(params, (address, uint256));
        emit borrowMade(
            assets[0],
            amounts[0],
            address(this).balance,
            ownerOfDebt
        );

        // Repay loan using flashloan (dai) Recieve collateral (Link)
        // repayDebt(amounts, ownerOfDebt);
        daiToken.approve(address(_debtToCollateral), amounts[0]);
        _debtToCollateral.repay(ownerOfDebt, amounts[0]);
        
        // Transfer from user to WatchfulEye
        linkToken.transferFrom(ownerOfDebt, address(this), totalCollateralCount);
        linkToken.approve(address(_linkToDai), totalCollateralCount);

        // Swap collateral and get flashloan asset (dai)
        (bool success) = _linkToDai.doSwap(address(linkToken), address(daiToken), totalCollateralCount);

        // Approve the LendingPool contract allowance to *pull* the owed amount
        for (uint256 i = 0; i < assets.length; i++) {
            IERC20 asset = IERC20(assets[i]);
            uint256 amountOwing = amounts[i].add(premiums[i]);
            asset.approve(address(LENDING_POOL), amountOwing);

            uint256 balance = asset.balanceOf(address(this));
            uint256 remainingAfterRepayment = balance.sub(amountOwing); 
            asset.transfer(ownerOfDebt, remainingAfterRepayment);
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
    function addWatchfulEye(
        uint256 collateralPriceLimit,
        uint256 debtPriceLimit,
        uint256 collateralAmount,
        uint256 debtAmount
    ) external {
        // require(
        //     msg.sender == 0xC81E6C9C0e51E785AEcbfF971464d1BFc5739E76,
        //     "Watchful Eye is a test contract. If you're not the creator, you should handle with care. Remove this if you dare."
        // );
        // require(
        //     watchfulEye.owner == address(0x0),
        //     "The eye is focused on another position. Try again later."
        // );

        WatchfulEye memory eye =
            WatchfulEye({
                owner: msg.sender,
                collateralPriceLimit: collateralPriceLimit,
                debtPriceLimit: debtPriceLimit,
                totalCollateralCount: collateralAmount,
                totalDebtCount: debtAmount
            });
        watchfulEye = eye;
        emit TheEyeIsWatching(eye);
    }

    function removeWatchfulEye() external {
        require(
            watchfulEye.owner == msg.sender,
            "Hands off! The eye does not watch over a position of yours... Be patient, your turn will come after the eye finishes its current task."
        );
        emit TheEyeIsClosed(watchfulEye);
        watchfulEye = WatchfulEye({
            owner: address(0x0),
            collateralPriceLimit: 0,
            debtPriceLimit: 0,
            totalCollateralCount: 0,
            totalDebtCount: 0
        });

        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "refund failed");
    }

    // The oracle calls this to see if it needs to call makeFlashLoan
    function isWatchfulEyeConcernedByWhatItSees()
        external
        view
        returns (bool eyeIsProcessable)
    {
        // require(watchfulEye.owner != address(0x0), "The Watchful Eye is currently closed. It sees nothing.");

        // Check prices of the things and return true if the prices are past or at limits.

        return true;
    }

    // It's really expensive to go through all the watchfulEyes,which is the type of thing we'd do if we had more time to implement a 'Watchful Eye Protocol', but it's the easiest hack for us to do with the oracle.
    // To optimize, we could potentially have a `findWatchfulEye`, which would be called by an oracle. `findWatchfulEye` could return
    // the watchfulEye that needs to be processed. The oracle would then be able to use that info in a call to `makeFlashLoan`. This might
    // split each makeFlashLoan into a totally separate transactions. This could potentially cause some problems with liquidation occuring too late.
    function makeFlashLoan() public {
        // Compare the current collateral price and debt price to the limits inside
        address receiverAddress = address(this);

        address[] memory assets = new address[](1);
        assets[0] = 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD; // Kovan DAI

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = watchfulEye.totalDebtCount;
    
        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = msg.sender;
        bytes memory params = abi.encode(msg.sender, watchfulEye.totalCollateralCount);
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
