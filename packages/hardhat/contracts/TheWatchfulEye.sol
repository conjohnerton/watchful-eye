pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

// import "./aave/mocks/tokens/MintableERC20.sol";
import "hardhat/console.sol";
import "./aave/flashloan/base/FlashLoanReceiverBase.sol";
import "./aave/protocol/configuration/LendingPoolAddressesProvider.sol";
import "./1Inch/IOneSplit.sol";
import {
    SafeMath
} from "./aave/dependencies/openzeppelin/contracts/SafeMath.sol";
import {Ownable} from "./aave/dependencies/openzeppelin/contracts/Ownable.sol";

interface IFakeDebtToCollateralSwapper {
    function repay(
        address onBehalfOf,
        address debtAsset,
        uint256 amount,
        address collateralAsset
    ) external;
}

interface IFakeLinkToDaiSwapper {
    function doSwap(
        address fromAsset,
        address toAsset,
        uint256 amount
    ) external returns (bool didSwap);
}

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
        address debtAsset;
        address collateralAsset;
        address collateralReserveAsset;
    }

    WatchfulEye public watchfulEye;
    IFakeLinkToDaiSwapper private _linkToDai;
    IFakeDebtToCollateralSwapper private _debtToCollateral;
    IOneSplit private _oneInch;

    constructor(
        LendingPoolAddressesProvider _provider,
        address oneInch
    ) public FlashLoanReceiverBase(_provider) {
        _oneInch = IOneSplit(oneInch);
    }

    function getWatchfulEye() public view returns (WatchfulEye memory) {
        return watchfulEye;
    }

    fallback() external payable {}

    receive() external payable {}

    // executeOperation is called by Aave's flashloan contract after we call LENDIND_POOL.flashloan
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // Repay the debt 
        {
            (
                address ownerOfDebt,
                uint256 totalCollateralCount,
                address debtAsset,
                address collateralAsset,

            ) =
                abi.decode(
                    params,
                    (address, uint256, address, address, address)
                );

            IERC20(debtAsset).approve(address(LENDING_POOL), amounts[0]);
            LENDING_POOL.repay(debtAsset, amounts[0], 1, ownerOfDebt);
        }

        // Swap aToken to reserve token on Aave
        {
            (
                address ownerOfDebt,
                uint256 totalCollateralCount,
                address debtAsset,
                address collateralAsset,
                address reserveAsset
            ) =
                abi.decode(
                    params,
                    (address, uint256, address, address, address)
                );

            console.log(
                "Collateral balance",
                IERC20(collateralAsset).balanceOf(ownerOfDebt)
            );
            console.log("Collateral count", totalCollateralCount);

            // Transfer from user to WatchfulEye
            IERC20(collateralAsset).transferFrom(
                ownerOfDebt,
                address(this),
                totalCollateralCount
            );

            // Approve of transfer to Aave
            IERC20(collateralAsset).approve(
                address(LENDING_POOL),
                totalCollateralCount
            );

            // Swap the aToken for it's normal token on Aave
            LENDING_POOL.withdraw(
                reserveAsset,
                totalCollateralCount,
                address(this)
            );

            console.log(
                "reserve balance",
                IERC20(reserveAsset).balanceOf(address(this))
            );
            console.log("Collateral count", totalCollateralCount);
        }

        // Swap reserve asset to debt asset using 1Inch
        {
            (
                address ownerOfDebt,
                uint256 totalCollateralCount,
                address debtAsset,
                ,
                address reserveAsset
            ) =
                abi.decode(
                    params,
                    (address, uint256, address, address, address)
                );

            IERC20(reserveAsset).approve(
                address(_oneInch),
                totalCollateralCount
            );

            (uint256 rate, uint256[] memory distribution) =
                _oneInch.getExpectedReturn(
                    IERC20(reserveAsset),
                    IERC20(debtAsset),
                    totalCollateralCount,
                    3,
                    0
                );

            require(
                rate >= amounts[0].add(premiums[0]),
                "The collateral swap would not return enough of the debt asset to pay the flashloan"
            );

            uint256 returnAmount =
                _oneInch.swap(
                    IERC20(reserveAsset),
                    IERC20(debtAsset),
                    totalCollateralCount,
                    0,
                    distribution,
                    0
                );
        }

        (address ownerOfDebt, , , , address reserveAsset) =
            abi.decode(params, (address, uint256, address, address, address));
            
        // Approve the LendingPool contract allowance to *pull* the owed amount
        for (uint256 i = 0; i < assets.length; i++) {
            IERC20 asset = IERC20(assets[i]);
            uint256 amountOwing = amounts[i].add(premiums[i]);
            asset.approve(address(LENDING_POOL), amountOwing);

            uint256 balance = asset.balanceOf(address(this));
            uint256 remainingAfterRepayment = balance.sub(amountOwing);
            asset.transfer(ownerOfDebt, remainingAfterRepayment);
        }

        IERC20(reserveAsset).transfer(ownerOfDebt, IERC20(reserveAsset).balanceOf(address(this)));

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
        uint256 debtAmount,
        address debtAsset,
        address collateralAsset,
        address collateralReserve
    ) external {
        WatchfulEye memory eye =
            WatchfulEye({
                owner: msg.sender,
                collateralPriceLimit: collateralPriceLimit,
                debtPriceLimit: debtPriceLimit,
                totalCollateralCount: collateralAmount,
                totalDebtCount: debtAmount,
                debtAsset: debtAsset,
                collateralAsset: collateralAsset,
                collateralReserveAsset: collateralReserve
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
            totalDebtCount: 0,
            debtAsset: address(0x0),
            collateralAsset: address(0x0),
            collateralReserveAsset: address(0x0)
        });
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
        assets[0] = watchfulEye.debtAsset; // Kovan DAI

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = watchfulEye.totalDebtCount;

        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = msg.sender;
        bytes memory params =
            abi.encode(
                msg.sender,
                watchfulEye.totalCollateralCount,
                watchfulEye.debtAsset,
                watchfulEye.collateralAsset,
                watchfulEye.collateralReserveAsset
            );
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
