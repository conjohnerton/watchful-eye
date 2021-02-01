pragma solidity 0.6.12;

import "./aave/dependencies/openzeppelin/contracts/IERC20.sol";
import {
    SafeMath
} from "./aave/dependencies/openzeppelin/contracts/SafeMath.sol";
import {Ownable} from "./aave/dependencies/openzeppelin/contracts/Ownable.sol";

contract FakeDebtToCollateralSwapper is Ownable {
    using SafeMath for uint256;

    event SwapDone(address _reserve, uint256 amount, uint256 sent);

    constructor() Ownable() public {}

    receive() external payable {}

    function repay(address onBehalfOf, address debtAsset, uint256 amount, address collateralAsset) external {
        (bool successOne) = IERC20(debtAsset).transferFrom(msg.sender, address(this), amount);
        require(successOne, "Could not transfer from The Watchful Eye to FakeDebtToCollateralSwapper.");
        (bool successTwo) = IERC20(collateralAsset).transfer(onBehalfOf, IERC20(collateralAsset).balanceOf(address(this)));
        require(successTwo, "Could not transfer from FakeDebtToCollateralSwapper to The Watchful Eye.");
        emit SwapDone(msg.sender, amount, amount);
    }
}
